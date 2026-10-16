import Stripe from "stripe"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import {
  insertLedgerEntries,
  previewRentalConversion,
  type LedgerRow,
} from "@/lib/ownership-credit-ledger"
import { notifyReadyToFinalize } from "@/lib/ownership-ready-email"

/**
 * UNICA via para empezar Modo Colecciona. La usan convert-to-collect y
 * ownership-progress (POST con mode='collect').
 *
 * 1) Calcula las facturas pagadas elegibles (previewRentalConversion).
 * 2) Crea el progreso 'active'.
 * 3) Las registra en ownership_credit_entries (source='rental_conversion').
 * 4) Fija accumulated (limitado al precio).
 * 5) Cancela el registro Descubre activo del mismo bolso (solo Descubre).
 *
 * Nunca marca 'completed': si el credito cubre el precio queda 'active' y se avisa
 * a la socia de que ya puede finalizar en /ownership/complete.
 */

export type StartCollectFailureCode =
  | "bag_not_collectable"
  | "already_collect"
  | "ledger_unavailable"
  | "invoices_unavailable"
  | "insert_failed"
  | "credit_failed"

export type StartCollectResult =
  | {
      ok: true
      progress_id: string
      progress: Record<string, unknown>
      initial_credit: number
      invoices_claimed: number
      ready_to_finalize: boolean
    }
  | {
      ok: false
      code: StartCollectFailureCode
      status: number
      message: string
      progress_id?: string
    }

interface Deps {
  supabase?: SupabaseClient
  stripe?: Stripe
}

const fail = (
  code: StartCollectFailureCode,
  status: number,
  message: string,
  progress_id?: string,
): StartCollectResult => ({ ok: false, code, status, message, progress_id })

export async function startCollectProgress(
  userId: string,
  bagId: string,
  deps: Deps = {},
): Promise<StartCollectResult> {
  const supabase =
    deps.supabase ??
    createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  const stripe =
    deps.stripe ??
    new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
    })

  const { data: bag } = await supabase
    .from("bags")
    .select("id, purchase_price")
    .eq("id", bagId)
    .maybeSingle()

  if (!bag || bag.purchase_price == null || Number(bag.purchase_price) <= 0) {
    return fail("bag_not_collectable", 400, "Este bolso no está disponible en Modo Colecciona")
  }
  const target = Number(bag.purchase_price)

  const { data: existingCollect } = await supabase
    .from("ownership_progress")
    .select("id")
    .eq("user_id", userId)
    .eq("bag_id", bagId)
    .eq("mode", "collect")
    .eq("status", "active")
    .limit(1)
    .maybeSingle()
  if (existingCollect) {
    return fail("already_collect", 409, "Ya estás en Modo Colecciona con este bolso", existingCollect.id)
  }

  let preview
  try {
    preview = await previewRentalConversion(supabase, stripe, userId)
  } catch (err) {
    console.error("[v0] startCollectProgress no se pudieron leer las facturas pagadas:", err)
    return fail("invoices_unavailable", 502, "No se pudieron calcular tus cuotas pagadas. Inténtalo de nuevo.")
  }
  if (!preview.ledger_available) {
    return fail("ledger_unavailable", 503, "El libro de crédito no está disponible todavía. Inténtalo más tarde.")
  }

  const { data: created, error: insertErr } = await supabase
    .from("ownership_progress")
    .insert({
      user_id: userId,
      bag_id: bagId,
      mode: "collect",
      purchase_price: target,
      accumulated: 0,
      status: "active",
    })
    .select("id")
    .single()
  if (insertErr || !created) {
    console.error("[v0] startCollectProgress insert error:", insertErr)
    return fail("insert_failed", 500, "No se pudo crear el progreso")
  }

  let initialCredit = 0
  let invoicesClaimed = 0
  try {
    const rows: LedgerRow[] = preview.eligible.map((invoice) => ({
      ownership_progress_id: created.id,
      user_id: userId,
      stripe_invoice_id: invoice.id,
      amount_cents: invoice.amount_cents,
      source: "rental_conversion",
    }))
    // Solo cuentan las filas realmente insertadas: si otra peticion se adelanto, no se duplica.
    const inserted = await insertLedgerEntries(supabase, rows)
    invoicesClaimed = inserted.length
    const creditCents = inserted.reduce((total, row) => total + row.amount_cents, 0)
    initialCredit = Math.round(Math.min(creditCents / 100, target) * 100) / 100

    if (initialCredit > 0) {
      const { error: updateErr } = await supabase
        .from("ownership_progress")
        .update({ accumulated: initialCredit, updated_at: new Date().toISOString() })
        .eq("id", created.id)
      if (updateErr) throw updateErr
    }
  } catch (err) {
    console.error("[v0] startCollectProgress error aplicando el credito:", err)
    await supabase.from("ownership_credit_entries").delete().eq("ownership_progress_id", created.id)
    await supabase.from("ownership_progress").delete().eq("id", created.id)
    return fail("credit_failed", 500, "No se pudo aplicar el crédito. Inténtalo de nuevo.")
  }

  // Solo se cancela un registro Descubre; nunca otro Colecciona.
  const { error: cancelErr } = await supabase
    .from("ownership_progress")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("bag_id", bagId)
    .eq("mode", "discover")
    .eq("status", "active")
  if (cancelErr) console.error("[v0] startCollectProgress no se pudo cancelar el Descubre activo:", cancelErr)

  const readyToFinalize = initialCredit >= target
  if (readyToFinalize) {
    await notifyReadyToFinalize(supabase, userId, bagId)
  }

  const { data: progress } = await supabase
    .from("ownership_progress")
    .select("*")
    .eq("id", created.id)
    .single()

  return {
    ok: true,
    progress_id: created.id,
    progress: progress ?? { id: created.id },
    initial_credit: initialCredit,
    invoices_claimed: invoicesClaimed,
    ready_to_finalize: readyToFinalize,
  }
}

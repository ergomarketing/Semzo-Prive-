import Stripe from "stripe"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import {
  insertLedgerEntries,
  previewRentalConversion,
  type LedgerRow,
} from "@/lib/ownership-credit-ledger"
import { notifyReadyToFinalize } from "@/lib/ownership-ready-email"
import { getMaxCredit } from "@/lib/ownership-credit"
import { carryOverCredit, restoreCarriedCredit, type CarriedEntry } from "@/lib/ownership-credit-carry"

/**
 * UNICA via para empezar Modo Colecciona. La usan convert-to-collect y
 * ownership-progress (POST con mode='collect').
 *
 * 0) Exige membresia 'active' (403 membership_required). Solo al crear.
 * 1) Calcula las facturas pagadas elegibles (previewRentalConversion).
 * 2) Crea el progreso 'active'.
 * 3) Las registra en ownership_credit_entries (source='rental_conversion').
 * 3b) Hereda el credito que la socia tenia en intentos cancelados (el credito es SALDO DE LA SOCIA, no del bolso).
 * 4) Fija accumulated (limitado al precio).
 * 5) Cancela el registro Descubre activo del mismo bolso (solo Descubre).
 *
 * Nunca marca 'completed': si el credito cubre el precio queda 'active' y se avisa
 * a la socia de que ya puede finalizar en el webhook de Stripe.
 */

export type StartCollectFailureCode =
  | "bag_not_collectable"
  | "already_collect"
  | "membership_required"
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

// Solo 'active': una socia con cancelacion programada perderia el Colecciona al vencer el periodo.
// No se restringe por tipo de membresia (decision de Erika: se afinara tras las pruebas).
const COLLECT_ALLOWED_MEMBERSHIP_STATUSES: readonly string[] = ["active"]

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

  // Solo al crear: un Colecciona ya activo no se ve afectado por cambios posteriores de la membresia.
  const { data: membership, error: membershipErr } = await supabase
    .from("user_memberships")
    .select("status")
    .eq("user_id", userId)
    .maybeSingle()
  if (membershipErr) {
    console.error("[v0] startCollectProgress no se pudo leer la membresia:", membershipErr)
    return fail("membership_required", 503, "No se pudo comprobar tu membresía. Inténtalo de nuevo.")
  }
  if (!membership || !COLLECT_ALLOWED_MEMBERSHIP_STATUSES.includes(membership.status)) {
    return fail(
      "membership_required",
      403,
      "Necesitas una membresía activa para empezar el Modo Colecciona",
    )
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
  if (insertErr?.code === "23505") {
    // Índice único uniq_active_collect_per_user: un solo Colecciona activo por socia.
    return fail("already_collect", 409, "Ya tienes un bolso en Modo Colecciona activo")
  }
  if (insertErr || !created) {
    console.error("[v0] startCollectProgress insert error:", insertErr)
    return fail("insert_failed", 500, "No se pudo crear el progreso")
  }

  let initialCredit = 0
  let invoicesClaimed = 0
  let carriedEntries: CarriedEntry[] = []
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
    const targetCents = Math.round(target * 100)
    const fromInvoicesCents = Math.min(creditCents, targetCents)
    // Credito de intentos anteriores cancelados: pasa a este bolso hasta completar el precio.
    const carried = await carryOverCredit(supabase, userId, created.id, targetCents - fromInvoicesCents)
    carriedEntries = carried.moved
    initialCredit = Math.round(fromInvoicesCents + carried.cents) / 100

    if (initialCredit > 0) {
      const { error: updateErr } = await supabase
        .from("ownership_progress")
        .update({ accumulated: initialCredit, updated_at: new Date().toISOString() })
        .eq("id", created.id)
      if (updateErr) throw updateErr
    }
  } catch (err) {
    console.error("[v0] startCollectProgress error aplicando el credito:", err)
    // Primero se devuelve a su sitio el credito heredado: el borrado de abajo solo debe quitar lo nuevo.
    await restoreCarriedCredit(supabase, carriedEntries).catch((restoreErr) =>
      console.error("[v0] startCollectProgress no se pudo devolver el credito heredado:", restoreErr),
    )
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

  const readyToFinalize = target > 0 && initialCredit >= getMaxCredit(target)
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

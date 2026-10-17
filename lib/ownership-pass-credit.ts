/**
 * Credito de Modo Colecciona por pases de bolso pagados.
 *
 * Cada pase pagado con dinero (Checkout de Stripe) suma entero al progreso Colecciona
 * activo de la socia, igual que las cuotas de la membresia. Se apunta en el libro
 * (ownership_credit_entries) con el id de la sesion de Stripe, que es UNIQUE: un
 * webhook repetido no suma dos veces. Nunca marca la compra como completada.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import { addCreditToProgress, deleteLedgerEntry, insertLedgerEntries } from "@/lib/ownership-credit-ledger"
import { notifyReadyToFinalize } from "@/lib/ownership-ready-email"

export interface PassCreditInput {
  userId: string
  /** cs_... de la sesion de Checkout del pase (clave de idempotencia). */
  sessionId: string
  /** Importe realmente pagado con dinero, en centimos (sin gift card). */
  amountPaidCents: number
}

export type PassCreditResult =
  | { credited: true; added: number; accumulated: number; readyToFinalize: boolean }
  | { credited: false; reason: "no_amount" | "no_active_collect" | "already_credited" }

export async function creditPassPurchase(supabase: SupabaseClient, input: PassCreditInput): Promise<PassCreditResult> {
  if (!input.amountPaidCents || input.amountPaidCents <= 0) return { credited: false, reason: "no_amount" }

  const { data: progress } = await supabase
    .from("ownership_progress")
    .select("id, purchase_price, bag_id")
    .eq("user_id", input.userId)
    .eq("mode", "collect")
    .eq("status", "active")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!progress?.id || progress.purchase_price == null) return { credited: false, reason: "no_active_collect" }

  // Libro primero: si la sesion ya estaba registrada no se suma nada.
  const [entry] = await insertLedgerEntries(supabase, [
    {
      ownership_progress_id: progress.id,
      user_id: input.userId,
      stripe_invoice_id: input.sessionId,
      amount_cents: input.amountPaidCents,
      source: "collect_pass",
    },
  ])
  if (!entry) return { credited: false, reason: "already_credited" }

  try {
    const result = await addCreditToProgress(
      supabase,
      progress.id,
      input.amountPaidCents / 100,
      Number(progress.purchase_price),
    )
    if (result.reachedPrice) {
      await notifyReadyToFinalize(supabase, input.userId, progress.bag_id)
    }
    return {
      credited: true,
      added: input.amountPaidCents / 100,
      accumulated: result.accumulated,
      readyToFinalize: result.reachedPrice,
    }
  } catch (err) {
    // Sin credito sumado no debe quedar la sesion reservada en el libro.
    await deleteLedgerEntry(supabase, input.sessionId)
    throw err
  }
}

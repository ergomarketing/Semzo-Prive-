/**
 * Anulacion de una venta de Modo Colecciona (desistimiento de 14 dias, clausula 5 del contrato).
 *
 * Que hace, en este orden:
 *  1. Stripe: nota de credito sobre la factura de la compra + reembolso de lo cobrado, por el mismo medio de pago.
 *  2. Base de datos: la socia vuelve al estado ANTERIOR a la venta: el progreso Colecciona vuelve a "active" con su
 *     credito restituido (suma del libro de credito, con el tope del precio), el bolso vuelve a la socia (en curso)
 *     o al inventario si ya lo devolvio, y el contrato archivado se marca como anulado (no se borra: es prueba).
 *  3. Aviso al admin y evento en Klaviyo.
 *
 * Dos pasos: confirm = false solo CALCULA y muestra el plan (no toca nada); confirm = true lo ejecuta.
 * Idempotente: la nota de credito usa una clave ligada a la factura, asi que repetir no cobra/reembolsa dos veces.
 */
import type Stripe from "stripe"
import type { SupabaseClient } from "@supabase/supabase-js"
import { fetchSessionInvoice } from "@/lib/ownership-contract-archive"
import { klaviyoTrackForUser } from "@/lib/klaviyo"

export interface ReverseSaleInput {
  progressId: string
  confirm: boolean
  reason?: string
  /** true = la socia ya devolvio el bolso: vuelve al inventario como disponible. false = sigue en su poder. */
  bagReturned?: boolean
}

export interface ReversePlan {
  bag: string
  member: string
  invoiceNumber: string | null
  amountPaidCents: number
  refundCents: number
  creditNoteTotalCents: number
  restoredCredit: number
  purchasePrice: number
  bagAfter: "rented" | "available"
  reservationReopened: boolean
}

export type ReverseSaleResult =
  | { ok: true; executed: false; plan: ReversePlan }
  | { ok: true; executed: true; plan: ReversePlan; creditNoteId: string; creditNoteNumber: string | null; refundId: string | null }
  | { ok: false; code: string; message: string }

const fail = (code: string, message: string): ReverseSaleResult => ({ ok: false, code, message })

export async function reverseColeccionaSale(
  supabase: SupabaseClient,
  stripe: Stripe,
  input: ReverseSaleInput,
): Promise<ReverseSaleResult> {
  const bagReturned = !!input.bagReturned
  const reason = (input.reason || "Desistimiento de la compradora (14 días)").slice(0, 300)

  const { data: progress } = await supabase
    .from("ownership_progress")
    .select("id, user_id, bag_id, mode, status, purchase_price, accumulated")
    .eq("id", input.progressId)
    .maybeSingle()
  if (!progress) return fail("progress_not_found", "No se encuentra esa compra.")
  if (progress.mode !== "collect" || progress.status !== "completed") {
    return fail("not_completed_sale", "Esa compra no está cerrada como venta, no hay nada que anular.")
  }

  const { data: contract } = await supabase
    .from("colecciona_contracts")
    .select("id, stripe_session_id, stripe_invoice_id, reversed_at")
    .eq("ownership_progress_id", progress.id)
    .maybeSingle()
  if (!contract) return fail("contract_not_found", "No hay contrato archivado de esta venta.")
  if (contract.reversed_at) return fail("already_reversed", "Esta venta ya se anuló.")

  // Factura de Stripe de la compra
  const found = contract.stripe_invoice_id
    ? { invoiceId: contract.stripe_invoice_id as string }
    : await fetchSessionInvoice(contract.stripe_session_id)
  if (!found.invoiceId) return fail("invoice_not_found", "No se encuentra la factura de Stripe de esta compra.")
  const invoice = await stripe.invoices.retrieve(found.invoiceId, { expand: ["lines"] })
  if (invoice.status !== "paid" || !invoice.amount_paid || invoice.amount_paid <= 0) {
    return fail("invoice_not_paid", `La factura ${invoice.number || invoice.id} no figura como pagada.`)
  }
  if ((invoice.post_payment_credit_notes_amount ?? 0) > 0) {
    return fail("already_credited", "La factura ya tiene una nota de crédito.")
  }

  // Nota de credito: todas las lineas de la factura (el descuento del credito se aplica solo).
  const lines = invoice.lines.data.map((line) => ({
    type: "invoice_line_item" as const,
    invoice_line_item: line.id,
    quantity: line.quantity ?? 1,
  }))
  const preview = await stripe.creditNotes.preview({
    invoice: invoice.id,
    lines,
    reason: "order_change",
    refund_amount: invoice.amount_paid,
  })
  if (preview.total !== invoice.amount_paid) {
    return fail(
      "credit_note_mismatch",
      `La nota de crédito saldría por ${(preview.total / 100).toFixed(2)} € y se cobraron ${(invoice.amount_paid / 100).toFixed(2)} €. ` +
        "No se ha hecho nada: anúlala a mano en Stripe.",
    )
  }

  // Credito restituido = libro de credito de ese progreso, con el tope del precio de venta.
  const { data: entries } = await supabase
    .from("ownership_credit_entries")
    .select("amount_cents")
    .eq("ownership_progress_id", progress.id)
  const ledgerTotal = (entries || []).reduce((sum, e) => sum + Number(e.amount_cents || 0), 0) / 100
  const purchasePrice = Number(progress.purchase_price)
  const restoredCredit = Math.min(purchasePrice, ledgerTotal)

  const [{ data: bag }, { data: profile }] = await Promise.all([
    supabase.from("bags").select("brand, name").eq("id", progress.bag_id).maybeSingle(),
    supabase.from("profiles").select("email, full_name").eq("id", progress.user_id).maybeSingle(),
  ])
  const bagLabel = `${bag?.brand || ""} ${bag?.name || ""}`.trim() || "bolso"
  const memberLabel = profile?.full_name || profile?.email || progress.user_id

  const plan: ReversePlan = {
    bag: bagLabel,
    member: String(memberLabel),
    invoiceNumber: invoice.number,
    amountPaidCents: invoice.amount_paid,
    refundCents: invoice.amount_paid,
    creditNoteTotalCents: preview.total,
    restoredCredit,
    purchasePrice,
    bagAfter: bagReturned ? "available" : "rented",
    reservationReopened: !bagReturned,
  }
  if (!input.confirm) return { ok: true, executed: false, plan }

  // 1) Stripe primero (el dinero). Clave ligada a la factura: repetir no reembolsa dos veces.
  const creditNote = await stripe.creditNotes.create(
    {
      invoice: invoice.id,
      lines,
      reason: "order_change",
      memo: `Desistimiento Colecciona — ${bagLabel}. ${reason}`.slice(0, 500),
      refund_amount: invoice.amount_paid,
      metadata: { type: "colecciona_reversal", ownership_progress_id: progress.id },
    },
    { idempotencyKey: `colecciona-reversal-${invoice.id}` },
  )
  const refundId = typeof creditNote.refund === "string" ? creditNote.refund : (creditNote.refund?.id ?? null)

  // 2) Base de datos: vuelve al estado anterior a la venta.
  const now = new Date().toISOString()
  const { error: progressError } = await supabase
    .from("ownership_progress")
    .update({ status: "active", completed_at: null, accumulated: restoredCredit, updated_at: now })
    .eq("id", progress.id)
  if (progressError) throw new Error(`ownership_progress: ${progressError.message}`)

  if (!bagReturned) {
    // Sigue en poder de la socia: se reabre su ultima reserva cerrada por la venta y el bolso vuelve a 'rented'.
    const { data: lastReservation } = await supabase
      .from("reservations")
      .select("id")
      .eq("user_id", progress.user_id)
      .eq("bag_id", progress.bag_id)
      .eq("status", "completed")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (lastReservation) {
      await supabase.from("reservations").update({ status: "active", updated_at: now }).eq("id", lastReservation.id)
    }
  }
  const { error: bagError } = await supabase
    .from("bags")
    .update({ status: bagReturned ? "available" : "rented", updated_at: now })
    .eq("id", progress.bag_id)
  if (bagError) throw new Error(`bags: ${bagError.message}`)

  const { error: contractError } = await supabase
    .from("colecciona_contracts")
    .update({
      reversed_at: now,
      reversal_credit_note_id: creditNote.id,
      reversal_credit_note_number: creditNote.number ?? null,
      reversal_refund_id: refundId,
      reversal_reason: reason,
    })
    .eq("id", contract.id)
  if (contractError) throw new Error(`colecciona_contracts: ${contractError.message}`)

  // 3) Avisos (best-effort)
  await supabase.from("admin_notifications").insert({
    type: "colecciona_sale_reversed",
    priority: "high",
    title: `Venta Colecciona anulada — ${bagLabel}`,
    message:
      `${memberLabel}: venta anulada (desistimiento). Reembolsado ${(invoice.amount_paid / 100).toFixed(2)} € con la nota de crédito ` +
      `${creditNote.number || creditNote.id} sobre la factura ${invoice.number}. Crédito restituido: ${restoredCredit.toFixed(2)} €. ` +
      (bagReturned ? "El bolso vuelve al inventario." : "El bolso sigue en poder de la socia: debe devolverlo (14 días)."),
    metadata: { ownership_progress_id: progress.id, credit_note_id: creditNote.id, invoice_id: invoice.id, bag_returned: bagReturned },
  })
  await klaviyoTrackForUser(supabase, progress.user_id, {
    metric: "Colecciona Reversed",
    properties: { bag: bagLabel, bag_id: progress.bag_id },
    value: invoice.amount_paid / 100,
    currency: "EUR",
    uniqueId: `colecciona_reversed:${progress.id}`,
  })

  return {
    ok: true,
    executed: true,
    plan,
    creditNoteId: creditNote.id,
    creditNoteNumber: creditNote.number ?? null,
    refundId,
  }
}

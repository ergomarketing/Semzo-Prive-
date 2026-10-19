/**
 * Cierre de una venta de Modo Colecciona (compra definitiva del bolso).
 *
 * Es el UNICO punto que cierra la venta, lo llaman el webhook de Stripe, la
 * pagina de confirmacion (verify-purchase) y la ruta de cobro off-session.
 * Es idempotente: cada paso puede repetirse sin efecto y los avisos (admin y
 * socia) solo salen la primera vez que el bolso pasa a "colecciona".
 *
 * Que hace:
 *  1. ownership_progress -> completed (accumulated = precio)
 *  2. bags.status -> "colecciona" (sale del inventario de alquiler)
 *  3. reservas abiertas de esa socia con ese bolso -> completed
 *  4. (solo la primera vez) aviso al admin + email a la socia y al admin
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import { EmailServiceProduction, buildColeccionaSaleEmail } from "@/app/lib/email-service-production"
import { BRAND, emailDetailList, emailInfoBox, renderAdminEmail, renderBrandEmail } from "@/app/lib/email-layout"
import { archiveColeccionaContract, type ArchivedContract } from "@/lib/ownership-contract-archive"
import { logEmail } from "@/lib/email-logger"
import { klaviyoTrackForUser } from "@/lib/klaviyo"

export interface CloseSaleInput {
  progressId: string
  /** Importe realmente cobrado en esta compra, en centimos (para avisos). */
  amountPaidCents: number
  /** Referencia del pago (cs_... o pi_...), para trazabilidad e idempotencia de avisos. */
  paymentRef: string
}

export type CloseSaleResult =
  | { ok: true; firstClose: boolean; bagLabel: string }
  | { ok: false; reason: "progress_not_found" | "not_collect" | "progress_cancelled" }

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "mailbox@semzoprive.com"
const OPEN_RESERVATION_STATUSES = ["pending", "confirmed", "active", "overdue"]

const formatEUR = (cents: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(cents / 100)

export async function closeColeccionaSale(supabase: SupabaseClient, input: CloseSaleInput): Promise<CloseSaleResult> {
  const { data: progress } = await supabase
    .from("ownership_progress")
    .select("id, user_id, bag_id, mode, status, purchase_price")
    .eq("id", input.progressId)
    .maybeSingle()

  if (!progress) return { ok: false, reason: "progress_not_found" }
  if (progress.mode !== "collect") return { ok: false, reason: "not_collect" }
  if (progress.status === "cancelled") return { ok: false, reason: "progress_cancelled" }

  const now = new Date().toISOString()

  // 1. Progreso completado
  if (progress.status !== "completed") {
    const { error } = await supabase
      .from("ownership_progress")
      .update({
        accumulated: progress.purchase_price,
        status: "completed",
        completed_at: now,
        updated_at: now,
      })
      .eq("id", progress.id)
    if (error) throw new Error(`ownership_progress: ${error.message}`)
  }

  // 2. Bolso vendido PRIMERO. Si la fila cambia es la primera vez que se cierra; la
  // actualizacion es atomica, asi que solo una de las llamadas concurrentes (webhook /
  // pantalla de confirmacion) ve firstClose = true. Con el bolso ya en 'colecciona', el
  // trigger release_bag_on_reservation_end no lo libera ni avisa a la lista de espera
  // cuando la reserva pase a 'completed' (ver scripts/colecciona-sold-bag-and-pass-credit.sql).
  const { data: soldRows, error: bagError } = await supabase
    .from("bags")
    .update({ status: "colecciona", current_renter: null, rented_until: null, updated_at: now })
    .eq("id", progress.bag_id)
    .neq("status", "colecciona")
    .select("id")
  if (bagError) throw new Error(`bags: ${bagError.message}`)
  const firstClose = (soldRows?.length ?? 0) > 0

  // 3. Reservas abiertas de esta socia con este bolso: ya no hay nada que devolver.
  const { error: resError } = await supabase
    .from("reservations")
    .update({ status: "completed", updated_at: now })
    .eq("user_id", progress.user_id)
    .eq("bag_id", progress.bag_id)
    .in("status", OPEN_RESERVATION_STATUSES)
  if (resError) throw new Error(`reservations: ${resError.message}`)

  // Red de seguridad: si la guarda del trigger no estuviera aplicada en esta base de
  // datos, el bolso habria vuelto a 'available'. Se reafirma como vendido (idempotente).
  const { error: reassertError } = await supabase
    .from("bags")
    .update({ status: "colecciona", updated_at: now })
    .eq("id", progress.bag_id)
    .neq("status", "colecciona")
  if (reassertError) throw new Error(`bags (reafirmar): ${reassertError.message}`)

  const { data: bag } = await supabase.from("bags").select("brand, name").eq("id", progress.bag_id).maybeSingle()
  const bagLabel = `${bag?.brand || ""} ${bag?.name || ""}`.trim() || "tu bolso"

  // 4. Contrato firmado + avisos: solo la primera vez. Un fallo aqui NO debe deshacer ni reintentar la venta.
  if (firstClose) {
    // 4a. Archivar el contrato (PDF) y localizar la factura de Stripe
    let archived: ArchivedContract | null = null
    try {
      const archive = await archiveColeccionaContract(supabase, {
        progressId: progress.id,
        paymentRef: input.paymentRef,
      })
      if (archive.ok) archived = archive.archived
      else throw new Error(archive.reason)
    } catch (archiveErr) {
      console.error("[colecciona-sale] No se pudo archivar el contrato:", archiveErr)
      await supabase.from("admin_notifications").insert({
        type: "colecciona_contract_error",
        priority: "high",
        title: `No se pudo generar el contrato PDF de ${bagLabel}`,
        message: `La venta está cerrada pero el contrato PDF no se generó (${archiveErr instanceof Error ? archiveErr.message : archiveErr}). Referencia de pago: ${input.paymentRef}. La socia puede descargarlo luego desde su panel (se reintenta al pedirlo).`,
        metadata: { ownership_progress_id: progress.id, payment_ref: input.paymentRef },
      })
    }

    // 4b. Avisos y correos
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", progress.user_id)
        .maybeSingle()
      const memberName = profile?.full_name || profile?.email || progress.user_id
      const firstName = (profile?.full_name || "").trim().split(/\s+/)[0] || ""
      const paid = formatEUR(input.amountPaidCents)
      const invoiceUrl = archived?.invoiceUrl ?? null

      await supabase.from("admin_notifications").insert({
        type: "colecciona_sale",
        priority: "high",
        title: `Venta Colecciona — ${bagLabel}`,
        message: `${memberName} ha comprado ${bagLabel} (Modo Colecciona). Cobrado: ${paid}. Contrato PDF ${archived ? "archivado" : "PENDIENTE"}${invoiceUrl ? "; factura de Stripe generada" : ""}.`,
        metadata: {
          user_id: progress.user_id,
          email: profile?.email,
          bag_id: progress.bag_id,
          ownership_progress_id: progress.id,
          amount_paid_cents: input.amountPaidCents,
          payment_ref: input.paymentRef,
          invoice_url: invoiceUrl,
          contract_sha256: archived?.sha256 ?? null,
        },
      })

      const attachments = archived
        ? [{ filename: archived.filename, content: Buffer.from(archived.pdf).toString("base64") }]
        : undefined
      const emailService = EmailServiceProduction.getInstance()
      const logMeta = { ownership_progress_id: progress.id, payment_ref: input.paymentRef }

      if (profile?.email) {
        // Plantilla de Erika (lib/service-emails/payment-family.ts), con el contrato en PDF adjunto
        const built = buildColeccionaSaleEmail({
          fullName: profile.full_name,
          bagLabel,
          amountPaid: input.amountPaidCents / 100,
          invoiceUrl,
          hasContract: !!archived,
        })
        const memberSubject = built.subject
        const sent = await emailService.sendWithResend({
          to: profile.email,
          subject: memberSubject,
          html: built.html,
          attachments,
        })
        await logEmail({
          recipientEmail: profile.email,
          recipientName: profile.full_name,
          subject: memberSubject,
          emailType: "colecciona_sale_member",
          status: sent ? "sent" : "failed",
          metadata: { ...logMeta, contract_attached: !!archived },
        })
      }

      const adminSubject = `Venta Colecciona: ${bagLabel} (${paid})`
      const adminSent = await emailService.sendWithResend({
        to: ADMIN_EMAIL,
        subject: adminSubject,
        html: renderAdminEmail({
          title: "Venta Colecciona",
          intro: `${memberName} ha comprado un bolso en Modo Colecciona. El bolso figura como vendido y su reserva está cerrada.`,
          rows: [
            { label: "Socia", value: `${memberName} (${profile?.email || "sin email"})` },
            { label: "Bolso", value: bagLabel },
            { label: "Cobrado", value: paid },
            { label: "Pago", value: input.paymentRef },
            { label: "Factura", value: invoiceUrl ? `<a href="${invoiceUrl}">Ver factura en Stripe</a>` : "Se genera en Stripe (revisa el pago)" },
            { label: "Contrato", value: archived ? "PDF adjunto (archivado)" : "PENDIENTE: no se generó" },
          ],
        }),
        attachments,
      })
      await logEmail({
        recipientEmail: ADMIN_EMAIL,
        recipientName: "Admin",
        subject: adminSubject,
        emailType: "colecciona_sale_admin",
        status: adminSent ? "sent" : "failed",
        metadata: logMeta,
      })
    } catch (notifyErr) {
      console.error("[colecciona-sale] Avisos fallidos (la venta SI esta cerrada):", notifyErr)
    }

    // Klaviyo: evento "Colecciona Purchased" con el importe pagado (best-effort)
    await klaviyoTrackForUser(supabase, progress.user_id, {
      metric: "Colecciona Purchased",
      properties: { bag: bagLabel, bag_id: progress.bag_id },
      value: input.amountPaidCents / 100,
      currency: "EUR",
      uniqueId: `colecciona_purchased:${progress.id}`,
    })
  }

  return { ok: true, firstClose, bagLabel }
}


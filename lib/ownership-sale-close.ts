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
import { EmailServiceProduction } from "@/app/lib/email-service-production"
import { logEmail } from "@/lib/email-logger"

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

  // 4. Avisos: solo la primera vez. Un fallo aqui NO debe deshacer ni reintentar la venta.
  if (firstClose) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", progress.user_id)
        .maybeSingle()
      const memberName = profile?.full_name || profile?.email || progress.user_id
      const paid = formatEUR(input.amountPaidCents)

      await supabase.from("admin_notifications").insert({
        type: "colecciona_sale",
        priority: "high",
        title: `Venta Colecciona — ${bagLabel}`,
        message: `${memberName} ha comprado ${bagLabel} (Modo Colecciona). Cobrado: ${paid}. Prepara factura y entrega.`,
        metadata: {
          user_id: progress.user_id,
          email: profile?.email,
          bag_id: progress.bag_id,
          ownership_progress_id: progress.id,
          amount_paid_cents: input.amountPaidCents,
          payment_ref: input.paymentRef,
        },
      })

      const emailService = EmailServiceProduction.getInstance()
      const logMeta = { ownership_progress_id: progress.id, payment_ref: input.paymentRef }
      if (profile?.email) {
        const memberSubject = `${bagLabel} ya es tuyo · Semzo Privé`
        const sent = await emailService.sendWithResend({
          to: profile.email,
          subject: memberSubject,
          html: buildMemberEmail(profile.full_name || "", bagLabel, paid),
        })
        await logEmail({
          recipientEmail: profile.email,
          recipientName: profile.full_name,
          subject: memberSubject,
          emailType: "colecciona_sale_member",
          status: sent ? "sent" : "failed",
          metadata: logMeta,
        })
      }
      const adminSubject = `Venta Colecciona: ${bagLabel} (${paid})`
      const adminSent = await emailService.sendWithResend({
        to: ADMIN_EMAIL,
        subject: adminSubject,
        html: `<p>${memberName} (${profile?.email || "sin email"}) ha comprado <strong>${bagLabel}</strong> en Modo Colecciona.</p>
<p>Cobrado: <strong>${paid}</strong>. Referencia de pago: ${input.paymentRef}.</p>
<p>El bolso ya figura como vendido (status "colecciona") y su reserva se ha cerrado. Pendiente: factura y entrega.</p>`,
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
  }

  return { ok: true, firstClose, bagLabel }
}

function buildMemberEmail(name: string, bagLabel: string, paid: string): string {
  return `<!DOCTYPE html><html lang="es"><body style="margin:0;padding:0;background:#f9f8f9;font-family:Georgia,serif;">
<table align="center" width="100%" style="max-width:600px;background:#ffffff;margin:0 auto;border-collapse:collapse;">
<tr><td style="padding:36px 30px 8px;text-align:center;">
<p style="margin:0;font-size:12px;letter-spacing:3px;color:#c9a96e;text-transform:uppercase;">Semzo Privé · Colecciona</p>
<h1 style="margin:14px 0 0;font-size:28px;font-weight:400;color:#1a1a4b;">Enhorabuena${name ? `, ${name}` : ""}</h1>
<div style="width:40px;height:2px;background:#c9a96e;margin:16px auto;"></div>
</td></tr>
<tr><td style="padding:0 36px 8px;color:#1a1a4b;font-size:16px;line-height:1.8;">
<p style="margin:0 0 16px;"><strong>${bagLabel}</strong> es ahora tuyo.</p>
<p style="margin:0 0 16px;">Hemos recibido tu pago de <strong>${paid}</strong>. Te escribiremos en breve para coordinar la entrega de tu factura y los detalles del bolso.</p>
<p style="margin:0 0 16px;">Tu membresía sigue activa y puedes seguir disfrutando de otros bolsos con ella.</p>
</td></tr>
<tr><td style="padding:16px 30px 36px;text-align:center;">
<a href="https://semzoprive.com/dashboard" style="display:inline-block;background:#1a1a4b;color:#ffffff;text-decoration:none;padding:16px 44px;font-size:14px;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;">Ir a mi cuenta</a>
<p style="margin:24px 0 0;font-size:13px;color:#7a7a94;">¿Dudas? Escríbenos a soporte@semzoprive.com</p>
</td></tr></table></body></html>`
}

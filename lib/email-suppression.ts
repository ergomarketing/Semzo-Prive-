import type { SupabaseClient } from "@supabase/supabase-js"
import { MARKETING_LIFECYCLE_SEQUENCES, cancelPendingLifecycle } from "@/lib/lifecycle-emails/enroll"
import type { ResendWebhookEvent } from "@/lib/resend-webhook"

export type SuppressionReason = "hard_bounce" | "complaint"

/**
 * Decide si un evento de Resend obliga a dejar de escribir a esa direccion.
 * Solo el rebote permanente y la queja de spam: un rebote temporal (buzon lleno, servidor caido)
 * puede arreglarse solo y no se excluye a nadie por eso.
 */
export function suppressionReasonFor(event: ResendWebhookEvent): SuppressionReason | null {
  if (event.type === "email.complained") return "complaint"
  if (event.type === "email.bounced" && event.data?.bounce?.type?.toLowerCase() === "permanent") return "hard_bounce"
  return null
}

/**
 * Excluye la direccion de los envios de marketing. Es idempotente: se puede repetir sin efecto.
 *  - Rebote permanente: newsletter "bounced", lead "cold" (la direccion no existe o rechaza todo).
 *  - Queja de spam: se trata como una baja (newsletter y lead "unsubscribed") y se retira el consentimiento.
 * En ambos casos se cancelan los correos de marketing ya programados.
 * Lanza si falla una escritura, para que el webhook devuelva 500 y Resend reintente.
 */
export async function suppressEmailAddress(
  supabase: SupabaseClient,
  rawEmail: string,
  reason: SuppressionReason,
): Promise<void> {
  const email = rawEmail.toLowerCase().trim()
  if (!email.includes("@")) return
  const now = new Date().toISOString()
  const isComplaint = reason === "complaint"

  const { error: newsletterError } = await supabase
    .from("newsletter_subscriptions")
    .update(
      isComplaint
        ? { status: "unsubscribed", unsubscribed_at: now }
        : { status: "bounced" },
    )
    .eq("email", email)
    .eq("status", "active")
  if (newsletterError) throw newsletterError

  // Solo los leads aun activos: no se pisa una baja anterior ni a quien ya es socia (subscribed).
  const { data: leads, error: leadsError } = await supabase
    .from("leads")
    .select("id")
    .eq("email", email)
    .in("status", isComplaint ? ["lead", "subscribed"] : ["lead"])
  if (leadsError) throw leadsError

  for (const lead of leads ?? []) {
    const { error } = await supabase
      .from("leads")
      .update(isComplaint ? { status: "unsubscribed", unsubscribed_at: now } : { status: "cold" })
      .eq("id", lead.id)
    if (error) throw error

    const { error: sequenceError } = await supabase
      .from("email_sequence_log")
      .update({ status: "skipped" })
      .eq("lead_id", lead.id)
      .eq("status", "pending")
    if (sequenceError) throw sequenceError
  }

  if (isComplaint) {
    const { error } = await supabase
      .from("marketing_consents")
      .update({ withdrawn_at: now })
      .eq("email", email)
      .is("withdrawn_at", null)
    if (error) throw error
  }

  await cancelPendingLifecycle({
    email,
    sequenceKeys: MARKETING_LIFECYCLE_SEQUENCES,
    reason: isComplaint ? "queja de spam" : "rebote permanente",
  })
}

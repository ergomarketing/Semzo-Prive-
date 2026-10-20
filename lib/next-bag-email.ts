/**
 * Correo "Tu próxima pieza ya tiene tu nombre": se manda cuando la socia reserva su "próximo bolso" (queda en cola).
 * Best-effort: nunca lanza ni bloquea la reserva.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import { EmailServiceProduction, buildNextBagQueuedEmail } from "@/app/lib/email-service-production"
import { logEmail } from "@/lib/email-logger"

export async function sendNextBagQueuedEmail(
  supabase: SupabaseClient,
  input: { userId: string; bagId: string },
): Promise<void> {
  try {
    const [{ data: profile }, { data: bag }] = await Promise.all([
      supabase.from("profiles").select("full_name, email").eq("id", input.userId).maybeSingle(),
      supabase.from("bags").select("brand, name").eq("id", input.bagId).maybeSingle(),
    ])
    if (!profile?.email) return
    const built = buildNextBagQueuedEmail({
      fullName: profile.full_name,
      bagName: bag ? `${bag.brand || ""} ${bag.name || ""}`.trim() : "tu próximo bolso",
    })
    const sent = await EmailServiceProduction.getInstance().sendWithResend({
      to: profile.email,
      subject: built.subject,
      html: built.html,
    })
    await logEmail({
      recipientEmail: profile.email,
      recipientName: profile.full_name || null,
      subject: built.subject,
      emailType: "next_bag_queued",
      status: sent ? "sent" : "failed",
      metadata: { bagId: input.bagId },
    })
  } catch (err) {
    console.error("[next-bag-email] No se pudo enviar el correo de próximo bolso reservado:", err)
  }
}

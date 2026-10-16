import type { SupabaseClient } from "@supabase/supabase-js"
import { render } from "@react-email/components"
import { EmailServiceProduction } from "@/app/lib/email-service-production"
import { logEmail } from "@/lib/email-logger"
import OwnershipCompletedEmail from "@/emails/templates/ownership-completed"
import { getMessages } from "@/emails/messages"

/**
 * Avisa a la socia de que su crédito ya cubre el precio y puede finalizar la compra.
 * No la marca como propietaria: la compra solo se cierra en /ownership/complete.
 * Best-effort: nunca lanza.
 */
export async function notifyReadyToFinalize(
  supabase: SupabaseClient,
  userId: string,
  bagId: string,
): Promise<void> {
  try {
    const [{ data: profile }, { data: bag }] = await Promise.all([
      supabase.from("profiles").select("full_name, email").eq("id", userId).single(),
      supabase.from("bags").select("brand, name").eq("id", bagId).maybeSingle(),
    ])
    if (!profile?.email) return

    const subject = getMessages("es").ownershipCompleted.subject
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://semzoprive.com"
    const sent = await EmailServiceProduction.getInstance().sendWithResend({
      to: profile.email,
      subject,
      html: await render(
        <OwnershipCompletedEmail
          name={profile.full_name || ""}
          bagBrand={bag?.brand}
          bagName={bag?.name}
          ctaUrl={`${siteUrl}/dashboard`}
        />,
      ),
    })
    await logEmail({
      recipientEmail: profile.email,
      recipientName: profile.full_name || null,
      subject,
      emailType: "ownership_ready_to_finalize",
      status: sent ? "sent" : "failed",
    })
  } catch (err) {
    console.error("[ownership] Error enviando aviso de compra lista para finalizar:", err)
  }
}

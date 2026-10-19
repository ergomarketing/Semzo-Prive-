/**
 * Correo "Tu membresia esta activa" (socia) + aviso al admin.
 *
 * Se manda SOLO cuando la membresia pasa de verdad a 'active' (pago + identidad + SEPA),
 * desde el orquestador. Antes salia del webhook de checkout.session.completed en cuanto
 * se cobraba, aunque la socia aun tuviera que verificar su identidad: el correo decia
 * "activa" y despues no podia reservar.
 */
import { render } from "@react-email/components"
import type { SupabaseClient } from "@supabase/supabase-js"
import { EmailServiceProduction, buildMemberWelcomeEmail } from "@/app/lib/email-service-production"
import { logEmail } from "@/lib/email-logger"
import AdminNotificationEmail from "@/emails/templates/admin-notification"

const MEMBERSHIP_LABELS: Record<string, string> = {
  petite: "Petite",
  essentiel: "L'Essentiel",
  signature: "Signature",
  prive: "Privé",
}

export async function sendMembershipActivatedEmails(
  supabase: SupabaseClient,
  input: { userId: string; membershipType: string; subscriptionId: string },
): Promise<void> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", input.userId)
    .maybeSingle()
  if (!profile?.email) return

  const label = MEMBERSHIP_LABELS[input.membershipType] || input.membershipType
  const emailService = EmailServiceProduction.getInstance()
  const metadata = { subscriptionId: input.subscriptionId }

  const firstName = (profile.full_name || "").trim().split(/\s+/)[0] || ""
  const welcome = buildMemberWelcomeEmail({ name: firstName, tier: label })
  const memberSent = await emailService.sendWithResend({ to: profile.email, subject: welcome.subject, html: welcome.html })
  await logEmail({
    recipientEmail: profile.email,
    recipientName: profile.full_name || null,
    subject: welcome.subject,
    emailType: "membership_activated",
    status: memberSent ? "sent" : "failed",
    metadata,
  })

  const adminSubject = `[Admin] Nueva membresía activada — ${profile.full_name || profile.email}`
  const adminSent = await emailService.sendWithResend({
    to: "mailbox@semzoprive.com",
    subject: adminSubject,
    html: await render(
      <AdminNotificationEmail
        title="Nueva membresía activada"
        rows={[
          { label: "Nombre", value: profile.full_name || "N/A" },
          { label: "Email", value: profile.email },
          { label: "Plan", value: label },
          { label: "Suscripción Stripe", value: input.subscriptionId },
          { label: "Fecha", value: new Date().toLocaleString("es-ES") },
        ]}
      />,
    ),
  })
  await logEmail({
    recipientEmail: "mailbox@semzoprive.com",
    recipientName: "Admin",
    subject: adminSubject,
    emailType: "admin_membership_activated",
    status: adminSent ? "sent" : "failed",
    metadata,
  })
}

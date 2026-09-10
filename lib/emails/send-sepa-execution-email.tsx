/**
 * CONFIRMACIÓN DE EJECUCIÓN SEPA
 *
 * Email transaccional legal enviado INMEDIATAMENTE DESPUÉS de ejecutar un cargo
 * SEPA Direct Debit por incidencia grave (no devolución del bolso 14 días después
 * del aviso previo obligatorio).
 *
 * Reglas:
 * - Solo se envía tras una ejecución real y confirmada en Stripe (payment_intent succeeded)
 * - Se envía copia al admin para trazabilidad
 * - Guarda auditoría en DB: sepa_charged_at, sepa_charge_payment_intent_id
 */

import { render } from "@react-email/components"
import SepaExecutionEmail from "@/emails/templates/sepa-execution"
import AdminNotificationEmail from "@/emails/templates/admin-notification"

interface SendSepaExecutionEmailParams {
  to: string
  customerName: string
  bagName: string
  amountCharged: number // en euros
  reservationId: string
  paymentIntentId: string
}

async function sendResendEmail(params: {
  to: string
  subject: string
  html: string
  tags: { name: string; value: string }[]
}) {
  const apiKey = process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY
  if (!apiKey) {
    console.error("[SEPA EXECUTION EMAIL] API key no configurada")
    return { success: false, error: "RESEND_API_KEY no configurada" }
  }

  const emailFrom = process.env.FROM_EMAIL || "SEMZO PRIVÉ <hola@semzoprive.com>"

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: emailFrom,
      to: [params.to],
      subject: params.subject,
      html: params.html,
      tags: params.tags,
    }),
  })

  if (!response.ok) {
    const errorData = await response.text()
    console.error("[SEPA EXECUTION EMAIL] Error de Resend:", errorData)
    return { success: false, error: `Error de Resend: ${errorData}` }
  }

  const result = await response.json()
  return { success: true, emailId: result.id as string }
}

export async function sendSepaExecutionEmail({
  to,
  customerName,
  bagName,
  amountCharged,
  reservationId,
  paymentIntentId,
}: SendSepaExecutionEmailParams): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const htmlContent = await render(
    <SepaExecutionEmail
      customerName={customerName}
      bagName={bagName}
      amountCharged={amountCharged}
      reservationId={reservationId}
      paymentIntentId={paymentIntentId}
      termsUrl={`${process.env.NEXT_PUBLIC_SITE_URL}/legal/terms`}
    />,
  )

  return sendResendEmail({
    to,
    subject: "Confirmación de Cargo SEPA Ejecutado - Semzo Privé",
    html: htmlContent,
    tags: [
      { name: "category", value: "sepa_execution" },
      { name: "reservation_id", value: reservationId },
    ],
  })
}

export async function sendSepaExecutionAdminEmail({
  customerName,
  customerEmail,
  bagName,
  amountCharged,
  reservationId,
  paymentIntentId,
}: {
  customerName: string
  customerEmail: string
  bagName: string
  amountCharged: number
  reservationId: string
  paymentIntentId: string
}): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const adminEmail = process.env.ADMIN_EMAIL || "mailbox@semzoprive.com"

  const htmlContent = await render(
    <AdminNotificationEmail
      title="Cargo SEPA ejecutado por no devolución"
      rows={[
        { label: "Socia", value: `${customerName} (${customerEmail})` },
        { label: "Reserva", value: reservationId },
        { label: "Bolso", value: bagName },
        { label: "Importe cargado", value: `${amountCharged.toFixed(2)}€` },
        { label: "Payment Intent", value: paymentIntentId },
      ]}
    />,
  )

  return sendResendEmail({
    to: adminEmail,
    subject: `[Semzo Admin] Cargo SEPA ejecutado — ${customerName}`,
    html: htmlContent,
    tags: [
      { name: "category", value: "sepa_execution_admin" },
      { name: "reservation_id", value: reservationId },
    ],
  })
}

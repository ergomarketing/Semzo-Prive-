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
  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Cargo SEPA</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #1a1a4b; padding: 20px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">SEMZO PRIVÉ</h1>
  </div>

  <div style="padding: 30px 20px; background: #ffffff;">
    <h2 style="color: #dc2626; margin-bottom: 20px;">
      Confirmación de Ejecución de Mandato SEPA
    </h2>

    <p>Estimada ${customerName},</p>

    <p>
      Le confirmamos que, transcurrido el plazo de 14 días naturales desde el aviso previo enviado
      sin haberse producido la devolución del bolso <strong>${bagName}</strong> (reserva #${reservationId}),
      se ha ejecutado el mandato SEPA Direct Debit autorizado en el momento de la contratación.
    </p>

    <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold;">
        Importe cargado: ${amountCharged.toFixed(2)}€
      </p>
      <p style="margin: 8px 0 0 0; font-size: 13px; color: #666;">
        Referencia de pago: ${paymentIntentId}
      </p>
    </div>

    <p>
      Este importe corresponde al valor real de reposición del artículo no devuelto, conforme a lo
      establecido en la cláusula 8.2 de nuestros
      <a href="${process.env.NEXT_PUBLIC_SITE_URL}/legal/terms" style="color: #1a1a4b;">Términos y Condiciones</a>
      aceptados en el momento de la contratación.
    </p>

    <p style="font-size: 14px; color: #666;">
      Si considera que este cargo se ha realizado por error o el bolso ya ha sido devuelto, contacte
      de inmediato con nuestro equipo en
      <a href="mailto:soporte@semzoprive.com" style="color: #1a1a4b;">soporte@semzoprive.com</a>.
    </p>

    <p style="margin-top: 30px;">
      Atentamente,<br>
      <strong>Equipo de Semzo Privé</strong>
    </p>
  </div>

  <div style="background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
    <p style="margin: 0 0 10px 0;">
      Este es un email transaccional legal. Por favor no responda directamente a este correo.
    </p>
    <p style="margin: 0;">
      Para consultas: <a href="mailto:soporte@semzoprive.com" style="color: #1a1a4b;">soporte@semzoprive.com</a>
    </p>
  </div>
</body>
</html>
  `

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

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1a1a4b;">Cargo SEPA ejecutado por no devolución</h2>
      <p><strong>Socia:</strong> ${customerName} (${customerEmail})</p>
      <p><strong>Reserva:</strong> ${reservationId}</p>
      <p><strong>Bolso:</strong> ${bagName}</p>
      <p><strong>Importe cargado:</strong> ${amountCharged.toFixed(2)}€</p>
      <p><strong>Payment Intent:</strong> ${paymentIntentId}</p>
    </div>
  `

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

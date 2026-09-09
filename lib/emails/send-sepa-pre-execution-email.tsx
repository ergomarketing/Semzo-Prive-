/**
 * AVISO PRE-EJECUCIÓN SEPA
 * 
 * Email transaccional legal obligatorio ANTES de ejecutar un cargo SEPA Direct Debit
 * por incidencias graves (no devolución de bolso tras 8 días del fin de alquiler).
 * 
 * Reglas:
 * - Solo se envía día 8 tras fin de alquiler
 * - Estado: no devuelto
 * - ANTES de cualquier ejecución SEPA
 * - Guarda auditoría en DB: sepa_pre_notice_sent_at
 */

import { render } from "@react-email/components"
import SepaPreExecutionEmail from "@/emails/templates/sepa-pre-execution"

interface SendSepaPreExecutionEmailParams {
  to: string
  customerName: string
  bagName: string
  rentalEndDate: string // formato: "15 de enero de 2025"
  amountDue: number // en euros
  reservationId: string
}

export async function sendSepaPreExecutionEmail({
  to,
  customerName,
  bagName,
  rentalEndDate,
  amountDue,
  reservationId,
}: SendSepaPreExecutionEmailParams): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    const apiKey = process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY

    if (!apiKey) {
      console.error("[SEPA EMAIL] API key no configurada")
      return {
        success: false,
        error: "RESEND_API_KEY no configurada",
      }
    }

    const emailFrom = process.env.FROM_EMAIL || "SEMZO PRIVÉ <hola@semzoprive.com>"

    const htmlContent = await render(
      <SepaPreExecutionEmail
        customerName={customerName}
        bagName={bagName}
        rentalEndDate={rentalEndDate}
        amountDue={amountDue}
        reservationId={reservationId}
        termsUrl={`${process.env.NEXT_PUBLIC_SITE_URL}/legal/terms`}
        dashboardUrl={`${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/mis-reservas`}
      />,
    )

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [to],
        subject: "⚠️ Aviso Previo a Ejecución de Mandato SEPA - Acción Requerida",
        html: htmlContent,
        tags: [
          {
            name: "category",
            value: "sepa_pre_execution",
          },
          {
            name: "reservation_id",
            value: reservationId,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("[SEPA EMAIL] Error de Resend:", errorData)
      return {
        success: false,
        error: `Error de Resend: ${errorData}`,
      }
    }

    const result = await response.json()
    console.log("[SEPA EMAIL] Email enviado exitosamente, ID:", result.id)

    return {
      success: true,
      emailId: result.id,
    }
  } catch (error) {
    console.error("[SEPA EMAIL] Error inesperado:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}

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
        error: "EMAIL_API_KEY no configurada",
      }
    }

    const emailFrom = process.env.EMAIL_FROM || "SEMZO PRIVÉ <soporte@semzoprive.com>"

    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aviso Pre-Ejecución SEPA</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #1a1a4b; padding: 20px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">SEMZO PRIVÉ</h1>
  </div>
  
  <div style="padding: 30px 20px; background: #ffffff;">
    <h2 style="color: #dc2626; margin-bottom: 20px;">
      ⚠️ Aviso Previo a Ejecución de Mandato SEPA
    </h2>
    
    <p>Estimada ${customerName},</p>
    
    <p>
      Le informamos que el bolso <strong>${bagName}</strong> (reserva #${reservationId}) 
      aún no ha sido devuelto, habiéndose superado el plazo de finalización del alquiler 
      el día <strong>${rentalEndDate}</strong>.
    </p>
    
    <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold;">
        Plazo máximo para resolución: 72 horas desde la recepción de este aviso
      </p>
    </div>
    
    <h3 style="color: #1a1a4b; margin-top: 30px;">Acciones requeridas:</h3>
    <ol style="line-height: 1.8;">
      <li>Devolver el bolso inmediatamente siguiendo las instrucciones de envío</li>
      <li>Contactar con nuestro equipo en <a href="mailto:soporte@semzoprive.com" style="color: #1a1a4b;">soporte@semzoprive.com</a></li>
      <li>Regularizar el estado de la reserva antes del vencimiento del plazo</li>
    </ol>
    
    <div style="background: #fff7ed; border: 1px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 6px;">
      <p style="margin: 0 0 10px 0; font-weight: bold; color: #92400e;">
        ⚡ Consecuencias si no se resuelve en 72 horas:
      </p>
      <p style="margin: 0; color: #92400e;">
        Se procederá a ejecutar el mandato SEPA Direct Debit autorizado en el momento de la contratación, 
        por un importe de <strong>${amountDue.toFixed(2)}€</strong>, correspondiente al valor del bolso 
        no devuelto, conforme a lo establecido en la cláusula 8.2 de nuestros Términos y Condiciones.
      </p>
    </div>
    
    <h3 style="color: #1a1a4b; margin-top: 30px;">Base legal:</h3>
    <p style="font-size: 14px; color: #666;">
      Este aviso se emite en cumplimiento de la normativa europea SEPA (Reglamento UE 260/2012) y 
      conforme a los <a href="${process.env.NEXT_PUBLIC_SITE_URL}/legal/terms" style="color: #1a1a4b;">Términos y Condiciones</a> 
      aceptados en el momento de la contratación, que establecen el uso del mandato SEPA exclusivamente 
      como mecanismo de respaldo para incidencias graves.
    </p>
    
    <div style="margin: 30px 0; padding: 20px; background: #f3f4f6; border-radius: 6px; text-align: center;">
      <p style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold;">
        Evite cargos adicionales actuando ahora
      </p>
      <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/mis-reservas" 
         style="display: inline-block; background: #1a1a4b; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        Ver Mi Reserva
      </a>
    </div>
    
    <p style="margin-top: 30px;">
      Quedamos a su disposición para cualquier aclaración.<br>
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
    <p style="margin: 10px 0 0 0;">
      © ${new Date().getFullYear()} SEMZO PRIVÉ. Todos los derechos reservados.
    </p>
  </div>
</body>
</html>
    `

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

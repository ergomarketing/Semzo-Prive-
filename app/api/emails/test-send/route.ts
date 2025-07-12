import { type NextRequest, NextResponse } from "next/server"
import { EmailService } from "@/lib/email-service"

export async function POST(request: NextRequest) {
  try {
    const {
      type,
      email,
      name,
      bagName,
      bagBrand,
      membershipType,
      waitingListPosition,
      totalWaiting,
      reservationId,
      availableDate,
    } = await request.json()

    console.log(`📧 Enviando email de prueba tipo: ${type} a ${email}`)

    const emailService = EmailService.getInstance()
    let success = false

    // Datos comunes para todos los emails
    const emailData = {
      to: email,
      customerName: name,
      bagName,
      bagBrand,
      membershipType,
      waitingListPosition,
      totalWaiting,
      reservationId,
      availableDate: availableDate ? new Date(availableDate) : undefined,
    }

    // Enviar el email según el tipo
    switch (type) {
      case "waiting_list_confirmation":
        success = await emailService.sendWaitingListConfirmation(emailData)
        break
      case "bag_available":
        success = await emailService.sendBagAvailableNotification(emailData)
        break
      case "reservation_confirmed":
        success = await emailService.sendReservationConfirmation(emailData)
        break
      case "return_reminder":
        success = await emailService.sendReturnReminder(emailData)
        break
      case "welcome_membership":
        success = await emailService.sendWelcomeMembership(emailData)
        break
      default:
        return NextResponse.json({ error: "Tipo de email no válido" }, { status: 400 })
    }

    if (success) {
      console.log(`✅ Email de prueba ${type} enviado exitosamente a ${email}`)
      return NextResponse.json({
        success: true,
        message: `Email de prueba ${type} enviado exitosamente`,
      })
    } else {
      console.error(`❌ Error enviando email de prueba ${type} a ${email}`)
      return NextResponse.json({ error: "Error enviando email" }, { status: 500 })
    }
  } catch (error) {
    console.error("❌ Error en API de prueba de email:", error)
    return NextResponse.json(
      { error: "Error interno", message: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    )
  }
}

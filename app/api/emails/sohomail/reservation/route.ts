// 🎒 API PARA NOTIFICACIONES DE RESERVA
// ================================================================

import { NextResponse } from "next/server"
import { SohoMailService } from "@/app/lib/sohomail-service"

export async function POST(request: Request) {
  try {
    const data = await request.json()

    console.log("[v0] 📧 Enviando notificación de reserva:", data)

    const sohoMail = SohoMailService.getInstance()
    const success = await sohoMail.sendBagReservationNotification(data)

    if (success) {
      console.log("[v0] ✅ Notificación de reserva enviada exitosamente")
      return NextResponse.json({
        success: true,
        message: "Notificación de reserva enviada",
      })
    } else {
      console.log("[v0] ❌ Error enviando notificación de reserva")
      return NextResponse.json(
        {
          success: false,
          error: "Error enviando notificación",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[v0] ❌ Error en API de reserva:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}

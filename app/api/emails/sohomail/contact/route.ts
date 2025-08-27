// 📞 API PARA FORMULARIOS DE CONTACTO
// ================================================================

import { NextResponse } from "next/server"
import { SohoMailService } from "@/app/lib/sohomail-service"

export async function POST(request: Request) {
  try {
    const data = await request.json()

    console.log("[v0] 📧 Procesando formulario de contacto:", data)

    const sohoMail = SohoMailService.getInstance()
    const success = await sohoMail.sendContactFormNotification(data)

    if (success) {
      console.log("[v0] ✅ Notificación de contacto enviada exitosamente")
      return NextResponse.json({
        success: true,
        message: "Consulta enviada exitosamente",
        ticketId: `TICKET-${Date.now()}`,
      })
    } else {
      console.log("[v0] ❌ Error enviando notificación de contacto")
      return NextResponse.json(
        {
          success: false,
          error: "Error enviando consulta",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[v0] ❌ Error en API de contacto:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}

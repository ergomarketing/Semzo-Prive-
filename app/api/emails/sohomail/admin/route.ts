// 🔔 API PARA NOTIFICACIONES ADMINISTRATIVAS
// ================================================================

import { NextResponse } from "next/server"
import { EmailServiceProduction } from "@/app/lib/email-service-production"

export async function POST(request: Request) {
  try {
    const data = await request.json()

    console.log("[v0] 📧 Enviando notificación administrativa:", data)

    const emailService = EmailServiceProduction.getInstance()
    const success = await emailService.sendContactEmail(
      data.senderName || "Sistema",
      "mailbox@semzoprive.com",
      data.subject || "Notificación Administrativa",
      data.message,
      data.priority || "high",
    )

    if (success) {
      console.log("[v0] ✅ Notificación administrativa enviada exitosamente")
      return NextResponse.json({
        success: true,
        message: "Notificación administrativa enviada",
      })
    } else {
      console.log("[v0] ❌ Error enviando notificación administrativa")
      return NextResponse.json(
        {
          success: false,
          error: "Error enviando notificación",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[v0] ❌ Error en API administrativa:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}

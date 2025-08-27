// 📰 API PARA NEWSLETTER Y MARKETING
// ================================================================

import { NextResponse } from "next/server"
import { SohoMailService } from "@/app/lib/sohomail-service"

export async function POST(request: Request) {
  try {
    const data = await request.json()

    console.log("[v0] 📧 Enviando newsletter:", data)

    const sohoMail = SohoMailService.getInstance()
    const success = await sohoMail.sendNewsletterEmail(data)

    if (success) {
      console.log("[v0] ✅ Newsletter enviado exitosamente")
      return NextResponse.json({
        success: true,
        message: "Newsletter enviado",
      })
    } else {
      console.log("[v0] ❌ Error enviando newsletter")
      return NextResponse.json(
        {
          success: false,
          error: "Error enviando newsletter",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[v0] ❌ Error en API de newsletter:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}

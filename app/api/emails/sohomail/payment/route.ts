// 💳 API PARA CONFIRMACIONES DE PAGO
// ================================================================

import { NextResponse } from "next/server"
import { SohoMailService } from "@/app/lib/sohomail-service"

export async function POST(request: Request) {
  try {
    const data = await request.json()

    console.log("[v0] 📧 Enviando confirmación de pago:", data)

    const sohoMail = SohoMailService.getInstance()
    const success = await sohoMail.sendPaymentConfirmation(data)

    if (success) {
      console.log("[v0] ✅ Confirmación de pago enviada exitosamente")
      return NextResponse.json({
        success: true,
        message: "Confirmación de pago enviada",
      })
    } else {
      console.log("[v0] ❌ Error enviando confirmación de pago")
      return NextResponse.json(
        {
          success: false,
          error: "Error enviando confirmación",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[v0] ❌ Error en API de pago:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}

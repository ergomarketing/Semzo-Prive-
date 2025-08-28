import { NextResponse } from "next/server"
import { SohoMailResendService } from "@/app/lib/sohomail-resend"

export async function POST(request: Request) {
  try {
    const { email, name, phone, preferences } = await request.json()

    if (!email || !name) {
      return NextResponse.json({ error: "Email y nombre son requeridos" }, { status: 400 })
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Formato de email inválido" }, { status: 400 })
    }

    console.log("[v0] 📧 Nueva suscripción al newsletter:", {
      email,
      name,
      phone,
      preferences,
      timestamp: new Date().toISOString(),
    })

    const result = await SohoMailResendService.sendNewsletterEmail(email, name)

    if (result.success) {
      console.log("[v0] ✅ Email de confirmación enviado via Resend")
    } else {
      console.log("[v0] ⚠️ Error enviando confirmación:", result)
    }

    console.log("[v0] ✅ Suscripción registrada exitosamente")
    return NextResponse.json({
      success: true,
      message: "¡Gracias por suscribirte! Recibirás un email de confirmación.",
      data: {
        email,
        name,
        subscribedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("[v0] ❌ Error en suscripción al newsletter:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}

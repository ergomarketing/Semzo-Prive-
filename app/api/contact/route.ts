import { NextResponse } from "next/server"
import { SohoMailResendService } from "@/app/lib/sohomail-resend"

export async function POST(request: Request) {
  try {
    const { name, email, subject, message, priority } = await request.json()

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
    }

    console.log("[v0] 📞 Nueva consulta de contacto:", subject)

    const result = await SohoMailResendService.sendContactEmail({
      name,
      email,
      subject,
      message,
      priority: priority || "Media",
    })

    if (result.success) {
      console.log("[v0] ✅ Email de contacto enviado exitosamente via Resend")
      return NextResponse.json({
        success: true,
        message: "Consulta enviada exitosamente",
        data: {
          ticketId: `TICKET-${Date.now()}`,
          estimatedResponse: "24 horas",
        },
      })
    } else {
      console.log("[v0] ❌ Error enviando email de contacto:", result)
      return NextResponse.json(
        {
          success: false,
          error: "Error enviando la consulta",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[v0] ❌ Error en formulario de contacto:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}

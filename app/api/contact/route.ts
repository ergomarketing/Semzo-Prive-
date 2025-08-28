import { NextResponse } from "next/server"
import { EmailServiceProduction } from "@/app/lib/email-service-production"

const useEmailServiceProduction = () => new EmailServiceProduction()

export async function POST(request: Request) {
  const emailService = useEmailServiceProduction() // Moved hook call to the top level

  try {
    const { name, email, subject, message, priority } = await request.json()

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
    }

    console.log("[v0] 📞 Nueva consulta de contacto:", subject)

    const result = await emailService.sendContactEmail(name, email, subject, message, priority || "Media")

    if (result) {
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
      console.log("[v0] ❌ Error enviando email de contacto")
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

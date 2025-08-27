import { NextResponse } from "next/server"
import { SohoMailService } from "@/app/lib/sohomail-service"

export async function POST(request: Request) {
  try {
    const { name, email, subject, message, priority } = await request.json()

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
    }

    console.log("[v0] 📞 Nueva consulta de contacto:", {
      name,
      email,
      subject,
      message,
      priority: priority || "medium",
      timestamp: new Date().toISOString(),
    })

    const sohoMail = SohoMailService.getInstance()
    const success = await sohoMail.sendContactFormNotification({
      name,
      email,
      subject,
      message,
      priority: priority || "medium",
    })

    if (success) {
      return NextResponse.json({
        success: true,
        message: "Consulta enviada exitosamente",
        data: {
          ticketId: `TICKET-${Date.now()}`,
          estimatedResponse: "24 horas",
        },
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Error enviando la consulta",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[v0] Error en formulario de contacto:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}

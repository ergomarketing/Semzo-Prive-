import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { name, email, subject, message, priority } = await request.json()

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
    }

    console.log("📞 Nueva consulta de contacto:", {
      name,
      email,
      subject,
      message,
      priority: priority || "medium",
      timestamp: new Date().toISOString(),
    })

    // Aquí se enviaría el email al equipo de soporte
    // y se guardaría en la base de datos para seguimiento

    // Simular procesamiento
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return NextResponse.json({
      success: true,
      message: "Consulta enviada exitosamente",
      data: {
        ticketId: `TICKET-${Date.now()}`,
        estimatedResponse: "24 horas",
      },
    })
  } catch (error) {
    console.error("Error en formulario de contacto:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}

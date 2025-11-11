import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { to, subject, message } = await request.json()

    if (!to || !subject || !message) {
      return NextResponse.json({ error: "Faltan campos requeridos (to, subject, message)" }, { status: 400 })
    }

    // Aquí iría la integración con Resend o tu proveedor de email
    // Por ahora, solo simulamos el envío
    console.log(`Simulando envío de email a ${to}`)
    console.log(`Asunto: ${subject}`)
    console.log(`Mensaje: ${message}`)

    // Simular un retraso
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return NextResponse.json({
      success: true,
      message: `Email enviado a ${to}`,
    })
  } catch (error) {
    console.error("Error en API de envío de email:", error)
    return NextResponse.json(
      {
        error: "Error al procesar la solicitud",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}

import { NextResponse } from "next/server"

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

    console.log("📧 Nueva suscripción al newsletter:", {
      email,
      name,
      phone,
      preferences,
      timestamp: new Date().toISOString(),
    })

    // Aquí se integraría con tu proveedor de email (Resend)
    // y se guardaría en la base de datos

    // Simular procesamiento
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return NextResponse.json({
      success: true,
      message: "Suscripción exitosa al newsletter",
      data: {
        email,
        name,
        subscribedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Error en suscripción al newsletter:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}

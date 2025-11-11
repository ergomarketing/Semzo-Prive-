import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { publicKey } = await request.json()

    console.log("🔍 Probando clave pública:", publicKey?.substring(0, 20) + "...")

    if (!publicKey) {
      return NextResponse.json({
        success: false,
        message: "No se proporcionó clave pública",
        details: "Se requiere una clave pública para probar",
      })
    }

    if (!publicKey.startsWith("pk_live_") && !publicKey.startsWith("pk_test_")) {
      return NextResponse.json({
        success: false,
        message: "Formato de clave inválido",
        details: "La clave debe empezar con 'pk_live_' o 'pk_test_'",
      })
    }

    // Verificar longitud aproximada
    if (publicKey.length < 50) {
      return NextResponse.json({
        success: false,
        message: "Clave demasiado corta",
        details: "Las claves de Stripe suelen tener más de 50 caracteres",
      })
    }

    // Para claves live, hacer una verificación más estricta
    if (publicKey.startsWith("pk_live_")) {
      // Verificar que tenga el formato correcto de Stripe
      const stripeKeyPattern = /^pk_live_[A-Za-z0-9]{99}$/
      if (!stripeKeyPattern.test(publicKey)) {
        return NextResponse.json({
          success: false,
          message: "Formato de clave live inválido",
          details: "La clave live no tiene el formato esperado de Stripe",
        })
      }
    }

    // Si llegamos aquí, la clave tiene un formato válido
    return NextResponse.json({
      success: true,
      message: "Clave pública válida",
      details: `Formato correcto para clave ${publicKey.startsWith("pk_live_") ? "LIVE" : "TEST"}`,
    })
  } catch (error) {
    console.error("❌ Error al probar clave pública:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}

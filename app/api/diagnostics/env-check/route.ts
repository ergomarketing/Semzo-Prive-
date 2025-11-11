import { NextResponse } from "next/server"

export async function GET() {
  try {
    const requiredEnvVars = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"]

    const envStatus = requiredEnvVars.map((varName) => {
      const value = process.env[varName]
      return {
        name: varName,
        configured: !!value,
        length: value ? value.length : 0,
        prefix: value ? value.substring(0, 8) + "..." : "No configurada",
      }
    })

    const allConfigured = envStatus.every((env) => env.configured)

    return NextResponse.json({
      success: allConfigured,
      message: allConfigured ? "Todas las variables de entorno están configuradas" : "Faltan variables de entorno",
      details: JSON.stringify(envStatus, null, 2),
      envStatus,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Error al verificar variables de entorno",
      details: error instanceof Error ? error.message : "Error desconocido",
    })
  }
}

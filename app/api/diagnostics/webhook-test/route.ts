import { NextResponse } from "next/server"

export async function GET() {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!webhookSecret) {
      return NextResponse.json({
        success: false,
        message: "STRIPE_WEBHOOK_SECRET no configurada",
        details: "La clave del webhook no está disponible",
      })
    }

    // Verificar que el endpoint del webhook esté accesible
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"

    const webhookUrl = `${baseUrl}/api/webhooks/stripe`

    return NextResponse.json({
      success: true,
      message: "Webhook configurado correctamente",
      details: `URL: ${webhookUrl} | Secret configurado: ${webhookSecret.substring(0, 8)}...`,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Error al verificar webhook",
      details: error instanceof Error ? error.message : "Error desconocido",
    })
  }
}

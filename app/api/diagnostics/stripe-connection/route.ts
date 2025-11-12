import { NextResponse } from "next/server"
import Stripe from "stripe"

export async function GET() {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY

    if (!stripeSecretKey) {
      return NextResponse.json({
        success: false,
        message: "STRIPE_SECRET_KEY no configurada",
        details: "La clave secreta de Stripe no está disponible",
      })
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-06-20",
    })

    // Intentar hacer una llamada simple a la API de Stripe
    const account = await stripe.accounts.retrieve()

    return NextResponse.json({
      success: true,
      message: "Conexión exitosa con Stripe API",
      details: `Cuenta: ${account.id} | País: ${account.country} | Moneda: ${account.default_currency}`,
    })
  } catch (error) {
    let errorMessage = "Error desconocido"
    let errorDetails = ""

    if (error instanceof Stripe.errors.StripeError) {
      errorMessage = `Error de Stripe: ${error.type}`
      errorDetails = `Código: ${error.code} | Mensaje: ${error.message}`
    } else if (error instanceof Error) {
      errorMessage = error.message
      errorDetails = error.stack || ""
    }

    return NextResponse.json({
      success: false,
      message: errorMessage,
      details: errorDetails,
    })
  }
}

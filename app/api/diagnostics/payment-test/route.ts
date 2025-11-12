import { NextResponse } from "next/server"
import Stripe from "stripe"

export async function GET() {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY

    if (!stripeSecretKey) {
      return NextResponse.json({
        success: false,
        message: "STRIPE_SECRET_KEY no configurada",
        details: "No se puede crear payment intent sin la clave secreta",
      })
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-06-20",
    })

    // Crear un payment intent de prueba
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 100, // 1€ en centavos
      currency: "eur",
      metadata: {
        test: "diagnostic",
        timestamp: new Date().toISOString(),
      },
    })

    // Cancelar inmediatamente el payment intent de prueba
    await stripe.paymentIntents.cancel(paymentIntent.id)

    return NextResponse.json({
      success: true,
      message: "Payment Intent creado y cancelado exitosamente",
      details: `ID: ${paymentIntent.id} | Estado: ${paymentIntent.status} | Monto: ${paymentIntent.amount / 100}€`,
    })
  } catch (error) {
    let errorMessage = "Error al crear payment intent"
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

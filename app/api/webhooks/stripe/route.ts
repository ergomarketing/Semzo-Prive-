import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  console.log("🎣 Webhook recibido:", new Date().toISOString())

  try {
    const body = await request.text()
    const signature = request.headers.get("stripe-signature")

    console.log("📝 Datos del webhook:", {
      bodyLength: body.length,
      hasSignature: !!signature,
      signature: signature?.substring(0, 20) + "...",
      webhookSecretConfigured: !!webhookSecret,
    })

    if (!signature) {
      console.error("❌ No se encontró la firma del webhook")
      return NextResponse.json({ error: "No signature" }, { status: 400 })
    }

    if (!webhookSecret) {
      console.error("❌ STRIPE_WEBHOOK_SECRET no configurado")
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
    }

    // Verificar el webhook
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log("✅ Webhook verificado exitosamente:", event.type)
    } catch (err) {
      console.error("❌ Error al verificar webhook:", err)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    // Manejar el evento
    console.log("🔄 Procesando evento:", event.type)

    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log("💰 Pago exitoso:", {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          metadata: paymentIntent.metadata,
        })

        // TODO: Activar membresía en base de datos
        // Aquí deberías guardar la información en tu base de datos

        break

      case "payment_intent.payment_failed":
        const failedPayment = event.data.object as Stripe.PaymentIntent
        console.log("❌ Pago fallido:", {
          id: failedPayment.id,
          lastPaymentError: failedPayment.last_payment_error,
        })
        break

      case "payment_intent.created":
        console.log("📝 Payment intent creado:", event.data.object.id)
        break

      default:
        console.log(`ℹ️ Evento no manejado: ${event.type}`)
    }

    console.log("✅ Webhook procesado exitosamente")
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("❌ Error general en webhook:", error)
    return NextResponse.json(
      {
        error: "Webhook error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    )
  }
}

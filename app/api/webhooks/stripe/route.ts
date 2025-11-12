import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
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
        // Asumo que la lógica de activación está en una función externa o se implementará aquí.
        // Por ahora, solo logueamos.
        // await activateMembership(paymentIntent.metadata.userId, paymentIntent.metadata.planId)

        // Lógica de activación (ejemplo, asumiendo que el user_id está en metadata)
        const userId = paymentIntent.metadata.user_id
        const planId = paymentIntent.metadata.plan_id // O el tipo de membresía

        if (userId && planId) {
          console.log(`Attempting to activate membership for user ${userId} with plan ${planId}`)
          const { error } = await supabaseAdmin
            .from("profiles")
            .update({
              membership_type: planId,
              membership_status: "active",
              stripe_customer_id: paymentIntent.customer,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId)

          if (error) {
            console.error("❌ Error al activar membresía:", error)
          } else {
            console.log(`✅ Membresía activada para el usuario ${userId}`)
          }
        } else {
          console.warn("⚠️ No se encontró userId o planId en los metadatos para activar la membresía.")
        }
        // Asumo que la lógica de activación está en una función externa o se implementará aquí.
        // Por ahora, solo logueamos.
        // await activateMembership(paymentIntent.metadata.userId, paymentIntent.metadata.planId)
        // Aquí deberías guardar la información en tu base de datos

        break

      case "payment_intent.payment_failed":
        const failedPayment = event.data.object as Stripe.PaymentIntent
        console.log("❌ Pago fallido:", {
          id: failedPayment.id,
          lastPaymentError: failedPayment.last_payment_error,
        })
        break

      case "charge.refunded":
        const refundedCharge = event.data.object as Stripe.Charge
        console.log("💸 Reembolso detectado:", {
          chargeId: refundedCharge.id,
          amountRefunded: refundedCharge.amount_refunded,
          metadata: refundedCharge.metadata,
        })

        // Lógica CRÍTICA: Desactivar la membresía o marcarla como "en disputa"
        // Asumo que el ID del usuario o de la suscripción está en los metadatos.
        // Lógica CRÍTICA: Desactivar la membresía o marcarla como "en disputa"
        const userId = refundedCharge.metadata.user_id
        if (userId) {
          console.log(`Attempting to deactivate membership for user ${userId} due to refund.`)
          const { error } = await supabaseAdmin
            .from("profiles")
            .update({
              membership_status: "inactive", // O 'refunded'
              membership_type: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId)

          if (error) {
            console.error("❌ Error al desactivar membresía por reembolso:", error)
          } else {
            console.log(`✅ Membresía desactivada para el usuario ${userId} por reembolso.`)
          }
        } else {
          console.warn("⚠️ No se encontró userId en los metadatos para desactivar la membresía por reembolso.")
        }
        console.log("🚨 ACCIÓN REQUERIDA: Desactivar membresía asociada al pago:", refundedCharge.id)

        break

      case "charge.dispute.created":
        const dispute = event.data.object as Stripe.Dispute
        console.log("🚨 Disputa (Chargeback) detectada:", {
          disputeId: dispute.id,
          chargeId: dispute.charge,
        })

        // Lógica CRÍTICA: Desactivar la membresía inmediatamente
        // Lógica CRÍTICA: Desactivar la membresía inmediatamente
        const userId = dispute.metadata.user_id
        if (userId) {
          console.log(`Attempting to deactivate membership for user ${userId} due to dispute.`)
          const { error } = await supabaseAdmin
            .from("profiles")
            .update({
              membership_status: "disputed", // Nuevo estado para disputas
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId)

          if (error) {
            console.error("❌ Error al desactivar membresía por disputa:", error)
          } else {
            console.log(`✅ Membresía marcada como 'disputed' para el usuario ${userId}.`)
          }
        } else {
          console.warn("⚠️ No se encontró userId en los metadatos para desactivar la membresía por disputa.")
        }
        console.log("🚨 ACCIÓN CRÍTICA: Desactivar membresía inmediatamente debido a disputa:", dispute.charge)

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

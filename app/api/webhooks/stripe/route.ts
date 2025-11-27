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

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log("✅ Webhook verificado exitosamente:", event.type)
    } catch (err) {
      console.error("❌ Error al verificar webhook:", err)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    console.log("🔄 Procesando evento:", event.type)

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        console.log("📦 Suscripción creada/actualizada:", {
          id: subscription.id,
          status: subscription.status,
          customerId: subscription.customer,
        })

        const subUserId = subscription.metadata.user_id
        if (subUserId) {
          // Guardar en tabla subscriptions
          const { error: subError } = await supabaseAdmin.from("subscriptions").upsert(
            {
              stripe_subscription_id: subscription.id,
              stripe_customer_id: subscription.customer as string,
              user_id: subUserId,
              membership_type: subscription.metadata.plan_id || "signature",
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
              canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "stripe_subscription_id" },
          )

          if (subError) {
            console.error("❌ Error guardando suscripción:", subError)
          }

          // Actualizar perfil con estado activo si la suscripción está activa
          if (subscription.status === "active" || subscription.status === "trialing") {
            await supabaseAdmin
              .from("profiles")
              .update({
                membership_status: "active",
                membership_type: subscription.metadata.plan_id || "signature",
                stripe_customer_id: subscription.customer as string,
                stripe_subscription_id: subscription.id,
                updated_at: new Date().toISOString(),
              })
              .eq("id", subUserId)
            console.log(`✅ Membresía activada para usuario ${subUserId}`)
          }
        }
        break
      }

      case "customer.subscription.deleted": {
        const canceledSub = event.data.object as Stripe.Subscription
        console.log("🚫 Suscripción cancelada:", canceledSub.id)

        const cancelUserId = canceledSub.metadata.user_id

        // Actualizar tabla subscriptions
        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "canceled",
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", canceledSub.id)

        if (cancelUserId) {
          await supabaseAdmin
            .from("profiles")
            .update({
              membership_status: "inactive",
              membership_type: null,
              stripe_subscription_id: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", cancelUserId)
          console.log(`✅ Membresía desactivada para usuario ${cancelUserId}`)
        }
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        console.log("💰 Pago de factura exitoso:", invoice.id)

        const invoiceUserId = invoice.metadata?.user_id || invoice.subscription_details?.metadata?.user_id

        // Registrar en historial de pagos
        if (invoiceUserId) {
          // Buscar subscription_id en nuestra base de datos
          const { data: subData } = await supabaseAdmin
            .from("subscriptions")
            .select("id")
            .eq("stripe_subscription_id", invoice.subscription)
            .single()

          await supabaseAdmin.from("payment_history").insert({
            user_id: invoiceUserId,
            subscription_id: subData?.id || null,
            stripe_invoice_id: invoice.id,
            stripe_payment_intent_id: invoice.payment_intent as string,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            status: "succeeded",
            description: `Pago mensual - ${invoice.lines.data[0]?.description || "Membresía"}`,
            payment_date: new Date(invoice.created * 1000).toISOString(),
          })
          console.log(`✅ Pago registrado para usuario ${invoiceUserId}`)
        }
        break
      }

      case "invoice.payment_failed": {
        const failedInvoice = event.data.object as Stripe.Invoice
        console.log("❌ Pago de factura fallido:", failedInvoice.id)

        const failedUserId = failedInvoice.metadata?.user_id

        // Actualizar suscripción a past_due
        if (failedInvoice.subscription) {
          await supabaseAdmin
            .from("subscriptions")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", failedInvoice.subscription)
        }

        // Registrar pago fallido
        if (failedUserId) {
          const { data: subData } = await supabaseAdmin
            .from("subscriptions")
            .select("id")
            .eq("stripe_subscription_id", failedInvoice.subscription)
            .single()

          await supabaseAdmin.from("payment_history").insert({
            user_id: failedUserId,
            subscription_id: subData?.id || null,
            stripe_invoice_id: failedInvoice.id,
            amount: failedInvoice.amount_due,
            currency: failedInvoice.currency,
            status: "failed",
            description: "Pago fallido - Renovación de membresía",
            payment_date: new Date().toISOString(),
          })

          // Marcar perfil como past_due
          await supabaseAdmin
            .from("profiles")
            .update({
              membership_status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("id", failedUserId)
        }
        break
      }

      case "payment_intent.succeeded":
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log("💰 Pago exitoso:", {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          metadata: paymentIntent.metadata,
        })

        const paymentUserId = paymentIntent.metadata.user_id
        const planId = paymentIntent.metadata.plan_id

        if (paymentUserId && planId) {
          console.log(`Attempting to activate membership for user ${paymentUserId} with plan ${planId}`)
          const { error } = await supabaseAdmin
            .from("profiles")
            .update({
              membership_type: planId,
              membership_status: "active",
              stripe_customer_id: paymentIntent.customer,
              updated_at: new Date().toISOString(),
            })
            .eq("id", paymentUserId)

          if (error) {
            console.error("❌ Error al activar membresía:", error)
          } else {
            console.log(`✅ Membresía activada para el usuario ${paymentUserId}`)
          }
        }
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

        const refundUserId = refundedCharge.metadata.user_id
        if (refundUserId) {
          await supabaseAdmin.from("payment_history").insert({
            user_id: refundUserId,
            stripe_payment_intent_id: refundedCharge.payment_intent as string,
            amount: refundedCharge.amount_refunded,
            currency: refundedCharge.currency,
            status: "refunded",
            description: "Reembolso procesado",
            payment_date: new Date().toISOString(),
          })

          const { error } = await supabaseAdmin
            .from("profiles")
            .update({
              membership_status: "inactive",
              membership_type: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", refundUserId)

          if (error) {
            console.error("❌ Error al desactivar membresía por reembolso:", error)
          } else {
            console.log(`✅ Membresía desactivada para el usuario ${refundUserId} por reembolso.`)
          }
        }
        break

      case "charge.dispute.created":
        const dispute = event.data.object as Stripe.Dispute
        console.log("🚨 Disputa (Chargeback) detectada:", {
          disputeId: dispute.id,
          chargeId: dispute.charge,
        })

        const disputeUserId = dispute.metadata.user_id
        if (disputeUserId) {
          const { error } = await supabaseAdmin
            .from("profiles")
            .update({
              membership_status: "disputed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", disputeUserId)

          if (error) {
            console.error("❌ Error al desactivar membresía por disputa:", error)
          } else {
            console.log(`✅ Membresía marcada como 'disputed' para el usuario ${disputeUserId}.`)
          }
        }
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

import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "mailbox@semzoprive.com"

async function notifyAdmin(subject: string, htmlContent: string) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/admin/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: ADMIN_EMAIL,
        subject: `[Admin] ${subject}`,
        body: htmlContent,
        html: htmlContent,
      }),
    })
    console.log(`✅ Admin notificado: ${subject}`)
  } catch (error) {
    console.error("❌ Error notificando admin:", error)
  }
}

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

            if (event.type === "customer.subscription.created") {
              const { data: userProfile } = await supabaseAdmin
                .from("profiles")
                .select("full_name, email")
                .eq("id", subUserId)
                .single()

              await notifyAdmin(
                `Nueva Suscripción - ${subscription.metadata.plan_id || "signature"}`,
                `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #1a1a4b;">🎉 Nueva Suscripción</h2>
                  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Cliente:</strong> ${userProfile?.full_name || "N/A"}</p>
                    <p><strong>Email:</strong> ${userProfile?.email || "N/A"}</p>
                    <p><strong>Plan:</strong> ${subscription.metadata.plan_id || "signature"}</p>
                    <p><strong>Estado:</strong> ${subscription.status}</p>
                    <p><strong>Fecha:</strong> ${new Date().toLocaleString("es-ES")}</p>
                  </div>
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/subscriptions" style="background: #1a1a4b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Ver en Panel Admin</a>
                </div>
                `,
              )
            }
          }
        }
        break
      }

      case "customer.subscription.deleted": {
        const canceledSub = event.data.object as Stripe.Subscription
        console.log("🚫 Suscripción cancelada:", canceledSub.id)

        const cancelUserId = canceledSub.metadata.user_id

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

        if (invoiceUserId) {
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

        if (failedInvoice.subscription) {
          await supabaseAdmin
            .from("subscriptions")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", failedInvoice.subscription)
        }

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

        if (paymentIntent.metadata.type === "gift_card") {
          console.log("🎁 Procesando gift card...")
          const recipientEmail = paymentIntent.metadata.recipient_email

          const { data: giftCard, error: gcError } = await supabaseAdmin
            .from("gift_cards")
            .update({
              status: "active",
              updated_at: new Date().toISOString(),
            })
            .eq("purchased_by", paymentIntent.metadata.user_id)
            .eq("status", "pending")
            .order("created_at", { ascending: false })
            .limit(1)
            .select()
            .single()

          if (gcError) {
            console.error("❌ Error activating gift card:", gcError)
          } else if (giftCard && recipientEmail) {
            console.log(`📧 Enviando gift card a: ${recipientEmail}`)
            try {
              await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/admin/send-email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  to: recipientEmail,
                  subject: "🎁 Has recibido una Gift Card de Semzo Privé",
                  body: `Has recibido una gift card de ${(giftCard.amount / 100).toFixed(0)}€. Código: ${giftCard.code}`,
                  html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                      <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #1a1a4b;">Semzo Privé</h1>
                      </div>
                      <h2 style="color: #1a1a4b;">¡Has recibido una Gift Card!</h2>
                      ${giftCard.recipient_name ? `<p>Hola ${giftCard.recipient_name},</p>` : "<p>Hola,</p>"}
                      <p>Alguien especial te ha enviado una gift card de Semzo Privé.</p>
                      ${giftCard.personal_message ? `<p style="background: #fff0f3; padding: 15px; border-radius: 8px; font-style: italic;">"${giftCard.personal_message}"</p>` : ""}
                      <div style="background: #1a1a4b; color: white; padding: 30px; border-radius: 12px; text-align: center; margin: 20px 0;">
                        <p style="margin: 0; font-size: 14px;">Tu código de Gift Card:</p>
                        <p style="margin: 10px 0; font-size: 28px; font-weight: bold; letter-spacing: 2px;">${giftCard.code}</p>
                        <p style="margin: 0; font-size: 24px;">${(giftCard.amount / 100).toFixed(0)}€</p>
                      </div>
                      <p>Puedes usar este código en el checkout para pagar tu membresía o cualquier servicio.</p>
                      <p style="color: #666; font-size: 12px;">Válido hasta: ${new Date(giftCard.expires_at).toLocaleDateString("es-ES")}</p>
                      <div style="text-align: center; margin-top: 30px;">
                        <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://semzoprive.com"}" style="background: #1a1a4b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px;">Visitar Semzo Privé</a>
                      </div>
                    </div>
                  `,
                }),
              })
              console.log("✅ Gift card email enviado")

              await notifyAdmin(
                `Nueva Gift Card Comprada - ${(giftCard.amount / 100).toFixed(0)}€`,
                `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #1a1a4b;">🎁 Nueva Gift Card</h2>
                  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Monto:</strong> ${(giftCard.amount / 100).toFixed(0)}€</p>
                    <p><strong>Código:</strong> ${giftCard.code}</p>
                    <p><strong>Destinatario:</strong> ${recipientEmail}</p>
                    <p><strong>Fecha:</strong> ${new Date().toLocaleString("es-ES")}</p>
                  </div>
                </div>
                `,
              )
            } catch (emailError) {
              console.error("❌ Error enviando email de gift card:", emailError)
            }
          }
        }

        if (paymentUserId && planId) {
          console.log(`Attempting to activate membership for user ${paymentUserId} with plan ${planId}`)

          const { data: userProfile } = await supabaseAdmin
            .from("profiles")
            .select("full_name, email")
            .eq("id", paymentUserId)
            .single()

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

            await notifyAdmin(
              `Nueva Membresía - ${planId.toUpperCase()}`,
              `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #1a1a4b;">🎉 Nueva Membresía Activada</h2>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Cliente:</strong> ${userProfile?.full_name || "N/A"}</p>
                  <p><strong>Email:</strong> ${userProfile?.email || "N/A"}</p>
                  <p><strong>Plan:</strong> ${planId.toUpperCase()}</p>
                  <p><strong>Monto:</strong> ${(paymentIntent.amount / 100).toFixed(2)}€</p>
                  <p><strong>Fecha:</strong> ${new Date().toLocaleString("es-ES")}</p>
                </div>
                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/subscriptions" style="background: #1a1a4b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Ver en Panel Admin</a>
              </div>
              `,
            )
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

import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import Stripe from "stripe"
import { runFraudGate, logAudit } from "@/lib/fraud-gate"

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
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        console.log("🎟️ Checkout completado:", {
          id: session.id,
          mode: session.mode,
          subscriptionId: session.subscription,
          customerId: session.customer,
        })

        // Solo procesar si es una suscripción (no one-time payments)
        if (session.mode === "subscription" && session.subscription) {
          const userId = session.metadata?.user_id
          const membershipType = session.metadata?.membership_type
          const billingCycle = session.metadata?.billing_cycle || "monthly"
          const intentId = session.metadata?.intent_id

          if (!userId) {
            console.error("❌ No user_id en metadata del checkout session")
            break
          }

          console.log(`[v0] Checkout completado para usuario ${userId}, tipo: ${membershipType}, intent_id: ${intentId}`)

          // AUDIT LOG: checkout.session.completed
          await supabaseAdmin.from("audit_logs").insert({
            action_type: "checkout_session_completed",
            entity_type: "stripe_session",
            entity_id: session.id,
            actor_type: "webhook",
            user_id: userId,
            metadata: {
              subscription_id: session.subscription,
              customer_id: session.customer,
              membership_type: membershipType,
              billing_cycle: billingCycle,
              intent_id: intentId,
              amount: session.amount_total,
              currency: session.currency,
            },
            created_at: new Date().toISOString(),
          })

          // Guardar stripe_customer_id, stripe_subscription_id y SEPA flags en profile
          const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .update({
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              sepa_enabled: true,
              payment_methods: ["card", "sepa_debit"],
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId)

          if (profileError) {
            console.error("❌ Error actualizando profile con datos de Stripe:", profileError)
          } else {
            console.log(`✅ Profile actualizado con subscription_id: ${session.subscription}`)
          }

          // CRÍTICO: ACTIVAR MEMBRESÍA INMEDIATAMENTE (billing webhook es source of truth)
          // La activación NO depende de intentId - el pago de Stripe es suficiente
          const now = new Date()
          
          // 1. Si hay intentId, actualizar intent a "active" (opcional, solo tracking)
          if (intentId) {
            const { error: intentError } = await supabaseAdmin
              .from("membership_intents")
              .update({
                status: "active",
                stripe_payment_intent_id: session.payment_intent as string,
                stripe_customer_id: session.customer as string,
                stripe_subscription_id: session.subscription as string,
                paid_at: now.toISOString(),
                activated_at: now.toISOString(),
                updated_at: now.toISOString(),
              })
              .eq("id", intentId)

            if (intentError) {
              console.error("❌ Error actualizando membership_intent:", intentError)
            } else {
              console.log(`✅ Intent ${intentId} actualizado a active`)
            }
          } else {
            console.log("⚠️ No intentId en metadata - creando membresía sin intent tracking")
          }

          // 2. ACTIVAR MEMBRESÍA INMEDIATAMENTE en user_memberships (billing es source of truth)
          let endsAt = null
          if (membershipType === "petite") {
            endsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }

          console.log("[v0] Attempting to insert user_membership:", {
            user_id: userId,
            membership_type: membershipType,
            billing_cycle: billingCycle,
            status: "active",
            stripe_subscription_id: session.subscription,
            stripe_customer_id: session.customer,
          })

          const { data: membershipData, error: membershipError } = await supabaseAdmin.from("user_memberships").insert({
            user_id: userId,
            membership_type: membershipType,
            billing_cycle: billingCycle,
            status: "active",
            stripe_subscription_id: session.subscription as string,
            stripe_customer_id: session.customer as string,
            starts_at: now.toISOString(),
            ends_at: endsAt,
            created_at: now.toISOString(),
            updated_at: now.toISOString(),
          }).select()

          if (membershipError) {
            console.error("❌ Error creating user_membership:", membershipError)
            console.error("[v0] Full error details:", JSON.stringify(membershipError, null, 2))
          } else {
            console.log(`✅ Membresía ${membershipType} ACTIVADA inmediatamente para usuario ${userId}`)
            console.log("[v0] Membership data inserted:", membershipData)
          }

          // 3. Actualizar profile
          await supabaseAdmin
            .from("profiles")
            .update({
              membership_type: membershipType,
              membership_status: "active",
              updated_at: now.toISOString(),
            })
            .eq("id", userId)

          // Obtener datos del usuario
          const { data: userProfile } = await supabaseAdmin
            .from("profiles")
            .select("full_name, email")
            .eq("id", userId)
            .single()

          // Email de bienvenida al usuario (membresía ya activa)
          if (userProfile?.email) {
            await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/send-email`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                to: userProfile.email,
                subject: "¡Bienvenida a Semzo Privé!",
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #10b981;">¡Bienvenida a Semzo Privé!</h2>
                    <p>Hola ${userProfile.full_name || ""},</p>
                    <p>Tu pago ha sido procesado exitosamente y <strong>tu membresía está activa</strong>. Ya puedes acceder a nuestro catálogo exclusivo de bolsos de lujo.</p>
                    <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #10b981;">
                      <p><strong>Plan:</strong> ${membershipType}</p>
                      <p><strong>Ciclo:</strong> ${billingCycle === "monthly" ? "Mensual" : "Trimestral"}</p>
                      <p><strong>Estado:</strong> ✅ Activa</p>
                    </div>
                    <p><strong>Opcional:</strong> Puedes completar la verificación de identidad para desbloquear features premium adicionales.</p>
                    <div style="margin: 30px 0;">
                      <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" 
                         style="background: #1a1a4b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        Ir a Mi Dashboard
                      </a>
                    </div>
                    <p style="color: #666; font-size: 12px;">
                      Si tienes alguna pregunta, contáctanos en ${ADMIN_EMAIL}
                    </p>
                  </div>
                `,
              }),
            })
          }

          // Notificar admin
          await notifyAdmin(
            `Membresía Activada - ${membershipType}`,
            `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #10b981;">✅ Membresía Activada</h2>
              <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #10b981;">
                <p><strong>Cliente:</strong> ${userProfile?.full_name || "N/A"}</p>
                <p><strong>Email:</strong> ${userProfile?.email || "N/A"}</p>
                <p><strong>Plan:</strong> ${membershipType}</p>
                <p><strong>Ciclo:</strong> ${billingCycle}</p>
                <p><strong>Estado:</strong> ✅ Activa</p>
                <p><strong>Subscription ID:</strong> ${session.subscription}</p>
                <p><strong>Fecha:</strong> ${new Date().toLocaleString("es-ES")}</p>
              </div>
              <p style="color: #10b981;">✅ Membresía activada inmediatamente. Identity verification es opcional para features premium.</p>
            </div>
            `,
          )
        }
        break
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        console.log("📦 Suscripción creada/actualizada:", {
          id: subscription.id,
          status: subscription.status,
          customerId: subscription.customer,
        })

        const subUserId = subscription.metadata.user_id
        const membershipType = subscription.metadata.membership_type || subscription.metadata.plan_id || "essentiel"
        const billingCycle = subscription.metadata.billing_cycle || "monthly"

        if (!subUserId) {
          console.error("❌ No user_id en metadata de la suscripción")
          break
        }

        // 👉 ACTIVACIÓN DE MEMBRESÍA - ÚNICA FUENTE DE VERDAD
        if (subscription.status === "active" || subscription.status === "trialing") {
          console.log(`[v0] Activando membresía para usuario ${subUserId}`)

          // Actualizar user_memberships con fechas de Stripe (NO calculadas manualmente)
          const { error: membershipError } = await supabaseAdmin.from("user_memberships").upsert(
            {
              user_id: subUserId,
              membership_type: membershipType,
              billing_cycle: billingCycle,
              status: "active",
              stripe_subscription_id: subscription.id,
              stripe_customer_id: subscription.customer as string,
              membership_start_date: new Date(subscription.current_period_start * 1000).toISOString(),
              membership_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "user_id",
            },
          )

          if (membershipError) {
            console.error("❌ Error activando membresía en user_memberships:", membershipError)
          } else {
            console.log(`✅ Membresía activada: ${membershipType}, end_date: ${new Date(subscription.current_period_end * 1000).toISOString()}`)
          }

          // Actualizar profiles con IDs de Stripe
          const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .update({
              membership_status: "active",
              membership_type: membershipType,
              stripe_customer_id: subscription.customer as string,
              stripe_subscription_id: subscription.id,
              updated_at: new Date().toISOString(),
            })
            .eq("id", subUserId)

          if (profileError) {
            console.error("❌ Error actualizando profile:", profileError)
          }

          // Actualizar membership_intent a active si existe
          await supabaseAdmin
            .from("membership_intents")
            .update({
              status: "active",
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", subUserId)
            .eq("stripe_subscription_id", subscription.id)

          // Notificar admin solo en creación
          if (event.type === "customer.subscription.created") {
            const { data: userProfile } = await supabaseAdmin
              .from("profiles")
              .select("full_name, email")
              .eq("id", subUserId)
              .single()

            await notifyAdmin(
              `Membresía Activada - ${membershipType}`,
              `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #10b981;">✅ Membresía Activada</h2>
                <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #10b981;">
                  <p><strong>Cliente:</strong> ${userProfile?.full_name || "N/A"}</p>
                  <p><strong>Email:</strong> ${userProfile?.email || "N/A"}</p>
                  <p><strong>Plan:</strong> ${membershipType}</p>
                  <p><strong>Ciclo:</strong> ${billingCycle}</p>
                  <p><strong>Estado:</strong> ${subscription.status}</p>
                  <p><strong>Inicio:</strong> ${new Date(subscription.current_period_start * 1000).toLocaleString("es-ES")}</p>
                  <p><strong>Fin:</strong> ${new Date(subscription.current_period_end * 1000).toLocaleString("es-ES")}</p>
                </div>
                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/subscriptions" style="background: #1a1a4b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Ver en Panel Admin</a>
              </div>
              `,
            )
          }
        }
        break
      }

      case "customer.subscription.deleted": {
        const canceledSub = event.data.object as Stripe.Subscription
        console.log("🚫 Suscripción cancelada:", canceledSub.id)

        const cancelUserId = canceledSub.metadata.user_id

        let userId: string | null = cancelUserId

        if (!cancelUserId) {
          // Buscar user_id desde la DB si no está en metadata
          const { data: membership } = await supabaseAdmin
            .from("user_memberships")
            .select("user_id")
            .eq("stripe_subscription_id", canceledSub.id)
            .single()

          if (!membership?.user_id) {
            console.error("❌ No se pudo encontrar user_id para la suscripción cancelada")
            break
          }

          userId = membership.user_id
        }

        // Marcar user_memberships como cancelled
        const { error: membershipError } = await supabaseAdmin
          .from("user_memberships")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", canceledSub.id)

        if (membershipError) {
          console.error("❌ Error marcando membresía como cancelled:", membershipError)
        } else {
          console.log(`✅ Membresía marcada como cancelled para subscription ${canceledSub.id}`)
        }

        // Actualizar profile
        if (userId) {
          await supabaseAdmin
            .from("profiles")
            .update({
              membership_status: "cancelled",
              stripe_subscription_id: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId)
          console.log(`✅ Profile actualizado - acceso cerrado para usuario ${userId}`)
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

        // Obtener user_id desde la suscripción
        let failedUserId = failedInvoice.metadata?.user_id

        if (!failedUserId && failedInvoice.subscription) {
          // Buscar user_id desde la suscripción en la DB
          const { data: membership } = await supabaseAdmin
            .from("user_memberships")
            .select("user_id")
            .eq("stripe_subscription_id", failedInvoice.subscription)
            .single()

          failedUserId = membership?.user_id
        }

        if (failedUserId) {
          // Marcar membresía como past_due
          const { error: updateError } = await supabaseAdmin
            .from("user_memberships")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", failedUserId)

          if (updateError) {
            console.error("❌ Error marcando membresía como past_due:", updateError)
          } else {
            console.log(`✅ Membresía marcada como past_due para usuario ${failedUserId}`)
          }

          // También actualizar profile
          await supabaseAdmin
            .from("profiles")
            .update({
              membership_status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("id", failedUserId)

          // Enviar email al usuario
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("email, full_name")
            .eq("id", failedUserId)
            .single()

          if (profile?.email) {
            await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/send-email`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                to: profile.email,
                subject: "Problema con tu pago - Semzo Privé",
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #dc2626;">⚠️ Problema con tu Pago</h2>
                    <p>Hola ${profile.full_name || ""},</p>
                    <p>No pudimos procesar el pago de tu membresía. Por favor actualiza tu método de pago para mantener tu acceso activo.</p>
                    <div style="margin: 30px 0;">
                      <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/membresia" 
                         style="background: #1a1a4b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        Actualizar Método de Pago
                      </a>
                    </div>
                    <p style="color: #666; font-size: 12px;">
                      Si tienes alguna pregunta, contáctanos en ${ADMIN_EMAIL}
                    </p>
                  </div>
                `,
              }),
            })
          }

          // Notificar admin
          await notifyAdmin(
            `Pago Fallido - ${profile?.full_name || failedUserId}`,
            `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #dc2626;">❌ Pago Fallido</h2>
                <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Cliente:</strong> ${profile?.full_name || "N/A"}</p>
                  <p><strong>Email:</strong> ${profile?.email || "N/A"}</p>
                  <p><strong>Invoice ID:</strong> ${failedInvoice.id}</p>
                  <p><strong>Estado:</strong> past_due</p>
                  <p><strong>Fecha:</strong> ${new Date().toLocaleString("es-ES")}</p>
                </div>
                <p style="color: #dc2626;">⚠️ Stripe reintentará automáticamente según su configuración de dunning.</p>
              </div>
            `,
          )
        }
        break
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log("💰 Pago exitoso:", {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          metadata: paymentIntent.metadata,
        })

        const paymentUserId = paymentIntent.metadata.user_id
        const paymentUserEmail = paymentIntent.metadata.userEmail
        const planId = paymentIntent.metadata.plan_id
        const intentId = paymentIntent.metadata.intent_id

        if (!paymentUserId || paymentUserId.startsWith("guest_")) {
          console.log("❌ Invalid userId - payment requires authenticated user")
          break
        }

        if (intentId) {
          console.log(`[v0] Updating membership intent ${intentId} to paid_pending_verification`)

          const { error: intentError } = await supabaseAdmin
            .from("membership_intents")
            .update({
              status: "paid_pending_verification",
              stripe_payment_intent_id: paymentIntent.id,
              stripe_customer_id: paymentIntent.customer as string,
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", intentId)
            .eq("user_id", paymentUserId)

          if (intentError) {
            console.error("[v0] Error updating membership intent:", intentError)
          } else {
            console.log(`[v0] ✅ Membership intent ${intentId} updated to paid_pending_verification`)

            const { data: intentData } = await supabaseAdmin
              .from("membership_intents")
              .select("membership_type")
              .eq("id", intentId)
              .single()

            const { data: userProfile } = await supabaseAdmin
              .from("profiles")
              .select("full_name, email")
              .eq("id", paymentUserId)
              .single()

            await notifyAdmin(
              `Pago Recibido - ${intentData?.membership_type || planId} - Pendiente Verificación`,
              `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #1a1a4b;">💰 Pago Recibido</h2>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Cliente:</strong> ${userProfile?.full_name || "N/A"}</p>
                  <p><strong>Email:</strong> ${userProfile?.email || paymentUserEmail}</p>
                  <p><strong>Plan:</strong> ${intentData?.membership_type || planId}</p>
                  <p><strong>Monto:</strong> ${(paymentIntent.amount / 100).toFixed(2)}€</p>
                  <p><strong>Estado:</strong> Pagado - Pendiente de Verificación de Identidad</p>
                  <p><strong>Fecha:</strong> ${new Date().toLocaleString("es-ES")}</p>
                </div>
                <p style="color: #dc2626;">⚠️ El usuario debe completar la verificación de identidad para activar la membresía.</p>
              </div>
              `,
            )

            // NO enviar email aquí - el usuario puede no tener email real todavía
            // El email se enviará DESPUÉS de completar verificación de identidad y registrar email real
          }
        } else {
          console.warn("[v0] ⚠️ No intent_id in payment metadata - skipping membership intent update")
        }

        if (paymentIntent.metadata.type !== "gift_card") {
          console.log(`[FraudGate] Starting fraud validation for user ${paymentIntent.metadata.user_id}`)

          const fraudResult = await runFraudGate({
            userId: paymentIntent.metadata.user_id,
            planId,
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
          })

          await logAudit({
            actionType: "fraud_gate_check",
            entityType: "payment_intent",
            entityId: paymentIntent.id,
            actorType: "system",
            metadata: {
              fraudResult,
              userId: paymentIntent.metadata.user_id,
              planId,
              amount: paymentIntent.amount,
            },
          })

          if (!fraudResult.passed) {
            console.error(`[FraudGate] FRAUD DETECTED! Action: ${fraudResult.action}, Risk: ${fraudResult.riskScore}`)

            if (fraudResult.action === "reject") {
              try {
                await stripe.refunds.create({
                  payment_intent: paymentIntent.id,
                  reason: "fraudulent",
                })
                console.log(`[FraudGate] Payment refunded due to fraud detection`)
              } catch (refundError) {
                console.error("[FraudGate] Error refunding payment:", refundError)
              }
            }

            await notifyAdmin(
              `🚨 FRAUDE DETECTADO - Usuario ${paymentIntent.metadata.user_id}`,
              `
              <div style="font-family: Arial, sans-serif; background: #fee2e2; padding: 20px; border-left: 4px solid #dc2626;">
                <h2 style="color: #dc2626;">⛔ ALERTA DE FRAUDE</h2>
                <p><strong>Usuario:</strong> ${paymentIntent.metadata.user_id}</p>
                <p><strong>Plan:</strong> ${planId}</p>
                <p><strong>Monto:</strong> ${(paymentIntent.amount / 100).toFixed(2)}€</p>
                <p><strong>Risk Score:</strong> ${fraudResult.riskScore}/100</p>
                <p><strong>Acción:</strong> ${fraudResult.action.toUpperCase()}</p>
                <h3>Checks fallidos:</h3>
                <ul>
                  ${fraudResult.checks
                    .filter((c) => !c.passed)
                    .map((c) => `<li><strong>${c.type}:</strong> ${c.message}</li>`)
                    .join("")}
                </ul>
                <p style="margin-top: 20px;">
                  ${fraudResult.action === "reject" ? "✅ Pago automáticamente reembolsado" : "⚠️ Requiere revisión manual"}
                </p>
              </div>
              `,
            )

            break
          }

          console.log(`[FraudGate] ✅ All fraud checks passed for user ${paymentIntent.metadata.user_id}`)
        }

        if (paymentIntent.metadata.type === "gift_card") {
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
        break
      }

      case "payment_intent.payment_failed": {
        const failedPayment = event.data.object as Stripe.PaymentIntent
        console.log("❌ Pago fallido:", {
          id: failedPayment.id,
          lastPaymentError: failedPayment.last_payment_error,
        })
        break
      }

      case "charge.refunded": {
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
      }

      case "charge.dispute.created": {
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
      }

      case "payment_intent.created": {
        console.log("📝 Payment intent creado:", event.data.object.id)
        break
      }

      case "setup_intent.succeeded": {
        const setupIntent = event.data.object as Stripe.SetupIntent
        console.log("✅ Setup Intent succeeded:", setupIntent.id)

        const userId = setupIntent.metadata.user_id
        const paymentMethodId = setupIntent.payment_method as string

        if (userId && paymentMethodId) {
          const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)

          await supabaseAdmin
            .from("user_memberships")
            .update({
              stripe_payment_method_id: paymentMethodId,
              payment_method_verified: true,
              payment_method_last4: paymentMethod.card?.last4,
              payment_method_brand: paymentMethod.card?.brand,
              failed_payment_count: 0,
              dunning_status: null,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId)
            .eq("status", "active")

          console.log(`✅ Payment method ${paymentMethodId} guardado para usuario ${userId}`)
        }
        break
      }

      case "identity.verification_session.verified": {
        const verificationSession = event.data.object as Stripe.Identity.VerificationSession
        console.log("✅ Identity verification succeeded:", verificationSession.id)

        const userId = verificationSession.metadata?.user_id

        if (!userId) {
          console.error("❌ Missing user_id in verification session metadata")
          break
        }

        console.log(`[v0] Identity verified for user ${userId} - updating flag only (NOT activating membership)`)

        // ÚNICA ACCIÓN: Actualizar flag identity_verified (Identity NO toca billing)
        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .update({
            identity_verified: true,
            stripe_verification_session_id: verificationSession.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId)

        if (profileError) {
          console.error("❌ Error updating identity_verified flag:", profileError)
        } else {
          console.log(`✅ Identity verified flag set to true for user ${userId}`)
        }

        // Opcional: Actualizar intent con verification_session_id (solo para tracking)
        await supabaseAdmin
          .from("membership_intents")
          .update({
            stripe_verification_session_id: verificationSession.id,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .eq("status", "active")

        // Notificar admin
        const { data: userProfile } = await supabaseAdmin
          .from("profiles")
          .select("full_name, email")
          .eq("id", userId)
          .single()

        await notifyAdmin(
          `Identidad Verificada - ${userProfile?.full_name || userId}`,
          `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #10b981;">✅ Identidad Verificada</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Cliente:</strong> ${userProfile?.full_name || "N/A"}</p>
              <p><strong>Email:</strong> ${userProfile?.email || "N/A"}</p>
              <p><strong>Verification Session:</strong> ${verificationSession.id}</p>
              <p><strong>Fecha:</strong> ${new Date().toLocaleString("es-ES")}</p>
            </div>
            <p style="color: #3b82f6;">ℹ️ Solo se actualizó el flag de identidad verificada. La membresía fue activada previamente por el webhook de billing.</p>
          </div>
          `,
        )
        break
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log("💳 Payment Intent succeeded:", paymentIntent.id)

        // Si el payment intent viene de un checkout session con metadata de membresía, activar
        const userId = paymentIntent.metadata?.user_id
        const membershipType = paymentIntent.metadata?.membership_type
        const billingCycle = paymentIntent.metadata?.billing_cycle
        const intentId = paymentIntent.metadata?.intent_id

        if (userId && membershipType) {
          console.log(`[v0] Payment Intent tiene metadata de membresía - activando para ${userId}`)

          const now = new Date()
          let endsAt = null
          if (membershipType === "petite") {
            endsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }

          // Activar membresía en user_memberships
          const { error: membershipError } = await supabaseAdmin.from("user_memberships").insert({
            user_id: userId,
            membership_type: membershipType,
            billing_cycle: billingCycle || "monthly",
            status: "active",
            stripe_payment_intent_id: paymentIntent.id,
            stripe_customer_id: paymentIntent.customer as string,
            starts_at: now.toISOString(),
            ends_at: endsAt,
            created_at: now.toISOString(),
            updated_at: now.toISOString(),
          })

          if (membershipError) {
            console.error("❌ Error creating membership from payment_intent:", membershipError)
          } else {
            console.log(`✅ Membresía ${membershipType} activada desde payment_intent`)
          }

          // Actualizar intent si existe
          if (intentId) {
            await supabaseAdmin
              .from("membership_intents")
              .update({
                status: "active",
                stripe_payment_intent_id: paymentIntent.id,
                paid_at: now.toISOString(),
                activated_at: now.toISOString(),
                updated_at: now.toISOString(),
              })
              .eq("id", intentId)
          }

          // Actualizar profile
          await supabaseAdmin
            .from("profiles")
            .update({
              membership_type: membershipType,
              membership_status: "active",
              updated_at: now.toISOString(),
            })
            .eq("id", userId)

        } else {
          console.log("ℹ️ Payment Intent sin metadata de membresía - probablemente otro tipo de pago")
        }

        break
      }

      default:
        console.log(`ℹ️ Evento no manejado: ${event.type}`)
    }

    console.log("✅ Webhook procesado exitosamente")
    return NextResponse.json({ received: true }, { status: 200 })
  } catch (err) {
    console.error("❌ Error procesando webhook:", err)
    return NextResponse.json({ received: true, error: "internal_error" }, { status: 200 })
  }
}

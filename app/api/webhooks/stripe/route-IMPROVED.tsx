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
    // ✅ CORRECTO: Usa .text() para signature verification
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
    console.log("📥 Webhook event:", { eventId: event.id, eventType: event.type })

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

          // VALIDACIÓN CRÍTICA: user_id y membership_type OBLIGATORIOS
          if (!userId) {
            console.error("❌ No user_id en metadata del checkout session", { sessionId: session.id })
            break
          }

          if (!membershipType) {
            console.error("❌ No membership_type en metadata del checkout session", { sessionId: session.id, userId })
            break
          }

          // ⚠️ NUEVO: Validación estricta de intent_id (opcional - depende de tu flujo)
          if (!intentId) {
            console.error("❌ CRÍTICO: No intent_id en metadata del checkout session", {
              sessionId: session.id,
              userId,
              membershipType,
            })
            // Opcional: Puedes hacer break aquí si quieres que intent_id sea obligatorio
            // break
          }

          console.log(`[v0] Checkout completado para usuario ${userId}, tipo: ${membershipType}, intent_id: ${intentId || "N/A"}`)

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
              intent_id: intentId || null,
              amount: session.amount_total,
              currency: session.currency,
            },
            created_at: new Date().toISOString(),
          })

          // Guardar stripe_customer_id, stripe_subscription_id en profile
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

          // RESOLVER INTENT (si existe)
          const now = new Date()
          let intentRecord: any = null
          let resolvedMembershipType = membershipType
          let resolvedBillingCycle = billingCycle

          if (intentId) {
            const { data: selectedIntent, error: selectIntentError } = await supabaseAdmin
              .from("membership_intents")
              .select("*")
              .eq("id", intentId)
              .single()

            if (selectIntentError) {
              console.error("❌ Error loading membership_intent by intent_id:", {
                intent_id: intentId,
                error: selectIntentError,
              })
            } else {
              intentRecord = selectedIntent
              resolvedMembershipType = selectedIntent.membership_type || membershipType
              resolvedBillingCycle = selectedIntent.billing_cycle || billingCycle
              console.log("✅ membership_intent loaded from metadata.intent_id", {
                intent_id: intentId,
                membership_type: resolvedMembershipType,
                billing_cycle: resolvedBillingCycle,
              })
            }

            // Actualizar intent a "active"
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

          // ACTIVAR MEMBRESÍA INMEDIATAMENTE en user_memberships
          let endsAt = null
          if (resolvedMembershipType === "petite") {
            endsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }

          console.log("[v0] Attempting to insert user_membership:", {
            user_id: userId,
            membership_type: resolvedMembershipType,
            billing_cycle: resolvedBillingCycle,
            status: "active",
            stripe_subscription_id: session.subscription,
            stripe_customer_id: session.customer,
          })

          // ✅ NUEVO: UPSERT con manejo de error crítico
          const { data: membershipData, error: membershipError } = await supabaseAdmin
            .from("user_memberships")
            .upsert(
              {
                user_id: userId,
                membership_type: resolvedMembershipType,
                billing_cycle: resolvedBillingCycle,
                status: "active",
                stripe_subscription_id: session.subscription as string,
                stripe_customer_id: session.customer as string,
                starts_at: now.toISOString(),
                ends_at: endsAt,
                created_at: now.toISOString(),
                updated_at: now.toISOString(),
              },
              { onConflict: "user_id" },
            )
            .select()

          // ⚠️ MEJORA: Si falla el UPSERT, devolver error 500 para que Stripe reintente
          if (membershipError) {
            console.error("❌ CRÍTICO: Error creating user_membership:", membershipError)
            console.error("[v0] Full error details:", JSON.stringify(membershipError, null, 2))
            
            // Notificar admin inmediatamente
            await notifyAdmin(
              "🚨 CRÍTICO: Error activando membresía",
              `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #ef4444;">🚨 Error Crítico en Webhook</h2>
                <div style="background: #fee; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #ef4444;">
                  <p><strong>Evento:</strong> checkout.session.completed</p>
                  <p><strong>Session ID:</strong> ${session.id}</p>
                  <p><strong>User ID:</strong> ${userId}</p>
                  <p><strong>Membership Type:</strong> ${resolvedMembershipType}</p>
                  <p><strong>Error:</strong> ${membershipError.message || JSON.stringify(membershipError)}</p>
                </div>
                <p style="color: #ef4444;"><strong>⚠️ La membresía NO se activó. Revisar inmediatamente.</strong></p>
              </div>
              `
            )

            // Devolver error 500 para que Stripe reintente el webhook
            return NextResponse.json(
              { 
                error: "Failed to create membership", 
                details: membershipError.message || "Unknown error",
                session_id: session.id,
                user_id: userId
              }, 
              { status: 500 }
            )
          } else {
            console.log(`✅ user_memberships upsert OK para usuario ${userId}`)
            console.log("[v0] Membership data inserted:", membershipData)
          }

          console.log("✅ checkout.session.completed branch finished", {
            eventId: event.id,
            intent_id: intentId || "N/A",
            intent_found: !!intentRecord,
          })

          // Actualizar profile con membership_type y status
          await supabaseAdmin
            .from("profiles")
            .update({
              membership_type: resolvedMembershipType,
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

          // Email de bienvenida al usuario
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
                      <p><strong>Plan:</strong> ${resolvedMembershipType}</p>
                      <p><strong>Ciclo:</strong> ${resolvedBillingCycle === "monthly" ? "Mensual" : "Trimestral"}</p>
                      <p><strong>Estado:</strong> ✅ Activa</p>
                    </div>
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
            `Membresía Activada - ${resolvedMembershipType}`,
            `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #10b981;">✅ Membresía Activada</h2>
              <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #10b981;">
                <p><strong>Cliente:</strong> ${userProfile?.full_name || "N/A"}</p>
                <p><strong>Email:</strong> ${userProfile?.email || "N/A"}</p>
                <p><strong>Plan:</strong> ${resolvedMembershipType}</p>
                <p><strong>Ciclo:</strong> ${resolvedBillingCycle}</p>
                <p><strong>Estado:</strong> ✅ Activa</p>
                <p><strong>Subscription ID:</strong> ${session.subscription}</p>
                <p><strong>Intent ID:</strong> ${intentId || "N/A"}</p>
                <p><strong>Fecha:</strong> ${new Date().toLocaleString("es-ES")}</p>
              </div>
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
          console.error("❌ No user_id en metadata de la suscripción", { 
            subscriptionId: subscription.id,
            eventType: event.type,
            metadata: subscription.metadata 
          })
          break
        }

        // ACTIVACIÓN DE MEMBRESÍA - ÚNICA FUENTE DE VERDAD
        if (subscription.status === "active" || subscription.status === "trialing") {
          console.log(`[v0] Activando membresía para usuario ${subUserId}`)

          // Actualizar user_memberships con fechas de Stripe
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

          // Actualizar profiles
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
          // Buscar user_id desde la DB
          const { data: membership } = await supabaseAdmin
            .from("user_memberships")
            .select("user_id")
            .eq("stripe_subscription_id", canceledSub.id)
            .single()

          if (!membership?.user_id) {
            console.error("❌ No se pudo encontrar user_id para la suscripción cancelada", {
              subscriptionId: canceledSub.id,
              customerId: canceledSub.customer,
              metadata: canceledSub.metadata
            })
            break
          }

          userId = membership.user_id
        }

        // Marcar como cancelled
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

      case "invoice.payment_succeeded":
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice
        console.log("💰 Pago de factura exitoso:", invoice.id)

        const invoiceUserId = invoice.metadata?.user_id || invoice.subscription_details?.metadata?.user_id

        if (!invoiceUserId && !invoice.subscription) {
          console.error("❌ No se pudo obtener user_id ni subscription_id del invoice")
          break
        }

        // Extender la membresía en renovaciones automáticas
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
          
          console.log(`[v0] Renovación automática detectada para subscription ${subscription.id}`)

          let userId = invoiceUserId
          if (!userId) {
            const { data: membership } = await supabaseAdmin
              .from("user_memberships")
              .select("user_id, membership_type, billing_cycle")
              .eq("stripe_subscription_id", subscription.id)
              .single()

            if (membership?.user_id) {
              userId = membership.user_id
              console.log(`[v0] user_id resuelto desde user_memberships: ${userId}`)
            } else {
              console.error("❌ No se pudo resolver user_id para la renovación")
              break
            }
          }

          // ACTUALIZAR fechas de la membresía
          const { error: membershipError } = await supabaseAdmin
            .from("user_memberships")
            .update({
              status: "active",
              membership_start_date: new Date(subscription.current_period_start * 1000).toISOString(),
              membership_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscription.id)

          if (membershipError) {
            console.error("❌ Error extendiendo membresía en renovación:", membershipError)
          } else {
            console.log(`✅ Membresía extendida hasta: ${new Date(subscription.current_period_end * 1000).toISOString()}`)
          }

          // Registrar invoice en DB
          const { data: subData } = await supabaseAdmin
            .from("subscriptions")
            .select("id")
            .eq("stripe_subscription_id", invoice.subscription)
            .single()

          if (subData) {
            await supabaseAdmin
              .from("invoices")
              .upsert({
                subscription_id: subData.id,
                stripe_invoice_id: invoice.id,
                amount: invoice.amount_paid / 100,
                status: "paid",
                invoice_pdf: invoice.invoice_pdf,
                paid_at: new Date(invoice.status_transitions.paid_at! * 1000).toISOString(),
                created_at: new Date(invoice.created * 1000).toISOString(),
              })

            console.log(`✅ Invoice registrada en DB: ${invoice.id}`)
          }
        }
        break
      }

      case "invoice.payment_failed": {
        const failedInvoice = event.data.object as Stripe.Invoice
        console.log("❌ Pago de factura fallido:", failedInvoice.id)

        const failUserId = failedInvoice.metadata?.user_id || failedInvoice.subscription_details?.metadata?.user_id

        if (failUserId) {
          const { data: userProfile } = await supabaseAdmin
            .from("profiles")
            .select("full_name, email")
            .eq("id", failUserId)
            .single()

          if (userProfile?.email) {
            await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/send-email`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                to: userProfile.email,
                subject: "⚠️ Problema con tu pago - Semzo Privé",
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #ef4444;">⚠️ Problema con tu Pago</h2>
                    <p>Hola ${userProfile.full_name || ""},</p>
                    <p>No pudimos procesar tu último pago. Por favor, actualiza tu método de pago para evitar la suspensión de tu membresía.</p>
                    <div style="margin: 30px 0;">
                      <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/billing" 
                         style="background: #1a1a4b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        Actualizar Método de Pago
                      </a>
                    </div>
                    <p>Si ya lo has actualizado, ignora este mensaje.</p>
                    <p style="color: #666; font-size: 12px;">
                      Necesitas ayuda? Contáctanos en ${ADMIN_EMAIL}
                    </p>
                  </div>
                `,
              }),
            })
          }

          await notifyAdmin(
            "❌ Pago Fallido - Acción Requerida",
            `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #ef4444;">❌ Pago Fallido</h2>
              <div style="background: #fee; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #ef4444;">
                <p><strong>Cliente:</strong> ${userProfile?.full_name || "N/A"}</p>
                <p><strong>Email:</strong> ${userProfile?.email || "N/A"}</p>
                <p><strong>Invoice ID:</strong> ${failedInvoice.id}</p>
                <p><strong>Monto:</strong> ${(failedInvoice.amount_due / 100).toFixed(2)}€</p>
              </div>
              <p>Revisar y contactar al cliente para actualizar método de pago.</p>
            </div>
            `,
          )
        }
        break
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log("✅ PaymentIntent succeeded:", paymentIntent.id)

        // Verificar fraude
        const { allow, reason } = await runFraudGate({
          userId: paymentIntent.metadata?.user_id,
          email: paymentIntent.receipt_email || undefined,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          paymentMethodId: (paymentIntent.payment_method as string) || undefined,
        })

        if (!allow) {
          console.error(`❌ FRAUDE DETECTADO: ${reason}`)

          await logAudit({
            action_type: "fraud_detected",
            entity_type: "payment_intent",
            entity_id: paymentIntent.id,
            actor_type: "fraud_gate",
            user_id: paymentIntent.metadata?.user_id || null,
            metadata: {
              reason,
              amount: paymentIntent.amount,
              currency: paymentIntent.currency,
            },
          })

          await notifyAdmin(
            "🚨 FRAUDE DETECTADO",
            `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #ef4444;">🚨 FRAUDE DETECTADO</h2>
              <div style="background: #fee; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #ef4444;">
                <p><strong>PaymentIntent ID:</strong> ${paymentIntent.id}</p>
                <p><strong>Razón:</strong> ${reason}</p>
                <p><strong>Monto:</strong> ${(paymentIntent.amount / 100).toFixed(2)} ${paymentIntent.currency.toUpperCase()}</p>
                <p><strong>Email:</strong> ${paymentIntent.receipt_email || "N/A"}</p>
              </div>
              <p style="color: #ef4444;"><strong>⚠️ Revisar inmediatamente y tomar acción.</strong></p>
            </div>
            `,
          )

          break
        }

        // Auditoría normal
        await logAudit({
          action_type: "payment_succeeded",
          entity_type: "payment_intent",
          entity_id: paymentIntent.id,
          actor_type: "webhook",
          user_id: paymentIntent.metadata?.user_id || null,
          metadata: {
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
          },
        })
        break
      }

      default:
        console.log(`⏭️ Evento no manejado: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("❌ Error procesando webhook:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

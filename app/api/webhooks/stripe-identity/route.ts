import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"
import { logAudit } from "@/lib/fraud-gate"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

export async function POST(request: Request) {
  try {
    console.log("[v0] Identity webhook received at:", new Date().toISOString())

    const body = await request.text()
    const signature = request.headers.get("stripe-signature")

    if (!signature) {
      console.error("[v0] Missing Stripe signature header")
      return NextResponse.json({ error: "missing_signature" }, { status: 400 })
    }

    const webhookSecret = process.env.STRIPE_IDENTITY_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error("[v0] No webhook secret configured")
      return NextResponse.json({ error: "no_webhook_secret" }, { status: 500 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log("[v0] Webhook signature verified successfully, event type:", event.type)
    } catch (err: any) {
      console.error("[v0] Webhook signature verification failed:", err.message)
      return NextResponse.json({ error: "invalid_signature" }, { status: 400 })
    }

    const session = event.data.object as Stripe.Identity.VerificationSession

    if (!event.type.startsWith("identity.verification_session.")) {
      console.log("[v0] Ignoring non-identity event on identity webhook:", event.type)
      return NextResponse.json({ received: true }, { status: 200 })
    }

    await processWebhookAsync(event, session)

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error: any) {
    console.error("[v0] Critical error in webhook handler:", error)
    return NextResponse.json({ error: "critical_error" }, { status: 500 })
  }
}

async function processWebhookAsync(event: Stripe.Event, session: Stripe.Identity.VerificationSession) {
  try {
    switch (event.type) {
      case "identity.verification_session.verified": {
        console.log("[v0] 🎯 Processing VERIFIED session:", {
          sessionId: session.id,
          intentId: session.metadata?.intent_id,
          userId: session.metadata?.user_id,
        })

        const intentId = session.metadata?.intent_id
        const userId = session.metadata?.user_id

        if (!intentId && !userId) {
          console.error("[v0] ❌ No intent_id or user_id in metadata")
          break
        }

        // AUDIT LOG: verification_session.created (implied from verified event)
        await supabase.from("audit_logs").insert({
          action_type: "verification_session_verified",
          entity_type: "stripe_identity_session",
          entity_id: session.id,
          actor_type: "webhook",
          user_id: userId,
          metadata: {
            intent_id: intentId,
            status: session.status,
            verification_type: session.type,
          },
          created_at: new Date().toISOString(),
        })

        // Find intent by intent_id first (preferred), fallback to user_id
        let intent: any = null
        
        if (intentId) {
          const { data } = await supabase
            .from("membership_intents")
            .select("id, user_id, status")
            .eq("id", intentId)
            .maybeSingle()
          intent = data
        }
        
        if (!intent && userId) {
          const { data } = await supabase
            .from("membership_intents")
            .select("id, user_id, status")
            .eq("user_id", userId)
            .eq("status", "paid_pending_verification")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()
          intent = data
        }

        if (!intent) {
          console.error("[v0] ❌ No membership intent found")
          break
        }

        console.log("[v0] 📋 Found intent:", intent.id, "status:", intent.status)

        // REGLA DE NEGOCIO: Identity NO toca billing/membresía
        // Solo actualiza el flag identity_verified y guarda session_id para tracking
        
        // 1. Guardar verification_session_id en intent (solo tracking, NO cambiar status)
        const { error: updateError } = await supabase
          .from("membership_intents")
          .update({
            stripe_verification_session_id: session.id,
            verified_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", intent.id)

        if (updateError) {
          console.error("[v0] ❌ Error updating intent tracking:", updateError)
        } else {
          console.log("[v0] ✅ Identity verification session tracked in intent")
        }

        // 2. Actualizar profile - ÚNICA acción de Identity
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            identity_verified: true,
            stripe_verification_session_id: session.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", intent.user_id)

        if (profileError) {
          console.error("[v0] ❌ Error updating profile identity flags:", profileError)
        }

        // 3. Actualizar identity_verifications a verified
        await supabase
          .from("identity_verifications")
          .update({
            status: "verified",
            verified_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_error: null,
          })
          .eq("stripe_verification_id", session.id)

        console.log("[v0] ✅ Identity flag set - billing/membership untouched")

        // FASE 6: Email de acceso desbloqueado
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", intent.user_id)
          .single()

        if (userProfile?.email) {
          await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/send-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: userProfile.email,
              subject: "Identidad Verificada - Acceso Completo Desbloqueado",
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #10b981;">Tu identidad ha sido verificada</h2>
                  <p>Hola ${userProfile.full_name || ""},</p>
                  <p>Tu verificación de identidad ha sido completada exitosamente. Ahora tienes acceso completo a todo el catálogo exclusivo de Semzo Privé.</p>
                  <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #10b981;">
                    <p style="margin: 0; color: #065f46;"><strong>Ya puedes reservar tus bolsos favoritos</strong></p>
                  </div>
                  <div style="margin: 30px 0;">
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/catalog" 
                       style="background: #1a1a4b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                      Explorar Catálogo
                    </a>
                  </div>
                  <p style="color: #666; font-size: 12px;">
                    Si tienes alguna pregunta, contáctanos en mailbox@semzoprive.com
                  </p>
                </div>
              `,
            }),
          })
        }

        // Log audit
        await logAudit({
          actionType: "identity_verified",
          entityType: "membership_intent",
          entityId: intent.id,
          actorType: "webhook",
          metadata: {
            verificationSessionId: session.id,
            userId: intent.user_id,
            intentStatus: intent.status,
          },
        })
        break
      }

      case "identity.verification_session.requires_input": {
        console.log("[v0] Verification REQUIRES INPUT:", session.id)

        await supabase
          .from("identity_verifications")
          .update({
            status: "rejected",
            last_error: session.last_error?.code || "verification_failed",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_verification_id", session.id)

        if (session.metadata?.user_id) {
          await supabase.from("admin_notifications").insert({
            type: "identity_failed",
            title: "Verificación de identidad rechazada",
            message: `Usuario ${session.metadata.user_id} falló verificación: ${session.last_error?.reason || "Documento no válido"}`,
            severity: "warning",
            user_id: session.metadata.user_id,
          })
        }
        break
      }

      case "identity.verification_session.canceled": {
        console.log("[v0] Verification CANCELED:", session.id)

        await supabase
          .from("identity_verifications")
          .update({
            status: "rejected",
            last_error: "user_canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_verification_id", session.id)
        break
      }

      case "identity.verification_session.processing": {
        console.log("[v0] Verification PROCESSING:", session.id)

        await supabase
          .from("identity_verifications")
          .update({
            status: "pending",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_verification_id", session.id)
        break
      }
    }

    console.log("[v0] Webhook processed successfully")
  } catch (error: any) {
    console.error("[v0] ERROR processing webhook:", {
      error: error.message,
      stack: error.stack,
      sessionId: session.id,
      userId: session.metadata?.user_id,
    })

    if (session.metadata?.user_id) {
      await supabase
        .from("identity_verifications")
        .update({
          last_error: `technical_error: ${error.message}`,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_verification_id", session.id)
        .eq("user_id", session.metadata.user_id)

      await supabase.from("admin_notifications").insert({
        type: "system_error",
        title: "Error técnico en verificación de identidad",
        message: `Error procesando verificación para usuario ${session.metadata.user_id}: ${error.message}`,
        severity: "error",
        user_id: session.metadata.user_id,
      })
    }
  }
}

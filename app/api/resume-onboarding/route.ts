import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@/app/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { syncMembershipFromStripe } from "@/app/api/membership/activate/orchestrator"

export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

type ResumeAction =
  | "active"
  | "launch_identity"
  | "resume_checkout"
  | "processing_payment"
  | "payment_incomplete"
  | "pending_sepa"

function isPaidStatus(status?: string | null) {
  return status === "succeeded" || status === "paid"
}

// Cliente admin para modo interno (webhooks sin cookies de sesión)
function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

export async function POST(request: NextRequest) {
  try {
    // Soporta dos modos:
    //   1. Normal: cookie de sesion del usuario (flujos UI)
    //   2. Interno: header x-internal-secret + body.userId (webhooks)
    const internalSecret = request.headers.get("x-internal-secret")
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    let body: any = {}
    try {
      body = await request.json()
    } catch {
      // sin body: modo normal
    }

    let userId: string | null = null
    let supabase: any

    if (internalSecret && webhookSecret && internalSecret === webhookSecret && body?.userId) {
      // Modo interno (webhook): autenticacion por secreto, userId viene en body
      userId = body.userId
      supabase = getAdminClient()
      console.log("[resume-onboarding] internal mode, userId:", userId)
    } else {
      // Modo normal: cookie de sesion
      supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 })
      }
      userId = user.id
    }

    // Wrapper para mantener la API interna usando `user.id`
    const user = { id: userId! }

    // ============================================================
    // GUARD: membresía cancelada con periodo aún vigente.
    //
    // Si el usuario canceló su membresía pero `end_date` sigue en el futuro,
    // mantiene acceso hasta esa fecha. NO debe ser tratado como onboarding
    // incompleto ni redirigido a /cart o checkout. Sin este guard, un intent
    // antiguo sin pago confirmado provoca un bucle resume_checkout → /cart.
    // ============================================================
    const { data: existingMembership } = await supabase
      .from("user_memberships")
      .select("status, end_date, membership_type")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (
      existingMembership &&
      ["cancelled", "cancelling", "canceled"].includes(existingMembership.status)
    ) {
      const endDate = existingMembership.end_date ? new Date(existingMembership.end_date) : null
      const stillValid = endDate ? endDate.getTime() > Date.now() : false

      console.log("[resume-onboarding] cancelled membership detected", {
        status: existingMembership.status,
        end_date: existingMembership.end_date,
        stillValid,
      })

      return NextResponse.json({
        action: "active" as ResumeAction,
        membership_status: stillValid ? "cancelled_active" : "cancelled_expired",
        end_date: existingMembership.end_date,
        membership_type: existingMembership.membership_type,
      })
    }

    // GUARD: membresía real con incidencia de pago (past_due) o acceso limitado.
    //
    // Estos estados representan una suscripción EXISTENTE, no un onboarding
    // incompleto. NO deben enrutar a /cart ni a checkout: sin este guard, un
    // intent antiguo sin pago confirmado provoca el bucle resume_checkout → /cart
    // (carrito vacío) → dashboard → resume_checkout... El dashboard ya muestra el
    // aviso de dunning/pago para estos estados.
    if (
      existingMembership &&
      ["past_due", "limited_access", "paused", "cancelled_active"].includes(existingMembership.status)
    ) {
      console.log("[resume-onboarding] existing membership with payment/access state, allow dashboard", {
        status: existingMembership.status,
        membership_type: existingMembership.membership_type,
      })
      return NextResponse.json({
        action: "active" as ResumeAction,
        membership_status: existingMembership.status,
        membership_type: existingMembership.membership_type,
      })
    }

    // GUARD: si la membresía ya está active, no hay nada que reanudar.
    // Sin este guard, intents antiguos huérfanos (ej. essentiel sin pago dejado
    // por un click antiguo) provocan un bucle resume_checkout aunque el usuario
    // tenga una suscripción real activa (ej. petite).
    if (existingMembership && existingMembership.status === "active") {
      console.log("[resume-onboarding] membership already active, skip flow", {
        membership_type: existingMembership.membership_type,
      })
      return NextResponse.json({
        action: "active" as ResumeAction,
        membership_status: "active",
        membership_type: existingMembership.membership_type,
      })
    }

    // Leer estado de identidad de identity_verifications (FUENTE DE VERDAD)
    const { data: latestIdentity } = await supabase
      .from("identity_verifications")
      .select("status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    const isIdentityVerified = latestIdentity?.status === "verified" || latestIdentity?.status === "approved"

    // ============================================================
    // GIFT CARD FLOW: detectar membresias prepagadas via Gift Card.
    // Caracteristicas:
    //   - user_memberships existe en estado post-pago
    //   - stripe_subscription_id = NULL (Gift Card no crea subscription)
    //
    // IMPORTANTE: el flujo COMPLETO es el mismo que Stripe:
    //   Identity → SEPA (mandato de respaldo) → Reserva bolso → Dashboard
    // Este bloque sustituye la parte de "validar pago Stripe" que no aplica.
    // ============================================================
    const { data: giftCardMembership } = await supabase
      .from("user_memberships")
      .select("id, status, stripe_subscription_id, membership_type")
      .eq("user_id", user.id)
      .in("status", ["pending_verification", "pending_sepa", "paid_pending_verification", "active"])
      .is("stripe_subscription_id", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (giftCardMembership) {
      console.log("[resume-onboarding] gift card flow detected", {
        membershipId: giftCardMembership.id,
        status: giftCardMembership.status,
        isIdentityVerified,
      })

      // Ya activa → dashboard
      if (giftCardMembership.status === "active") {
        return NextResponse.json({
          action: "active" as ResumeAction,
          membership_status: "active",
        })
      }

      // Identity NO verificada → crear/reusar sesion Identity
      if (!isIdentityVerified) {
        const { data: latestVerification } = await supabase
          .from("identity_verifications")
          .select("stripe_verification_id, status")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()

        let verificationUrl: string | null = null
        let verificationId: string | null = null

        if (latestVerification?.stripe_verification_id) {
          try {
            const existing = await stripe.identity.verificationSessions.retrieve(
              latestVerification.stripe_verification_id,
            )
            if (existing.status !== "verified" && existing.status !== "canceled" && existing.url) {
              verificationUrl = existing.url
              verificationId = existing.id
            }
          } catch {
            // ignorar; se crea una nueva abajo
          }
        }

        if (!verificationUrl) {
          // NEVER use VERCEL_URL: points to *.vercel.app which blocks real users
          // with a Vercel login screen. Always fall back to the canonical domain.
          const appUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://semzoprive.com"

          const created = await stripe.identity.verificationSessions.create({
            type: "document",
            options: {
              document: {
                require_live_capture: true,
                require_matching_selfie: true,
              },
            },
            return_url: `${appUrl}/verify-identity/result?session_id={VERIFICATION_SESSION_ID}`,
            metadata: {
              user_id: user.id,
              membership_type: giftCardMembership.membership_type || "essentiel",
              source: "gift_card",
            },
          })

          verificationUrl = created.url || null
          verificationId = created.id

          await supabase.from("identity_verifications").upsert(
            {
              user_id: user.id,
              stripe_verification_id: created.id,
              status: created.status,
              membership_type: giftCardMembership.membership_type,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "stripe_verification_id" },
          )
        }

        return NextResponse.json({
          action: "launch_identity" as ResumeAction,
          verification_url: verificationUrl,
          verification_session_id: verificationId,
        })
      }

      // Identity OK → validar SEPA. Aunque Gift Card es prepago, el mandato SEPA
      // de respaldo SI se exige (ver cart: "Mandato SEPA uso limitado" y activate-membership).
      const { data: profileSepaGc } = await supabase
        .from("profiles")
        .select("sepa_payment_method_id")
        .eq("id", user.id)
        .maybeSingle()

      if (!profileSepaGc?.sepa_payment_method_id) {
        // Promover user_memberships a pending_sepa para que el dashboard enrute a /onboarding-complete
        // (sin esto, pending_verification haria que el dashboard reenvie a /verify-identity y provoque loop).
        if (giftCardMembership.status !== "pending_sepa") {
          await supabase
            .from("user_memberships")
            .update({ status: "pending_sepa", updated_at: new Date().toISOString() })
            .eq("id", giftCardMembership.id)
        }

        return NextResponse.json({
          action: "pending_sepa" as ResumeAction,
          reason: "sepa_mandate_missing",
          source: "gift_card",
        })
      }

      // Identity + SEPA OK → activar (la reserva del bolso la gestiona onboarding-complete tras activate)
      // can_make_reservations: true es OBLIGATORIO porque la columna tiene
      // DEFAULT false y sin esto el gate de reservas bloquea al usuario.
      const giftActivatedNow = new Date().toISOString()
      await supabase
        .from("user_memberships")
        .update({
          status: "active",
          can_make_reservations: true,
          updated_at: giftActivatedNow,
        })
        .eq("id", giftCardMembership.id)

      await supabase
        .from("profiles")
        .update({
          membership_status: "active",
          membership_type: giftCardMembership.membership_type,
          updated_at: giftActivatedNow,
        })
        .eq("id", user.id)

      // Cerrar activated_at en el intent para trazabilidad completa de admin
      const { data: giftIntent } = await supabase
        .from("membership_intents")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (giftIntent?.id) {
        await supabase
          .from("membership_intents")
          .update({ activated_at: giftActivatedNow, updated_at: giftActivatedNow })
          .eq("id", giftIntent.id)
      }

      return NextResponse.json({
        action: "active" as ResumeAction,
        membership_status: "active",
        source: "gift_card",
      })
    }
    // ============================================================
    // Fin Gift Card flow. A partir de aqui, flujo estandar Stripe.
    // ============================================================

    const { data: intent } = await supabase
      .from("membership_intents")
      .select(
        "id, user_id, membership_type, billing_cycle, status, stripe_payment_intent_id, stripe_checkout_session_id, stripe_subscription_id, stripe_verification_session_id",
      )
      .eq("user_id", user.id)
      .not("status", "eq", "expired")
      .not("status", "eq", "canceled")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!intent) {
      return NextResponse.json(
        {
          action: "payment_incomplete" as ResumeAction,
          reason: "no_intent",
          checkout_url: "/cart",
        },
        { status: 200 },
      )
    }

    let paymentOk = false
    let paymentProcessing = false
    let checkoutUrl: string | null = null
    let stripeSubscriptionId = intent.stripe_subscription_id as string | null

    // 1) Resolve payment truth from Stripe
    if (intent.stripe_payment_intent_id) {
      try {
        const pi = await stripe.paymentIntents.retrieve(intent.stripe_payment_intent_id)
        paymentOk = isPaidStatus(pi.status)
        paymentProcessing = pi.status === "processing"
      } catch {
        // ignore, keep evaluating with checkout/subscription
      }
    }

    if (!paymentOk && intent.stripe_checkout_session_id) {
      try {
        const session = await stripe.checkout.sessions.retrieve(intent.stripe_checkout_session_id)
        paymentOk = session.payment_status === "paid"
        paymentProcessing = session.status === "open" && session.payment_status === "unpaid"
        checkoutUrl = session.url || null

        if (!stripeSubscriptionId && typeof session.subscription === "string") {
          stripeSubscriptionId = session.subscription
        }
      } catch {
        // ignore, continue to fallback
      }
    }

    if (!paymentOk && stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
        paymentOk = subscription.status === "active" || subscription.status === "trialing"
      } catch {
        // ignore
      }
    }

    // 2) If payment incomplete, send user back to checkout
    if (!paymentOk) {
      if (paymentProcessing) {
        return NextResponse.json({
          action: "processing_payment" as ResumeAction,
          reason: "payment_processing",
        })
      }

      return NextResponse.json({
        action: "resume_checkout" as ResumeAction,
        reason: "payment_incomplete",
        checkout_url: checkoutUrl || "/cart",
      })
    }

    // 3) Payment is OK. Identity pending? relaunch/reuse verification.
    if (!isIdentityVerified) {
      const { data: latestVerification } = await supabase
        .from("identity_verifications")
        .select("stripe_verification_id, status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      let verificationUrl: string | null = null
      let verificationId: string | null = null

      if (latestVerification?.stripe_verification_id) {
        try {
          const existing = await stripe.identity.verificationSessions.retrieve(
            latestVerification.stripe_verification_id,
          )

          if (existing.status === "verified") {
            // Actualizar identity_verifications (FUENTE DE VERDAD)
            await supabase
              .from("identity_verifications")
              .update({ status: "verified", updated_at: new Date().toISOString() })
              .eq("stripe_verification_id", latestVerification.stripe_verification_id)
          } else if (existing.status !== "canceled" && existing.url) {
            verificationUrl = existing.url
            verificationId = existing.id
          }
        } catch {
          // create new session below
        }
      }

      // Re-verificar identidad con la fuente de verdad
      const { data: freshIdentity } = await supabase
        .from("identity_verifications")
        .select("status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      const isFreshIdentityVerified = freshIdentity?.status === "verified" || freshIdentity?.status === "approved"

      if (!isFreshIdentityVerified) {
        if (!verificationUrl) {
          // NEVER use VERCEL_URL: points to *.vercel.app which blocks real users
          // with a Vercel login screen. Always fall back to the canonical domain.
          const appUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://semzoprive.com"

          const created = await stripe.identity.verificationSessions.create({
            type: "document",
            options: {
              document: {
                require_live_capture: true,
                require_matching_selfie: true,
              },
            },
            return_url: `${appUrl}/verify-identity/result?session_id={VERIFICATION_SESSION_ID}`,
            metadata: {
              user_id: user.id,
              intent_id: intent.id,
              membership_type: intent.membership_type || "essentiel",
            },
          })

          verificationUrl = created.url || null
          verificationId = created.id

          await supabase.from("identity_verifications").upsert(
            {
              user_id: user.id,
              stripe_verification_id: created.id,
              status: created.status,
              membership_type: intent.membership_type,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "stripe_verification_id" },
          )
        }

        if (verificationId) {
          await supabase
            .from("membership_intents")
            .update({
              stripe_verification_session_id: verificationId,
              status: "paid_pending_verification",
              updated_at: new Date().toISOString(),
            })
            .eq("id", intent.id)
        }

        return NextResponse.json({
          action: "launch_identity" as ResumeAction,
          verification_url: verificationUrl,
          verification_session_id: verificationId,
        })
      }
    }

    // 3.5) Identity OK pero SEPA pendiente => enrutar a onboarding-complete.
    // El orquestador interno (syncMembershipFromStripe) solo activa si hay SEPA,
    // asi que aqui detectamos el caso y devolvemos la accion correcta para el cliente.
    const { data: profileSepa } = await supabase
      .from("profiles")
      .select("sepa_payment_method_id")
      .eq("id", user.id)
      .maybeSingle()

    if (!profileSepa?.sepa_payment_method_id) {
      await supabase
        .from("membership_intents")
        .update({ status: "pending_sepa", updated_at: new Date().toISOString() })
        .eq("id", intent.id)

      return NextResponse.json({
        action: "pending_sepa" as ResumeAction,
        reason: "sepa_mandate_missing",
      })
    }

    // 4) Payment + identity + SEPA OK => activate membership idempotently
    if (stripeSubscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
      const synced = await syncMembershipFromStripe(subscription)
      if (!synced.success) {
        return NextResponse.json(
          {
            action: "processing_payment" as ResumeAction,
            error: synced.error || "sync_failed",
          },
          { status: 500 },
        )
      }
    }

    // Cerrar el intent con activated_at para trazabilidad completa.
    // Sin este campo, el intent queda en status="active" pero sin timestamp
    // de activacion real, lo que rompe la auditoria de admin.
    const activatedNow = new Date().toISOString()
    await supabase
      .from("membership_intents")
      .update({
        status: "active",
        activated_at: activatedNow,
        updated_at: activatedNow,
      })
      .eq("id", intent.id)

    // user_memberships ya se actualiza via syncMembershipFromStripe
    // NO escribir a profiles.membership_status

    return NextResponse.json({
      action: "active" as ResumeAction,
      membership_status: "active",
    })
  } catch (error: any) {
    console.error("[resume-onboarding] error:", error)
    return NextResponse.json(
      {
        error: error?.message || "resume_onboarding_failed",
      },
      { status: 500 },
    )
  }
}

import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@/app/lib/supabase/server"

// CRITICAL: No cache - authenticated mutation endpoint
export const dynamic = "force-dynamic"

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
if (!stripeSecretKey) {
  console.error("❌ STRIPE_SECRET_KEY no está configurada")
}

const stripe = new Stripe(stripeSecretKey || "", {
  apiVersion: "2024-06-20",
})

/**
 * FASE 2 - CHECKOUT DE SUSCRIPCIÓN
 *
 * Responsabilidades:
 * 1. Crear/recuperar stripe_customer_id
 * 2. Crear Checkout Session en modo subscription
 * 3. NO activar membresía (lo hace el webhook)
 * 4. NO usar PaymentIntent
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log("🔄 [SUBSCRIPTION CHECKOUT] Iniciando...", new Date().toISOString())

  try {
    if (!stripeSecretKey) {
      console.error("❌ STRIPE_SECRET_KEY no configurada")
      return NextResponse.json(
        {
          error: "Configuración de Stripe incompleta",
          details: "STRIPE_SECRET_KEY no está configurada",
        },
        { status: 500 },
      )
    }

    const { priceId, membershipType, billingCycle, intentId } = await request.json()

    const supabase = await createClient()

    // VALIDATION: Get authenticated session (works for SMS + email users)
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json(
        {
          error: "Authentication required",
          details: "User must be logged in to create subscription",
        },
        { status: 401 },
      )
    }

    const userId = session.user.id

    // VALIDATION: Required fields
    if (!priceId || !membershipType || !intentId) {
      console.error("[SUBSCRIPTION CHECKOUT] Missing required fields", { priceId, membershipType, intentId })
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: "priceId, membershipType and intentId are required",
        },
        { status: 400 },
      )
    }

    // STEP 1: Get email from profiles (NOT from Supabase Auth)
    // SMS users have null email in auth but may have real email in profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, full_name, email, auth_method")
      .eq("id", userId)
      .single()

    let customerEmail: string | undefined = undefined

    if (profile?.email) {
      customerEmail = profile.email
    }

    console.log("[SUBSCRIPTION CHECKOUT] Creating for:", {
      userId,
      hasEmail: !!customerEmail,
      membershipType,
      billingCycle,
      priceId,
      intentId,
    })

    // STEP 2: Get or create Stripe customer
    let stripeCustomerId = profile?.stripe_customer_id

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: customerEmail,
        name: profile?.full_name || undefined,
        metadata: {
          supabase_user_id: userId,
        },
      })
      stripeCustomerId = customer.id

      await supabase.from("profiles").update({ stripe_customer_id: stripeCustomerId }).eq("id", userId)

      console.log("[SUBSCRIPTION CHECKOUT] Created Stripe customer:", stripeCustomerId)
    } else {
      console.log("[SUBSCRIPTION CHECKOUT] Using existing Stripe customer:", stripeCustomerId)
    }

    // STEP 3: Create Checkout Session in subscription mode
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

    // Stripe no permite customer + customer_email juntos
    // Si ya tenemos customer_id, usamos customer (Stripe usa el email del customer)
    // Si el customer no tiene email (SMS user), Stripe lo pedira en el checkout
    const requiresIdentityFlow = profile?.auth_method === "sms"
    const successUrl = requiresIdentityFlow
      ? `${baseUrl}/dashboard/membresia/status?session_id={CHECKOUT_SESSION_ID}`
      : `${baseUrl}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`

    const commonMetadata = {
      intent_id: intentId,
      user_id: userId,
      membership_type: membershipType,
      billing_cycle: billingCycle || "monthly",
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      customer: stripeCustomerId,
      payment_method_types: customerEmail ? ["card", "sepa_debit"] : ["card"],
      payment_method_collection: "always",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: commonMetadata,
      subscription_data: {
        metadata: {
          ...commonMetadata,
          sepa_backup: customerEmail ? "true" : "false",
          service: "luxury_rental",
        },
      },
      success_url: successUrl,
      cancel_url: `${baseUrl}/cart?canceled=true`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      customer_update: {
        address: "auto",
        name: "auto",
      },
    }

    const checkoutSession = await stripe.checkout.sessions.create(sessionParams)

    console.log("[SUBSCRIPTION CHECKOUT] ✅ Checkout session created:", {
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
      duration: `${Date.now() - startTime}ms`,
    })

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    })
  } catch (error: any) {
    console.error("[SUBSCRIPTION CHECKOUT] ❌ Error:", {
      message: error?.message,
      type: error?.type,
      code: error?.code,
      stack: error?.stack,
    })

    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        details: error?.message || "Unknown error",
      },
      { status: 500 },
    )
  }
}

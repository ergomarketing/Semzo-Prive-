import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// CRITICAL: No cache - authenticated mutation endpoint
export const dynamic = "force-dynamic"

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
if (!stripeSecretKey) {
  console.error("❌ STRIPE_SECRET_KEY no está configurada")
}

const stripe = new Stripe(stripeSecretKey || "", {
  apiVersion: "2024-12-18.acacia",
})

/**
 * ============================================================================
 * FLUJO VALIDADO — NO MODIFICAR SIN CONSULTAR
 * ============================================================================
 * PASO 6 del flujo de suscripcion: CHECKOUT DE STRIPE (SUBSCRIPCION)
 *
 * Responsabilidades:
 * 1. Crear/recuperar stripe_customer_id
 * 2. Crear Checkout Session en modo subscription (o payment para bag-pass)
 * 3. NO activar membresia (lo hace el webhook de Stripe → user_memberships)
 * 4. NO usar PaymentIntent manual
 *
 * baseUrl CRITICO (no tocar):
 * - NEXT_PUBLIC_SITE_URL si esta definida
 * - production → semzoprive.com (NUNCA VERCEL_URL: pide login de Vercel)
 * - preview → VERCEL_URL (solo devs)
 * - local → http://localhost:3000
 *
 * success_url = {baseUrl}/post-checkout?session_id={CHECKOUT_SESSION_ID}
 * ============================================================================
 */
export async function POST(request: NextRequest) {
  try {
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: "Configuración de Stripe incompleta" },
        { status: 500 },
      )
    }

    const body = await request.json()
    const {
      priceId,
      membershipType,
      billingCycle,
      intentId: clientIntentId,
      amountCents,
      productName,
      gift_card_id,
      coupon,
    } = body

    // VALIDATION: Required fields — priceId OR amountCents son suficientes
    if (!priceId && !amountCents) {
      return NextResponse.json(
        { error: "Missing required fields", details: "priceId o amountCents son requeridos" },
        { status: 400 },
      )
    }

    // Autenticar usuario con cookies SSR
    // ANON_KEY para que getUser() resuelva el usuario desde la cookie de sesión
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required", details: "User must be logged in" },
        { status: 401 },
      )
    }

    const userId = user.id

    // Obtener perfil para email y stripe_customer_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, full_name, email, auth_method")
      .eq("id", userId)
      .single()

    const customerEmail: string | undefined = profile?.email || undefined

    // Determinar o crear el intent_id
    let intentId = clientIntentId

    if (!intentId) {
      // Buscar intent existente en estado válido — incluye "initiated" (creado en create-intent)
      const { data: existingIntent } = await supabase
        .from("membership_intents")
        .select("id")
        .eq("user_id", userId)
        .in("status", ["initiated", "pending_payment", "pending", "created"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existingIntent?.id) {
        intentId = existingIntent.id
      } else {
        // Fallback: crear intent si no hay ninguno (e.g. flujo directo sin create-intent)
        const now = new Date().toISOString()
        const { data: newIntent, error: intentError } = await supabase
          .from("membership_intents")
          .insert({
            user_id: userId,
            membership_type: membershipType || "essentiel",
            billing_cycle: billingCycle || "monthly",
            amount_cents: amountCents || 0,
            original_amount_cents: amountCents || 0,
            status: "initiated",
            initiated_at: now,
            created_at: now,
            updated_at: now,
          })
          .select("id")
          .single()

        if (intentError || !newIntent) {
          console.error("[SUBSCRIPTION CHECKOUT] Failed to create intent:", intentError)
          intentId = "no_intent"
        } else {
          intentId = newIntent.id
        }
      }
    }

    // Get or create Stripe customer
    let stripeCustomerId = profile?.stripe_customer_id

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: customerEmail,
        name: profile?.full_name || undefined,
        metadata: { supabase_user_id: userId },
      })
      stripeCustomerId = customer.id

      await supabase
        .from("profiles")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", userId)
    }

    // Determinar modo:
    // - subscription: hay membershipType Y priceId (flujo normal recurrente)
    // - payment: hay amountCents sin priceId (pases, gift card parcial, pagos únicos)
    const isSubscription = !!(membershipType && priceId)

    // IMPORTANTE: NUNCA usar VERCEL_URL como destino de Stripe success/cancel_url:
    // devuelve la URL interna *.vercel.app que exige login de Vercel al usuario.
    // Detectar entorno por VERCEL_ENV: production => semzoprive.com, preview => VERCEL_URL (solo para devs).
    const vercelEnv = process.env.VERCEL_ENV
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (vercelEnv === "production"
        ? "https://semzoprive.com"
        : vercelEnv === "preview" && process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "http://localhost:3000")

    const successUrl = `${baseUrl}/post-checkout?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${baseUrl}/cart?canceled=true`

    const commonMetadata: Record<string, string> = {
      intent_id: intentId,
      user_id: userId,
      membership_type: membershipType || "",
      billing_cycle: billingCycle || "monthly",
      ...(gift_card_id ? { gift_card_id } : {}),
    }

    // Si hay coupon aplicado desde el cart, pasarlo a Stripe directamente
    // coupon.code es el coupon.id de Stripe devuelto por validate-coupon
    const couponId: string | null = coupon?.code || null

    const sessionParams: Stripe.Checkout.SessionCreateParams = isSubscription
      ? {
          mode: "subscription",
          customer: stripeCustomerId,
          client_reference_id: userId,
          payment_method_types: ["card"],
          payment_method_collection: "always",
          line_items: [{ price: priceId, quantity: 1 }],
          metadata: { ...commonMetadata, ...(couponId ? { coupon_code: couponId } : {}) },
          subscription_data: {
            metadata: {
              ...commonMetadata,
              service: "luxury_rental",
            },
          },
          success_url: successUrl,
          cancel_url: cancelUrl,
          // Discounts a nivel de sesion para ambos modos
          ...(couponId
            ? { discounts: [{ coupon: couponId }] }
            : { allow_promotion_codes: true }),
          billing_address_collection: "auto",
          customer_update: { address: "auto", name: "auto" },
        }
      : {
          mode: "payment",
          customer: stripeCustomerId,
          client_reference_id: userId,
          payment_method_types: ["card"],
          line_items: priceId
            ? [{ price: priceId, quantity: 1 }]
            : [
                {
                  price_data: {
                    currency: "eur",
                    product_data: {
                      name: productName || "Pase de Bolso",
                      description: "Acceso semanal a un bolso premium",
                    },
                    unit_amount: amountCents,
                  },
                  quantity: 1,
                },
              ],
          metadata: { ...commonMetadata, ...(couponId ? { coupon_code: couponId } : {}) },
          payment_intent_data: { metadata: commonMetadata },
          success_url: successUrl,
          cancel_url: cancelUrl,
          ...(couponId
            ? { discounts: [{ coupon: couponId }] }
            : { allow_promotion_codes: true }),
          billing_address_collection: "auto",
          customer_update: { address: "auto", name: "auto" },
        }

    const checkoutSession = await stripe.checkout.sessions.create(sessionParams)

    // Actualizar el intent con el checkout_session_id y cambiar status a pending_payment
    if (intentId && intentId !== "no_intent") {
      await supabase
        .from("membership_intents")
        .update({
          status: "pending_payment",
          stripe_checkout_session_id: checkoutSession.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", intentId)
    }

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    })
  } catch (error: any) {
    console.error("[SUBSCRIPTION CHECKOUT] ❌ Error:", {
      message: error?.message,
      type: error?.type,
      code: error?.code,
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

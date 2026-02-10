import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@/app/lib/supabase/server"

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
if (!stripeSecretKey) {
  console.error("❌ STRIPE_SECRET_KEY no está configurada")
}

const stripe = new Stripe(stripeSecretKey || "", {
  apiVersion: "2024-06-20",
})

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log("🔄 Iniciando creación de payment intent...", new Date().toISOString())

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

    const { amount, membershipType: membershipTypeDirect, couponCode, giftCardUsed, intentId, items, appliedCoupon, appliedGiftCard } = await request.json()
    
    const supabase = await createClient()

    // VALIDATION 0: Get user from server session (MANDATORY)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error("[BACKEND] ❌ HARD FAIL: No authenticated session", { authError })
      return NextResponse.json({
        error: "Contract violation: user identification missing",
        details: "No authenticated session found. User must be logged in."
      }, { status: 401 })
    }

    const userId = user.id
    const userEmail = user.email

    if (!userEmail) {
      console.error("[BACKEND] ❌ HARD FAIL: User has no email", { userId })
      return NextResponse.json({
        error: "Contract violation: user email missing",
        details: "Authenticated user must have an email address"
      }, { status: 400 })
    }

    // HARD VALIDATION: Contract enforcement
    console.log("[BACKEND] Raw request body:", {
      amount,
      membershipTypeDirect,
      userId,
      userEmail,
      itemsReceived: items?.map((i: any) => ({ type: i.type, id: i.id, membership_type: i.membership_type, billingCycle: i.billingCycle })),
      timestamp: new Date().toISOString()
    })

    // VALIDATION 1: items array must exist
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error("[BACKEND] ❌ HARD FAIL: No items array provided")
      return NextResponse.json({
        error: "Contract violation: items array required",
        details: "Request must include items array with membership item"
      }, { status: 400 })
    }

    // VALIDATION 2: Must have exactly ONE membership item
    // Frontend uses itemType field, not type
    const membershipItems = items.filter((item: any) => item.type === "membership" || item.itemType === "membership")
    
    if (membershipItems.length === 0) {
      console.error("[BACKEND] ❌ HARD FAIL: No membership item in items array", {
        receivedItems: items.map((i: any) => ({ type: i.type, itemType: i.itemType, id: i.id }))
      })
      return NextResponse.json({
        error: "Contract violation: no membership item found",
        details: "items array must contain exactly one item with type='membership' or itemType='membership'"
      }, { status: 400 })
    }

    if (membershipItems.length > 1) {
      console.error("[BACKEND] ❌ HARD FAIL: Multiple membership items", membershipItems)
      return NextResponse.json({
        error: "Contract violation: multiple membership items",
        details: "items array must contain exactly ONE membership item"
      }, { status: 400 })
    }

    const membershipItem = membershipItems[0]

    // VALIDATION 3: Extract membership_type (NO defaults, NO inference)
    const membershipType = membershipTypeDirect || membershipItem.id || membershipItem.membership_type

    if (!membershipType) {
      console.error("[BACKEND] ❌ HARD FAIL: Cannot extract membership_type", { membershipItem })
      return NextResponse.json({
        error: "Contract violation: membership_type missing",
        details: "membership item must have 'id' or 'membership_type' field"
      }, { status: 400 })
    }

    // VALIDATION 4: Extract billingCycle (FAIL if missing, NO silent default)
    const billingCycle = membershipItem.billing_cycle || membershipItem.billingCycle

    if (!billingCycle) {
      console.error("[BACKEND] ❌ HARD FAIL: billingCycle missing", { membershipItem })
      return NextResponse.json({
        error: "Contract violation: billingCycle missing",
        details: "membership item must have 'billingCycle' or 'billing_cycle' field"
      }, { status: 400 })
    }

    // VALIDATION 5: billingCycle must be valid enum value
    const validBillingCycles = ["weekly", "monthly", "quarterly"]
    if (!validBillingCycles.includes(billingCycle)) {
      console.error("[BACKEND] ❌ HARD FAIL: Invalid billingCycle", { billingCycle, validValues: validBillingCycles })
      return NextResponse.json({
        error: "Contract violation: invalid billingCycle",
        details: `billingCycle must be one of: ${validBillingCycles.join(", ")}`
      }, { status: 400 })
    }

    console.log("[BACKEND] ✅ Contract validated:", {
      membershipType,
      billingCycle,
      amount,
      userId,
      userEmail,
      couponCode: couponCode || appliedCoupon?.code || null
    })

    if (amount === 0 || amount === null || amount === undefined) {
      console.error("❌ Amount is 0 - should not call this endpoint for gift card purchases")
      return NextResponse.json(
        {
          error: "Este endpoint solo procesa pagos con Stripe (amount > 0)",
          details: "Para compras con gift card, usar /api/memberships/purchase-with-gift-card",
        },
        { status: 400 },
      )
    }

    if (typeof amount !== "number" || amount <= 0) {
      console.error("❌ Monto inválido:", amount)
      return NextResponse.json(
        {
          error: "Monto inválido",
          details: "El monto debe ser un número positivo",
        },
        { status: 400 },
      )
    }

    // CREAR MEMBERSHIP_INTENT EN SUPABASE PRIMERO (IDEMPOTENT)
    let dbIntentId = intentId
    
    if (!dbIntentId) {
      // Convert amount to cents (DB schema uses amount_cents, not amount)
      const amountCents = Math.round(amount * 100)
      
      const intentPayload = {
        user_id: userId,
        membership_type: membershipType,
        billing_cycle: billingCycle,
        status: "pending",
        amount_cents: amountCents,
        original_amount_cents: amountCents, // Before any discounts (if applicable later)
        coupon_code: couponCode || appliedCoupon?.code || null,
        initiated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      console.log("[BACKEND] 💾 Creating membership_intent in Supabase:", {
        ...intentPayload,
        amount_euros: amount
      })
      
      const { data: newIntent, error: intentError } = await supabase
        .from("membership_intents")
        .insert(intentPayload)
        .select("id")
        .single()
      
      if (intentError || !newIntent) {
        console.error("[BACKEND] ❌ CRITICAL: Failed to create membership_intent", {
          error: intentError,
          code: intentError?.code,
          message: intentError?.message,
          details: intentError?.details,
          hint: intentError?.hint,
          payload: intentPayload
        })
        return NextResponse.json({
          error: "Database error: failed to create membership intent",
          details: intentError?.message || "Unknown database error",
          hint: intentError?.hint
        }, { status: 500 })
      }
      
      dbIntentId = newIntent.id
      console.log("[BACKEND] ✅ membership_intent created successfully:", {
        intent_id: dbIntentId,
        user_id: userId,
        membership_type: membershipType,
        billing_cycle: billingCycle,
        amount_cents: amountCents,
        status: "pending"
      })
    } else {
      console.log("[BACKEND] 💾 Reusing existing intent_id:", dbIntentId)
    }

    // CREAR STRIPE PAYMENT INTENT (linked to membership_intent)
    const stripeMetadata = {
      user_id: userId,
      plan_id: membershipType,
      membershipType,
      userEmail,
      intent_id: dbIntentId || "",
      couponCode: couponCode || appliedCoupon?.code || "",
      giftCardUsed: giftCardUsed ? JSON.stringify(giftCardUsed) : "",
      createdAt: new Date().toISOString(),
    }

    console.log("[BACKEND] 💳 Creating Stripe PaymentIntent with metadata:", {
      amount_cents: Math.round(amount * 100),
      currency: "eur",
      metadata: stripeMetadata
    })

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "eur",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: stripeMetadata,
    })

    const processingTime = Date.now() - startTime
    console.log("[BACKEND] ✅ Stripe PaymentIntent created successfully:", {
      payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      linked_membership_intent: dbIntentId,
      processingTime: `${processingTime}ms`,
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      couponApplied: couponCode || null,
    })
  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error("❌ Error en create-intent:", {
      error,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString(),
    })

    let errorMessage = "Error interno del servidor"
    let errorDetails = ""

    if (error instanceof Stripe.errors.StripeError) {
      errorMessage = `Error de Stripe: ${error.type}`
      errorDetails = `Código: ${error.code} | Mensaje: ${error.message}`
      console.error("❌ Error específico de Stripe:", {
        type: error.type,
        code: error.code,
        message: error.message,
        requestId: error.requestId,
      })
    } else if (error instanceof Error) {
      errorMessage = error.message
      errorDetails = error.stack || ""
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

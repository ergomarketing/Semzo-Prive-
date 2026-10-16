import { NextResponse } from "next/server"
import { createClient } from "@/app/lib/supabase/server"
import Stripe from "stripe"
import { syncMembershipFromStripe } from "../activate/orchestrator"
import { isIdentityVerified } from "@/lib/identity-status"
import { supabaseAdmin } from "@/app/lib/supabase"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
})

/**
 * RECONCILIATION ENDPOINT
 * 
 * Garantiza convergencia del sistema incluso si el webhook falla o se retrasa.
 * Llamado desde el frontend después de verificación exitosa.
 * 
 * Lógica:
 * 1. Buscar membership_intent por user_id con status != active
 * 2. Verificar con Stripe que el pago fue exitoso (PaymentIntent.status = succeeded)
 * 3. Verificar con Stripe Identity si la verificación completó (si es necesaria)
 * 4. Si todo OK y status != active → llamar orchestrator
 * 5. Idempotente: si ya está active, retornar success
 */
export async function POST(request: Request) {
  console.log("[v0] 🔄 RECONCILIATION - START")

  try {
    const supabase = await createClient()

    // CRITICAL: Auth obligatoria
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log("[v0] ❌ Reconcile: No authenticated user")
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // CONDICIÓN EXACTA: Buscar SOLO intents en paid_pending_verification
    const { data: intent, error: intentError } = await supabase
      .from("membership_intents")
      .select("id, status, stripe_payment_intent_id, stripe_verification_session_id, membership_type, billing_cycle, user_id")
      .eq("user_id", user.id)
      .eq("status", "paid_pending_verification") // SOLO este status
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (intentError) {
      console.error("[v0] ❌ Error fetching intent:", intentError)
      return NextResponse.json({ error: "Error fetching intent" }, { status: 500 })
    }

    if (!intent) {
      console.log("[v0] ℹ️ Reconcile: No paid_pending_verification intent found")
      return NextResponse.json({ 
        success: false, 
        message: "No intent in paid_pending_verification state" 
      })
    }

    // CRITICAL: Verificar ownership (seguridad)
    if (intent.user_id !== user.id) {
      console.error("[v0] 🚨 SECURITY VIOLATION: Intent ownership mismatch", {
        intent_user: intent.user_id,
        auth_user: user.id
      })
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    console.log("[v0] 📋 Reconcile: Found intent:", intent.id)

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    // CONDICIÓN 1: identidad verificada (fuente de verdad: identity_verifications)
    const identityVerified = await isIdentityVerified(supabaseAdmin, user.id)

    if (!identityVerified) {
      console.log("[v0] ⏳ Reconcile: Identity not verified yet")
      return NextResponse.json({
        success: false,
        message: "Identity verification pending",
        needs_verification: true
      })
    }

    // CONDICIÓN 2: stripe_payment_intent.status === succeeded
    if (!intent.stripe_payment_intent_id) {
      console.log("[v0] ❌ Reconcile: No payment intent ID")
      return NextResponse.json({
        success: false,
        message: "No payment intent found"
      })
    }

    let paymentSucceeded = false
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(intent.stripe_payment_intent_id)
      paymentSucceeded = paymentIntent.status === "succeeded"
      
      console.log("[v0] 💳 Reconcile: Payment status:", paymentIntent.status)

      if (!paymentSucceeded) {
        return NextResponse.json({
          success: false,
          message: "Payment not succeeded",
          payment_status: paymentIntent.status
        })
      }
    } catch (stripeError: any) {
      console.error("[v0] ❌ Reconcile: Stripe payment check failed:", stripeError.message)
      return NextResponse.json({ 
        error: "Payment verification failed" 
      }, { status: 500 })
    }

    // TODAS LAS CONDICIONES CUMPLIDAS → Activar
    console.log("[v0] ✅ Reconcile: All conditions met - calling orchestrator", {
      intent_id: intent.id,
      user_id: user.id,
      identity_verified: true,
      payment_succeeded: true,
      status: "paid_pending_verification"
    })

    // Obtener subscription de Stripe para sincronizar
    if (!intent.stripe_payment_intent_id) {
      return NextResponse.json({ error: "No subscription ID found" }, { status: 500 })
    }

    const subscription = await stripe.subscriptions.list({
      customer: intent.stripe_customer_id,
      status: "active",
      limit: 1,
    })

    if (!subscription.data.length) {
      return NextResponse.json({ error: "No active subscription in Stripe" }, { status: 404 })
    }

    const result = await syncMembershipFromStripe(subscription.data[0])

    if (!result.success) {
      console.error("[v0] ❌ Reconcile: Orchestrator failed:", result.error)
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    console.log("[v0] ✅ RECONCILIATION SUCCESS", {
      source: "reconcile",
      intent_id: intent.id,
      user_id: user.id,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: "Membership activated via reconciliation",
      source: "reconcile",
      intent_id: intent.id,
      already_active: result.already_active
    })

  } catch (error: any) {
    console.error("[v0] ❌ RECONCILIATION ERROR:", error)
    return NextResponse.json(
      { error: error.message || "Reconciliation failed" },
      { status: 500 }
    )
  }
}

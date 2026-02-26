import { NextResponse } from "next/server"
import { createClient } from "@/app/lib/supabase/server"
import Stripe from "stripe"
import { syncMembershipFromStripe } from "./orchestrator"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
})

// CRITICAL: No cache - authenticated mutation endpoint
export const dynamic = "force-dynamic"

/**
 * MEMBERSHIP ACTIVATE - Mecanismo de recuperacion
 * 
 * Solo sincroniza desde Stripe si el webhook fallo.
 * NO depende de membership_intents.
 * NO mezcla identity ni emails.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // Verificar si ya tiene membresia activa
    const { data: existingMembership } = await supabase
      .from("user_memberships")
      .select("status, membership_type")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()

    if (existingMembership) {
      return NextResponse.json({
        success: true,
        message: "Membership already active",
        already_active: true,
      })
    }

    // Buscar stripe_customer_id en profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: "No Stripe customer found" }, { status: 404 })
    }

    // Buscar suscripcion activa en Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: "active",
      limit: 1,
    })

    if (!subscriptions.data.length) {
      return NextResponse.json({ error: "No active subscription in Stripe" }, { status: 404 })
    }

    // Sincronizar desde Stripe
    const result = await syncMembershipFromStripe(subscriptions.data[0])

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Membership activated from Stripe",
    })
  } catch (error: any) {
    console.error("[v0] Activate error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

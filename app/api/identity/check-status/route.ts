import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import Stripe from "stripe"
import { createRouteHandlerClient } from "@/lib/supabase"

// CRITICAL: No cache - real-time verification status
export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")
    const userId = searchParams.get("userId")
    const intentId = searchParams.get("intentId")

    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // If no sessionId provided, look up from membership_intents OR identity_verifications
    let stripeSessionId = sessionId
    
    if (!stripeSessionId) {
      // First check if intent is already active (already verified via webhook)
      const { data: activeIntent } = await supabase
        .from("membership_intents")
        .select("id, status, stripe_verification_session_id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (activeIntent?.status === "active") {
        // Already verified and activated - return success
        return NextResponse.json({
          verified: true,
          status: "verified",
          membershipActivated: true,
        })
      }

      // Check membership_intents for stripe_verification_session_id
      const { data: pendingIntent } = await supabase
        .from("membership_intents")
        .select("id, stripe_verification_session_id, status")
        .eq("user_id", user.id)
        .eq("status", "paid_pending_verification")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (pendingIntent?.stripe_verification_session_id) {
        stripeSessionId = pendingIntent.stripe_verification_session_id
      } else {
        // Also check identity_verifications as fallback
        const { data: verification } = await supabase
          .from("identity_verifications")
          .select("stripe_verification_id, status")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()

        if (verification?.stripe_verification_id) {
          stripeSessionId = verification.stripe_verification_id
        } else {
          // No verification session exists yet - return not_started
          return NextResponse.json({
            verified: false,
            status: "not_started",
            membershipActivated: false,
          })
        }
      }
    }

    console.log("[v0 API] Verificando estado para sessionId:", stripeSessionId)

    const verificationSession = await stripe.identity.verificationSessions.retrieve(stripeSessionId)

    console.log("[v0 API] Estado:", verificationSession.status)

    const verified = verificationSession.status === "verified"

    if (verified) {
      // Find the user's paid_pending_verification intent
      const { data: intent } = await supabase
        .from("membership_intents")
        .select("id, membership_type, billing_cycle, status")
        .eq("user_id", user.id)
        .in("status", ["paid_pending_verification", "active"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      // Only activate if not already active (unidirectional flow)
      if (intent && intent.status === "paid_pending_verification") {
        // Activate the membership intent
        await supabase
          .from("membership_intents")
          .update({
            status: "active",
            stripe_verification_session_id: stripeSessionId,
            verified_at: new Date().toISOString(),
            activated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", intent.id)

        // Create/update user_memberships
        await supabase.from("user_memberships").upsert(
          {
            user_id: user.id,
            membership_type: intent.membership_type,
            billing_cycle: intent.billing_cycle,
            status: "active",
            start_date: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        )

        // Update profile
        await supabase
          .from("profiles")
          .update({
            identity_verified: true,
            identity_verified_at: new Date().toISOString(),
            membership_status: "active",
            membership_type: intent.membership_type,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id)

        console.log("[v0 API] Membership ACTIVATED for user:", user.id)
      } else {
        // Just update identity verification status
        await supabase
          .from("profiles")
          .update({ identity_verified: true, identity_verified_at: new Date().toISOString() })
          .eq("id", user.id)
      }

      // Update identity_verifications table
      await supabase
        .from("identity_verifications")
        .update({ status: "verified", verified_at: new Date().toISOString() })
        .eq("stripe_verification_id", stripeSessionId)
    }

    return NextResponse.json({
      verified,
      status: verificationSession.status,
      membershipActivated: verified,
    })
  } catch (error: any) {
    console.error("[v0 API] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

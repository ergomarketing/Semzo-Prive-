import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import Stripe from "stripe"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-12-18.acacia" })

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const intentId = searchParams.get("intentId")
  const userId = searchParams.get("userId")

  let intent: any = null

  // Find intent by intentId or userId
  if (intentId) {
    const { data } = await supabase
      .from("membership_intents")
      .select("id, user_id, status, membership_type, billing_cycle, stripe_verification_session_id, verified_at, activated_at")
      .eq("id", intentId)
      .single()
    intent = data
  } else if (userId) {
    const { data } = await supabase
      .from("membership_intents")
      .select("id, user_id, status, membership_type, billing_cycle, stripe_verification_session_id, verified_at, activated_at")
      .eq("user_id", userId)
      .in("status", ["paid_pending_verification", "active"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
    intent = data
  }

  if (!intent) {
    return NextResponse.json({ error: "No membership intent found" }, { status: 404 })
  }

  // If already active, return immediately
  if (intent.status === "active") {
    return NextResponse.json({
      verified: true,
      status: "active",
      membershipType: intent.membership_type,
      verifiedAt: intent.verified_at,
      activatedAt: intent.activated_at,
    })
  }

  // If paid_pending_verification, check Stripe directly for verification status
  if (intent.status === "paid_pending_verification") {
    try {
      // Find verification sessions for this user
      const sessions = await stripe.identity.verificationSessions.list({
        limit: 10,
      })

      // Find a verified session matching our user
      const verifiedSession = sessions.data.find(
        (s) =>
          s.status === "verified" &&
          (s.metadata?.intent_id === intent.id || s.metadata?.user_id === intent.user_id)
      )

      if (verifiedSession) {
        console.log("[v0] Found verified session in Stripe, activating membership:", verifiedSession.id)

        // Activate the membership (webhook may have failed)
        const { error: activationError } = await supabase
          .from("membership_intents")
          .update({
            status: "active",
            stripe_verification_session_id: verifiedSession.id,
            verified_at: new Date().toISOString(),
            activated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", intent.id)
          .eq("status", "paid_pending_verification") // Only if still pending

        if (!activationError) {
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
            .eq("id", intent.user_id)

          // Create user_membership
          await supabase.from("user_memberships").upsert(
            {
              user_id: intent.user_id,
              membership_type: intent.membership_type,
              billing_cycle: intent.billing_cycle,
              status: "active",
              start_date: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          )

          console.log("[v0] Membership activated via polling fallback")

          return NextResponse.json({
            verified: true,
            status: "active",
            membershipType: intent.membership_type,
            verifiedAt: new Date().toISOString(),
            activatedAt: new Date().toISOString(),
          })
        }
      }
    } catch (stripeError: any) {
      console.error("[v0] Error checking Stripe verification:", stripeError.message)
    }
  }

  // Still pending
  console.log("[v0] Backend verification status:", {
    attempt: searchParams.get("attempt") || "unknown",
    verified: false,
    status: intent.status,
  })

  return NextResponse.json({
    verified: false,
    status: intent.status,
    membershipType: intent.membership_type,
  })
}

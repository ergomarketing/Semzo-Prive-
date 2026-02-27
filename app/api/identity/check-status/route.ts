import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import Stripe from "stripe"
import { createRouteHandlerClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    let stripeSessionId = sessionId

    if (!stripeSessionId) {
      const { data: verification } = await supabase
        .from("identity_verifications")
        .select("stripe_verification_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!verification?.stripe_verification_id) {
        return NextResponse.json({
          verified: false,
          status: "not_started",
          membershipActivated: false,
        })
      }

      stripeSessionId = verification.stripe_verification_id
    }

    const verificationSession =
      await stripe.identity.verificationSessions.retrieve(stripeSessionId)

    const verified = verificationSession.status === "verified"

    if (verified) {
      await supabase
        .from("profiles")
        .update({
          identity_verified: true,
          identity_verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      await supabase
        .from("identity_verifications")
        .update({
          status: "verified",
          verified_at: new Date().toISOString(),
        })
        .eq("stripe_verification_id", stripeSessionId)
    }

    return NextResponse.json({
      verified,
      status: verificationSession.status,
      membershipActivated: false,
    })
  } catch (error: any) {
    console.error("[Identity Check Status Error]:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

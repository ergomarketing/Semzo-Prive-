import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"
import { syncMembershipFromStripe } from "@/app/api/membership/activate/orchestrator"

export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get("session_id")

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 })
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    // --- MODO PAYMENT (pase de bolso) ---
    // No tiene subscription, el pago fue único → redirigir directo al dashboard
    if (session.mode === "payment") {
      const userId = session.metadata?.user_id
      if (!userId) return NextResponse.json({ status: "incomplete" })

      const { data: profile } = await supabase
        .from("profiles")
        .select("identity_verified")
        .eq("id", userId)
        .single()

      if (session.payment_status === "paid") {
        return NextResponse.json({
          status: "active",
          identity_verified: profile?.identity_verified ?? true, // pases no requieren verificacion
          mode: "payment",
        })
      }

      return NextResponse.json({ status: "incomplete" })
    }

    // --- MODO SUBSCRIPTION (membresia) ---
    if (!session.subscription) {
      return NextResponse.json({ status: "incomplete" })
    }

    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    )

    await syncMembershipFromStripe(subscription)

    const userId = subscription.metadata?.user_id
    if (!userId) return NextResponse.json({ status: "incomplete" })

    const { data: membership } = await supabase
      .from("user_memberships")
      .select("status")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle()

    const { data: profile } = await supabase
      .from("profiles")
      .select("identity_verified")
      .eq("id", userId)
      .single()

    if (membership?.status === "active") {
      return NextResponse.json({
        status: "active",
        identity_verified: profile?.identity_verified ?? false,
        mode: "subscription",
      })
    }

    return NextResponse.json({ status: "incomplete" })
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to verify session" }, { status: 500 })
  }
}

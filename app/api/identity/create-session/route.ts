import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
})

export async function POST() {
  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const { data: intent } = await supabase
    .from("membership_intents")
    .select("id, membership_type")
    .eq("user_id", user.id)
    .eq("status", "paid_pending_verification")
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (!intent) {
    return NextResponse.json(
      { error: "No hay membresía pendiente de verificación" },
      { status: 400 }
    )
  }

  const { data: existing } = await supabase
    .from("identity_verifications")
    .select("stripe_verification_id, status")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .maybeSingle()

  if (existing?.stripe_verification_id) {
    const session = await stripe.identity.verificationSessions.retrieve(
      existing.stripe_verification_id
    )
    if (session.url) {
      return NextResponse.json({ url: session.url })
    }
  }

  const session = await stripe.identity.verificationSessions.create({
    type: "document",
    metadata: {
      user_id: user.id,
      intent_id: intent.id,
      membership_type: intent.membership_type,
    },
  })

  await supabase.from("identity_verifications").upsert(
    {
      user_id: user.id,
      stripe_verification_id: session.id,
      status: "pending",
      membership_type: intent.membership_type,
    },
    { onConflict: "user_id" }
  )

  // Also update the membership_intent with the verification session ID
  await supabase
    .from("membership_intents")
    .update({
      stripe_verification_session_id: session.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", intent.id)

  return NextResponse.json({ url: session.url })
}

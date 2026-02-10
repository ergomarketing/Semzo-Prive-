import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { supabaseAdmin } from "@/lib/supabase"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export async function POST(request: NextRequest) {
  try {
    const { userId, membershipType } = await request.json()

    if (!userId || !membershipType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data: profile } = await supabaseAdmin.from("profiles").select("*").eq("id", userId).single()

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    let stripeCustomerId = profile.stripe_customer_id

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: profile.email || undefined,
        name: profile.full_name || undefined,
        phone: profile.phone || undefined,
        metadata: {
          user_id: userId,
          membership_type: membershipType,
        },
      })

      stripeCustomerId = customer.id

      await supabaseAdmin.from("profiles").update({ stripe_customer_id: stripeCustomerId }).eq("id", userId)
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      usage: "off_session", // Para cobros futuros sin presencia del usuario
      metadata: {
        user_id: userId,
        membership_type: membershipType,
      },
    })

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
    })
  } catch (error) {
    console.error("[Setup Intent] Error:", error)
    return NextResponse.json({ error: "Error creating setup intent" }, { status: 500 })
  }
}

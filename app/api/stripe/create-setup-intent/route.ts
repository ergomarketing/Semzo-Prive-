import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { supabaseAdmin } from "@/lib/supabase"
import { getSessionUser } from "@/lib/session-user"
import { getValidStripeCustomerId } from "@/lib/stripe-customer"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export async function POST(request: NextRequest) {
  try {
    const { userId, membershipType } = await request.json()

    if (!userId || !membershipType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // La identidad sale de la sesion: el userId del cuerpo solo vale si coincide con la usuaria que ha iniciado sesion.
    const sessionUser = await getSessionUser()
    if (!sessionUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    if (sessionUser.id !== userId) return NextResponse.json({ error: "Prohibido" }, { status: 403 })

    const { data: profile } = await supabaseAdmin.from("profiles").select("*").eq("id", userId).single()

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const stripeCustomerId = await getValidStripeCustomerId(stripe, {
      userId,
      existingId: profile.stripe_customer_id,
      email: profile.email,
      name: profile.full_name,
      phone: profile.phone,
      metadata: { user_id: userId, membership_type: membershipType },
    })

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

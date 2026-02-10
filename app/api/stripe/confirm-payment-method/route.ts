import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { supabaseAdmin } from "@/lib/supabase"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export async function POST(request: NextRequest) {
  try {
    const { setupIntentId, userId } = await request.json()

    if (!setupIntentId || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId)

    if (setupIntent.status !== "succeeded") {
      return NextResponse.json({ error: "Setup intent not succeeded" }, { status: 400 })
    }

    const paymentMethodId = setupIntent.payment_method as string

    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)

    await supabaseAdmin
      .from("user_memberships")
      .update({
        stripe_payment_method_id: paymentMethodId,
        payment_method_verified: true,
        payment_method_last4: paymentMethod.card?.last4,
        payment_method_brand: paymentMethod.card?.brand,
        failed_payment_count: 0,
        dunning_status: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("status", "active")

    return NextResponse.json({
      success: true,
      paymentMethod: {
        last4: paymentMethod.card?.last4,
        brand: paymentMethod.card?.brand,
      },
    })
  } catch (error) {
    console.error("[Confirm Payment Method] Error:", error)
    return NextResponse.json({ error: "Error confirming payment method" }, { status: 500 })
  }
}

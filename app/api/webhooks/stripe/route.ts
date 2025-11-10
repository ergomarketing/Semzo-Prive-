import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import Stripe from "stripe"
import { getSupabaseServiceRole } from "@/app/lib/supabaseClient"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = (await headers()).get("stripe-signature")!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error(`[v0] Webhook signature verification failed:`, err.message)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    const supabase = getSupabaseServiceRole()

    // Cuando se completa un pago de membresía
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session

      const userId = session.metadata?.user_id
      const membershipType = session.metadata?.membership_type
      const selectedBagId = session.metadata?.bag_id

      if (userId && selectedBagId) {
        // Asignar bolso al usuario automáticamente
        const { error } = await supabase
          .from("bags")
          .update({
            status: "rented",
            current_member_id: userId,
          })
          .eq("id", selectedBagId)

        if (error) {
          console.error("[v0] Error assigning bag:", error)
        } else {
          console.log(`[v0] ✅ Bolso ${selectedBagId} asignado automáticamente a usuario ${userId}`)
        }

        // Actualizar membresía del usuario
        await supabase
          .from("profiles")
          .update({
            membership_status: membershipType,
          })
          .eq("id", userId)
      }
    }

    // Cuando expira una suscripción
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata?.user_id

      if (userId) {
        // Liberar bolso del usuario automáticamente
        const { error } = await supabase
          .from("bags")
          .update({
            status: "available",
            current_member_id: null,
          })
          .eq("current_member_id", userId)

        if (error) {
          console.error("[v0] Error releasing bag:", error)
        } else {
          console.log(`[v0] ✅ Bolso liberado automáticamente de usuario ${userId}`)
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[v0] Error in webhook:", error)
    return NextResponse.json({ error: "Webhook error" }, { status: 500 })
  }
}

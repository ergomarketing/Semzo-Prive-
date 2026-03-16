import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" })

export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { data: membership } = await supabase
      .from("user_memberships")
      .select("stripe_subscription_id, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()

    if (!membership) return NextResponse.json({ error: "No tienes una membresía activa" }, { status: 400 })

    // Si tiene Stripe, pausar en Stripe también
    if (membership.stripe_subscription_id) {
      await stripe.subscriptions.update(membership.stripe_subscription_id, {
        pause_collection: { behavior: "mark_uncollectible" },
      })
    }

    await supabase
      .from("user_memberships")
      .update({ status: "paused", updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("status", "active")

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al pausar" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
        },
      },
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_subscription_id")
      .eq("id", user.id)
      .single()

    if (!profile?.stripe_subscription_id) {
      return NextResponse.json({ error: "No tienes una suscripción" }, { status: 400 })
    }

    // Reanudar suscripción en Stripe
    await stripe.subscriptions.update(profile.stripe_subscription_id, {
      pause_collection: null,
    })

    // Actualizar en nuestra base de datos
    await supabase
      .from("profiles")
      .update({
        membership_status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    return NextResponse.json({
      success: true,
      message: "Tu membresía ha sido reactivada",
    })
  } catch (error) {
    console.error("Error resuming subscription:", error)
    return NextResponse.json({ error: "Error al reanudar suscripción" }, { status: 500 })
  }
}

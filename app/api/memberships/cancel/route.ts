import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import Stripe from "stripe"

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
      .select("stripe_subscription_id, status, end_date")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()

    if (!membership) return NextResponse.json({ error: "No tienes una membresía activa" }, { status: 400 })

    let cancelDate = ""

    if (membership.stripe_subscription_id && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" })
        const sub = await stripe.subscriptions.retrieve(membership.stripe_subscription_id)
        if (sub.status === "active" || sub.status === "trialing") {
          const updated = await stripe.subscriptions.update(membership.stripe_subscription_id, {
            cancel_at_period_end: true,
          })
          cancelDate = new Date(updated.current_period_end * 1000).toLocaleDateString("es-ES", {
            day: "numeric", month: "long", year: "numeric",
          })
        } else {
          cancelDate = membership.end_date
            ? new Date(membership.end_date).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
            : "final del período"
        }
      } catch (_) {
        // Stripe no disponible o suscripción inválida — cancelar solo en Supabase
        cancelDate = membership.end_date
          ? new Date(membership.end_date).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
          : "final del período"
      }
    } else {
      // Gift card / manual — cancelar inmediatamente en Supabase
      cancelDate = membership.end_date
        ? new Date(membership.end_date).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
        : "final del período"
    }

    await supabase
      .from("user_memberships")
      .update({ status: "cancelling", updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("status", "active")

    return NextResponse.json({ success: true, cancelDate })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al cancelar" }, { status: 500 })
  }
}

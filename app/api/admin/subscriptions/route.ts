import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export async function GET() {
  try {
    const { error: tableError } = await supabaseAdmin.from("subscriptions").select("id").limit(1)

    // Si la tabla no existe, devolver array vacío con mensaje
    if (tableError && tableError.code === "42P01") {
      return NextResponse.json({
        subscriptions: [],
        message: "La tabla subscriptions no existe. Ejecuta el script create-subscriptions-tables.sql",
      })
    }

    const { data: subscriptions, error } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      // Si hay error de tabla no existe, devolver vacío
      if (error.message?.includes("does not exist")) {
        return NextResponse.json({
          subscriptions: [],
          message: "La tabla subscriptions no existe. Ejecuta el script create-subscriptions-tables.sql",
        })
      }
      throw error
    }

    const userIds = [...new Set((subscriptions || []).map((s) => s.user_id).filter(Boolean))]
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"])

    const profilesMap = new Map((profiles || []).map((p) => [p.id, p]))

    // Para cada suscripción, verificar estado real en Stripe
    const enrichedSubscriptions = await Promise.all(
      (subscriptions || []).map(async (sub) => {
        let stripeStatus = null
        let stripeData = null

        try {
          if (sub.stripe_subscription_id) {
            const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id)
            stripeStatus = stripeSub.status
            stripeData = {
              status: stripeSub.status,
              current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
              cancel_at_period_end: stripeSub.cancel_at_period_end,
              latest_invoice: stripeSub.latest_invoice,
            }
          }
        } catch (e) {
          console.error("Error fetching Stripe subscription:", e)
          stripeStatus = "error"
        }

        return {
          ...sub,
          profiles: profilesMap.get(sub.user_id) || null,
          stripe_verified_status: stripeStatus,
          stripe_data: stripeData,
          status_match: sub.status === stripeStatus,
        }
      }),
    )

    return NextResponse.json(enrichedSubscriptions)
  } catch (error) {
    console.error("Error fetching subscriptions:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

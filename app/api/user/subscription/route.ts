import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET() {
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

    // Obtener suscripción activa
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing", "past_due"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    // Obtener historial de pagos
    const { data: payments, error: payError } = await supabase
      .from("payment_history")
      .select("*")
      .eq("user_id", user.id)
      .order("payment_date", { ascending: false })
      .limit(10)

    // Obtener perfil
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, stripe_subscription_id, membership_type, membership_status")
      .eq("id", user.id)
      .single()

    return NextResponse.json({
      subscription,
      payments: payments || [],
      profile,
    })
  } catch (error) {
    console.error("Error fetching subscription:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

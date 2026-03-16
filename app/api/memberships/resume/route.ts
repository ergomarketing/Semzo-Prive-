import Stripe from "stripe"
import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { subscriptionId } = await req.json()

  if (subscriptionId) {
    try {
      await stripe.subscriptions.update(subscriptionId, { pause_collection: null } as any)
    } catch (e) {
      console.error("Stripe resume error", e)
    }
  } else {
    // Gift card / sin Stripe — reanudar directamente en Supabase
    await supabase
      .from("user_memberships")
      .update({ status: "active", updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
  }

  return NextResponse.json({ success: true })
}

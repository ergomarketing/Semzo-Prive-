import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import Stripe from "stripe"
import { requireAdminAuth } from "@/lib/admin-auth"
import { syncMembershipFromStripe } from "@/app/api/membership/activate/orchestrator"

export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
})

/**
 * Admin: reejecuta el orquestador existente para una membresia concreta.
 * No duplica reglas: la decision de activar la toma syncMembershipFromStripe.
 */
export async function POST(request: Request) {
  const authError = await requireAdminAuth()
  if (authError) return authError

  try {
    const body = await request.json().catch(() => null)
    const membershipId = typeof body?.membership_id === "string" ? body.membership_id : null
    if (!membershipId) {
      return NextResponse.json({ error: "membership_id requerido" }, { status: 400 })
    }

    const supabaseUrl =
      process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: "Supabase configuration missing" }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: membership, error } = await supabaseAdmin
      .from("user_memberships")
      .select("id, user_id, stripe_subscription_id")
      .eq("id", membershipId)
      .maybeSingle()

    if (error || !membership) {
      return NextResponse.json({ error: "Membresia no encontrada" }, { status: 404 })
    }
    if (!membership.stripe_subscription_id) {
      return NextResponse.json({ error: "La membresia no tiene suscripcion de Stripe" }, { status: 400 })
    }

    const subscription = await stripe.subscriptions.retrieve(membership.stripe_subscription_id)
    const result = await syncMembershipFromStripe(subscription)

    console.log("[admin/subscriptions/resync]", membership.user_id, result)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 422 })
    }
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("[admin/subscriptions/resync] error:", err)
    return NextResponse.json({ error: "Error interno", details: err?.message }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export async function GET() {
  try {
    const supabaseUrl = process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey =
      process.env.SUPABASE_SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Supabase configuration missing" }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .order("created_at", { ascending: false })

    const { data: activeMembers, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, full_name, email, membership_type, membership_status, created_at, updated_at, stripe_subscription_id, stripe_customer_id, subscription_end_date",
      )
      .eq("membership_status", "active")
      .order("updated_at", { ascending: false })

    let allSubscriptions: any[] = []

    // Add from subscriptions table
    if (subscriptions && subscriptions.length > 0) {
      const userIds = [...new Set(subscriptions.map((s) => s.user_id).filter(Boolean))]
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"])

      const profilesMap = new Map((profiles || []).map((p) => [p.id, p]))

      allSubscriptions = await Promise.all(
        subscriptions.map(async (sub) => {
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
              }
            }
          } catch (e) {
            stripeStatus = sub.payment_method === "gift_card" ? "gift_card" : null
          }

          return {
            ...sub,
            profiles: profilesMap.get(sub.user_id) || null,
            stripe_verified_status: stripeStatus,
            stripe_data: stripeData,
            status_match: sub.stripe_subscription_id ? sub.status === stripeStatus : true,
          }
        }),
      )
    }

    if (activeMembers && activeMembers.length > 0) {
      const existingUserIds = new Set(allSubscriptions.map((s) => s.user_id))

      for (const member of activeMembers) {
        if (!existingUserIds.has(member.id)) {
          allSubscriptions.push({
            id: `profile_${member.id}`,
            user_id: member.id,
            membership_type: member.membership_type,
            status: member.membership_status,
            current_period_start: member.created_at,
            current_period_end: member.subscription_end_date || null,
            stripe_subscription_id: member.stripe_subscription_id,
            stripe_customer_id: member.stripe_customer_id,
            created_at: member.created_at,
            updated_at: member.updated_at,
            profiles: {
              id: member.id,
              full_name: member.full_name,
              email: member.email,
            },
            stripe_verified_status: member.stripe_subscription_id ? null : "direct_payment",
            status_match: true,
          })
        }
      }
    }

    return NextResponse.json(allSubscriptions)
  } catch (error) {
    console.error("Error fetching subscriptions:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

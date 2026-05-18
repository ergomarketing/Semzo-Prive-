import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" })

// Categoria C - "Miembro presente" para conteo total de socias
const CATEGORY_C_STATES = [
  "active",
  "cancelled_active",
  "past_due",
  "paused",
  "limited_access",
  "paid_pending_verification",
  "pending_verification",
]

export async function GET() {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const now = new Date()
    const startOfMonthTs = Math.floor(new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000)

    // Operativo (bolsos, reservas) -> Supabase
    // Miembros (Categoria C) -> user_memberships
    // Revenue (Categoria A financiera) -> Stripe
    const [bagsResult, reservationsResult, membersResult, stripeChargesResult] = await Promise.all([
      supabase.from("bags").select("status"),
      supabase.from("reservations").select("status"),
      supabase.from("user_memberships").select("user_id, status").in("status", CATEGORY_C_STATES),
      stripe.charges
        .list({ limit: 100, created: { gte: startOfMonthTs } })
        .catch((e) => {
          console.error("[v0] [dashboard-stats] stripe charges error:", e)
          return { data: [] as Stripe.Charge[] }
        }),
    ])

    const bags = bagsResult.data || []
    const reservations = reservationsResult.data || []
    const memberships = membersResult.data || []
    const stripeCharges = (stripeChargesResult as { data: Stripe.Charge[] }).data || []

    const availableBags = bags.filter((b) => b.status === "available").length
    const rentedBags = bags.filter((b) => b.status === "rented").length
    const activeReservations = reservations.filter((r) => r.status === "active" || r.status === "confirmed").length

    // Revenue mensual real desde Stripe (cents -> euros)
    const monthlyRevenue =
      stripeCharges.filter((c) => c.status === "succeeded").reduce((sum, c) => sum + c.amount, 0) / 100

    // Miembros distintos (un usuario puede tener mas de una fila historica)
    const uniqueMemberIds = new Set(memberships.map((m) => m.user_id))

    const stats = {
      totalBags: bags.length,
      availableBags,
      rentedBags,
      totalReservations: reservations.length,
      activeReservations,
      totalMembers: uniqueMemberIds.size,
      monthlyRevenue,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("[v0] [dashboard-stats] error:", error)
    return NextResponse.json({ error: "Error loading dashboard stats" }, { status: 500 })
  }
}

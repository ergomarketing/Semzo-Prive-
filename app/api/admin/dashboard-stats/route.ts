import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log("[v0] 📊 Cargando estadísticas del dashboard desde API...")

    const [bagsResult, reservationsResult, membersResult, paymentsResult] = await Promise.all([
      supabase.from("bags").select("status"),
      supabase.from("reservations").select("status, total_amount"),
      supabase.from("profiles").select("id"),
      supabase.from("payments").select("amount, status, created_at"),
    ])

    console.log("[v0] 📦 Bags result:", bagsResult)
    console.log("[v0] 📅 Reservations result:", reservationsResult)
    console.log("[v0] 👥 Members result:", membersResult)
    console.log("[v0] 💳 Payments result:", paymentsResult)

    const bags = bagsResult.data || []
    const reservations = reservationsResult.data || []
    const members = membersResult.data || []
    const payments = paymentsResult.data || []

    const availableBags = bags.filter((b) => b.status === "available").length
    const rentedBags = bags.filter((b) => b.status === "rented").length
    const activeReservations = reservations.filter((r) => r.status === "active" || r.status === "confirmed").length

    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthlyRevenue = payments
      .filter((p) => {
        const paymentDate = new Date(p.created_at)
        return paymentDate >= firstDayOfMonth && p.status === "completed"
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0)

    const stats = {
      totalBags: bags.length,
      availableBags,
      rentedBags,
      totalReservations: reservations.length,
      activeReservations,
      totalMembers: members.length,
      monthlyRevenue,
    }

    console.log("[v0] ✅ Estadísticas calculadas:", stats)

    return NextResponse.json(stats)
  } catch (error) {
    console.error("[v0] ❌ Error loading dashboard stats:", error)
    return NextResponse.json({ error: "Error loading dashboard stats" }, { status: 500 })
  }
}

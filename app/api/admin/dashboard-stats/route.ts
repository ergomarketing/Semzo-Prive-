import { NextResponse } from "next/server"
import { getSupabaseServiceRole } from "@/app/lib/supabaseClient"

export async function GET() {
  console.log("[v0] 📊 Cargando estadísticas del dashboard desde API...")

  try {
    const supabase = getSupabaseServiceRole()

    const [bagsResult, reservationsResult, membersResult] = await Promise.all([
      supabase.from("bags").select("status"),
      supabase.from("reservations").select("status, total_amount, created_at"),
      supabase.from("profiles").select("id"),
    ])

    console.log("[v0] 📦 Bags result:", JSON.stringify(bagsResult).slice(0, 200) + "...")
    console.log("[v0] 📅 Reservations result:", JSON.stringify(reservationsResult))
    console.log("[v0] 👥 Members result:", JSON.stringify(membersResult))

    const totalBags = bagsResult.data?.length || 0
    const availableBags = bagsResult.data?.filter((b) => b.status === "available").length || 0
    const rentedBags = bagsResult.data?.filter((b) => b.status === "rented").length || 0

    const totalReservations = reservationsResult.data?.length || 0
    const activeReservations = reservationsResult.data?.filter((r) => r.status === "active").length || 0

    const totalMembers = membersResult.data?.length || 0

    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const monthlyRevenue =
      reservationsResult.data
        ?.filter((r) => {
          const createdAt = new Date(r.created_at)
          return createdAt >= firstDayOfMonth && r.status === "completed"
        })
        .reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0

    const stats = {
      totalBags,
      availableBags,
      rentedBags,
      totalReservations,
      activeReservations,
      totalMembers,
      monthlyRevenue,
    }

    console.log("[v0] ✅ Estadísticas calculadas:", stats)

    return NextResponse.json(stats)
  } catch (error) {
    console.error("[v0] ❌ Error loading dashboard stats:", error)
    return NextResponse.json({ error: "Failed to load dashboard stats" }, { status: 500 })
  }
}

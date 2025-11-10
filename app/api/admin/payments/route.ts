import { NextResponse } from "next/server"
import { getSupabaseServiceRole } from "@/app/lib/supabaseClient"

export async function GET() {
  try {
    const supabase = getSupabaseServiceRole()

    const { data: reservations, error } = await supabase
      .from("reservations")
      .select(`
        *,
        profiles!reservations_user_id_fkey (
          full_name,
          email
        ),
        bags (
          name,
          brand
        )
      `)
      .eq("status", "approved")
      .order("created_at", { ascending: false })

    if (error) throw error

    // Calculate stats
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    const payments = (reservations || []).map((reservation) => ({
      id: reservation.id,
      date: reservation.created_at,
      customer_name: reservation.profiles?.full_name || "Desconocido",
      customer_email: reservation.profiles?.email || "",
      bag_name: reservation.bags ? `${reservation.bags.name} - ${reservation.bags.brand}` : "N/A",
      amount: reservation.total_amount || 0,
      payment_method: "Stripe",
      stripe_payment_id: reservation.stripe_payment_intent_id || "N/A",
      status: "completed",
    }))

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0)

    const monthlyRevenue = payments
      .filter((p) => {
        const date = new Date(p.date)
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear
      })
      .reduce((sum, p) => sum + p.amount, 0)

    const successfulPayments = payments.length
    const pendingPayments = 0 // Add logic for pending if needed

    return NextResponse.json({
      payments,
      stats: {
        totalRevenue,
        monthlyRevenue,
        successfulPayments,
        pendingPayments,
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching payments:", error)
    return NextResponse.json({ error: "Error al cargar los pagos" }, { status: 500 })
  }
}

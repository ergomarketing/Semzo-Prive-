import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Admin reservations API called")

    const { data: reservations, error: reservationsError } = await supabase
      .from("reservations")
      .select(`
        *,
        profiles(full_name, email, membership_type),
        bags(name, brand)
      `)
      .order("created_at", { ascending: false })

    if (reservationsError) {
      console.log("[v0] Error fetching reservations:", reservationsError)
      // Si no existe la tabla, devolver estructura vacía
      return NextResponse.json({
        reservations: [],
        stats: {
          total: 0,
          active: 0,
          pending: 0,
          completed: 0,
          cancelled: 0,
        },
      })
    }

    const processedReservations =
      reservations?.map((reservation) => ({
        id: reservation.id,
        bag_id: reservation.bag_id,
        bag_name: reservation.bags?.name || "Bolso desconocido",
        bag_brand: reservation.bags?.brand || "Marca desconocida",
        customer_name: reservation.profiles?.full_name || "Cliente desconocido",
        customer_email: reservation.profiles?.email || "Email desconocido",
        membership_type: reservation.profiles?.membership_type || "free",
        start_date: reservation.start_date,
        end_date: reservation.end_date,
        status: reservation.status,
        total_amount: reservation.total_amount,
        created_at: reservation.created_at,
        updated_at: reservation.updated_at,
      })) || []

    const stats = {
      total: processedReservations.length,
      active: processedReservations.filter((r) => r.status === "active").length,
      pending: processedReservations.filter((r) => r.status === "pending").length,
      completed: processedReservations.filter((r) => r.status === "completed").length,
      cancelled: processedReservations.filter((r) => r.status === "cancelled").length,
    }

    console.log("[v0] Reservations data processed:", { count: processedReservations.length, stats })

    return NextResponse.json({
      reservations: processedReservations,
      stats,
    })
  } catch (error) {
    console.error("[v0] Admin reservations API error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

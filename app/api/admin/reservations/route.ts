import { NextResponse } from "next/server"
import { getSupabaseServiceRole } from "@/app/lib/supabaseClient"

export async function GET() {
  console.log("[v0] 📅 Fetching reservations from API...")

  try {
    const supabase = getSupabaseServiceRole()

    // Fetch reservations with related bag and profile data
    const { data: reservations, error } = await supabase
      .from("reservations")
      .select(
        `
        id,
        start_date,
        end_date,
        status,
        total_amount,
        created_at,
        bag_id,
        bags (
          id,
          name,
          brand
        ),
        user_id,
        profiles (
          id,
          full_name,
          email
        )
      `,
      )
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] ❌ Error fetching reservations:", error)
      return NextResponse.json({ error: "Failed to fetch reservations" }, { status: 500 })
    }

    console.log("[v0] ✅ Fetched reservations:", reservations?.length || 0)

    // Transform the data to match the frontend interface
    const formattedReservations =
      reservations?.map((reservation: any) => ({
        id: reservation.id,
        bagName: reservation.bags ? `${reservation.bags.brand} ${reservation.bags.name}` : "Unknown Bag",
        memberName: reservation.profiles?.full_name || reservation.profiles?.email || "Unknown Member",
        startDate: reservation.start_date,
        endDate: reservation.end_date,
        status: reservation.status,
        totalPrice: reservation.total_amount || 0,
      })) || []

    return NextResponse.json(formattedReservations)
  } catch (error) {
    console.error("[v0] ❌ Error in reservations API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  console.log("[v0] 📝 Updating reservation status...")

  try {
    const { reservationId, status } = await request.json()

    if (!reservationId || !status) {
      return NextResponse.json({ error: "Missing reservationId or status" }, { status: 400 })
    }

    const supabase = getSupabaseServiceRole()

    const { data, error } = await supabase
      .from("reservations")
      .update({ status })
      .eq("id", reservationId)
      .select()
      .single()

    if (error) {
      console.error("[v0] ❌ Error updating reservation:", error)
      return NextResponse.json({ error: "Failed to update reservation" }, { status: 500 })
    }

    console.log("[v0] ✅ Reservation updated:", data)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] ❌ Error in reservation update:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

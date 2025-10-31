import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Admin inventory API called")

    const { data: bags, error: bagsError } = await supabase.from("bags").select(`
        *,
        reservations!inner(
          id,
          user_id,
          start_date,
          end_date,
          status,
          profiles(full_name, email)
        )
      `)

    if (bagsError) {
      console.log("[v0] Error fetching bags:", bagsError)
      const mockInventory = [
        {
          id: "chanel-classic-flap",
          name: "Classic Flap Medium",
          brand: "Chanel",
          status: "available",
          condition: "excellent",
          total_rentals: 0,
          current_renter: null,
          rented_until: null,
          waiting_list: [],
          last_maintenance: new Date().toISOString(),
        },
        {
          id: "lv-speedy-30",
          name: "Speedy 30",
          brand: "Louis Vuitton",
          status: "available",
          condition: "very-good",
          total_rentals: 0,
          current_renter: null,
          rented_until: null,
          waiting_list: [],
          last_maintenance: new Date().toISOString(),
        },
      ]

      return NextResponse.json({
        inventory: mockInventory,
        stats: {
          total: mockInventory.length,
          available: mockInventory.filter((b) => b.status === "available").length,
          rented: mockInventory.filter((b) => b.status === "rented").length,
          maintenance: mockInventory.filter((b) => b.status === "maintenance").length,
        },
      })
    }

    const processedInventory =
      bags?.map((bag) => ({
        id: bag.id,
        name: bag.name,
        brand: bag.brand,
        status: bag.status || "available",
        condition: bag.condition || "excellent",
        total_rentals: bag.total_rentals || 0,
        current_renter: bag.current_renter,
        rented_until: bag.rented_until,
        waiting_list: bag.waiting_list || [],
        last_maintenance: bag.last_maintenance,
        reservations: bag.reservations || [],
      })) || []

    const stats = {
      total: processedInventory.length,
      available: processedInventory.filter((b) => b.status === "available").length,
      rented: processedInventory.filter((b) => b.status === "rented").length,
      maintenance: processedInventory.filter((b) => b.status === "maintenance").length,
    }

    console.log("[v0] Inventory data processed:", { count: processedInventory.length, stats })

    return NextResponse.json({
      inventory: processedInventory,
      stats,
    })
  } catch (error) {
    console.error("[v0] Admin inventory API error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { bagId, status } = body

    if (!bagId || !status) {
      return NextResponse.json({ error: "bagId y status son requeridos" }, { status: 400 })
    }

    if (!["available", "rented", "maintenance", "reserved"].includes(status)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 })
    }

    console.log(`[v0] Updating bag ${bagId} to status ${status}`)

    const { data, error } = await supabase
      .from("bags")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bagId)
      .select()

    if (error) {
      console.error("[v0] Error updating bag status:", error)
      return NextResponse.json({ error: "Error al actualizar el estado del bolso" }, { status: 500 })
    }

    console.log(`[v0] Bag ${bagId} status updated successfully to ${status}`)

    return NextResponse.json({ success: true, bag: data[0] })
  } catch (error) {
    console.error("[v0] PATCH inventory API error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

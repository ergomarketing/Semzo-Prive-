import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

/**
 * GET - Obtener todas las reservas del usuario autenticado
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id") || request.nextUrl.searchParams.get("user_id")

    if (!userId) {
      return NextResponse.json({ error: "Usuario no autenticado", reservations: [] }, { status: 401 })
    }

    console.log("[v0] Fetching reservations for user:", userId)

    const status = request.nextUrl.searchParams.get("status")
    const limit = Number.parseInt(request.nextUrl.searchParams.get("limit") || "50")
    const offset = Number.parseInt(request.nextUrl.searchParams.get("offset") || "0")

    let query = supabase
      .from("reservations")
      .select(`
        id,
        bag_id,
        status,
        start_date,
        end_date,
        total_amount,
        created_at,
        updated_at,
        bags (
          id,
          name,
          brand,
          image_url,
          daily_price,
          status
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq("status", status)
    }

    const { data: reservations, error } = await query

    if (error) {
      console.error("[v0] Error fetching reservations:", error)
      return NextResponse.json(
        { error: "Error al obtener reservas", details: error.message, reservations: [] },
        { status: 500 },
      )
    }

    const { data: allReservations } = await supabase.from("reservations").select("status").eq("user_id", userId)

    const stats = {
      total: allReservations?.length || 0,
      active: allReservations?.filter((r) => r.status === "active").length || 0,
      pending: allReservations?.filter((r) => r.status === "pending").length || 0,
      confirmed: allReservations?.filter((r) => r.status === "confirmed").length || 0,
      completed: allReservations?.filter((r) => r.status === "completed").length || 0,
      cancelled: allReservations?.filter((r) => r.status === "cancelled").length || 0,
    }

    console.log("[v0] Reservations fetched:", { count: reservations?.length || 0, stats })

    return NextResponse.json({
      success: true,
      reservations: reservations || [],
      stats,
      pagination: { limit, offset, total: allReservations?.length || 0 },
    })
  } catch (error) {
    console.error("[v0] Unexpected error in GET /api/user/reservations:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Unknown error",
        reservations: [],
      },
      { status: 500 },
    )
  }
}

/**
 * POST - Crear una nueva reserva
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    console.log("[v0] POST /api/user/reservations - userId:", userId)

    if (!userId) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    const body = await request.json()
    console.log("[v0] Reservation request body:", body)

    const { bag_id, start_date, end_date } = body

    if (!bag_id || !start_date || !end_date) {
      return NextResponse.json({ error: "Faltan campos requeridos: bag_id, start_date, end_date" }, { status: 400 })
    }

    const startDate = new Date(start_date)
    const endDate = new Date(end_date)

    if (startDate >= endDate) {
      return NextResponse.json({ error: "La fecha de inicio debe ser anterior a la fecha de fin" }, { status: 400 })
    }

    // Verificar disponibilidad del bolso
    const { data: bag, error: bagError } = await supabase
      .from("bags")
      .select("id, name, status, daily_price, price")
      .eq("id", bag_id)
      .single()

    console.log("[v0] Bag found:", bag, "Error:", bagError)

    if (bagError || !bag) {
      return NextResponse.json({ error: "Bolso no encontrado" }, { status: 404 })
    }

    // This handles cases where status might be "Available" or similar
    const normalizedStatus = bag.status?.toLowerCase()
    if (normalizedStatus !== "available" && normalizedStatus !== "disponible") {
      console.log("[v0] Bag not available, status:", bag.status)
      return NextResponse.json({ error: "El bolso no está disponible" }, { status: 400 })
    }

    // Calcular el monto total
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const dailyPrice = bag.daily_price || bag.price || 0
    const totalAmount = days * dailyPrice

    console.log("[v0] Creating reservation:", { userId, bag_id, days, totalAmount })

    // Crear la reserva
    const { data: reservation, error: createError } = await supabase
      .from("reservations")
      .insert({
        user_id: userId,
        bag_id,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: "pending",
        total_amount: totalAmount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(`
        *,
        bags (
          id,
          name,
          brand,
          image_url
        )
      `)
      .single()

    if (createError) {
      console.error("[v0] Error creating reservation:", createError)
      return NextResponse.json({ error: "Error al crear la reserva", details: createError.message }, { status: 500 })
    }

    console.log("[v0] Reservation created successfully:", reservation.id)

    await supabase.from("bags").update({ status: "rented", updated_at: new Date().toISOString() }).eq("id", bag_id)

    return NextResponse.json({
      success: true,
      message: "Reserva creada exitosamente",
      reservation,
    })
  } catch (error) {
    console.error("[v0] Unexpected error in POST /api/user/reservations:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

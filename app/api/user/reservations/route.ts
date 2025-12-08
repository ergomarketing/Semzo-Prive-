import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

/**
 * GET - Obtener todas las reservas del usuario autenticado
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener el user_id de los headers o query params
    const userId = request.headers.get("x-user-id") || request.nextUrl.searchParams.get("user_id")

    if (!userId) {
      return NextResponse.json(
        { error: "Usuario no autenticado", reservations: [] },
        { status: 401 }
      )
    }

    console.log("[API] Fetching reservations for user:", userId)

    // Obtener filtros opcionales
    const status = request.nextUrl.searchParams.get("status")
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "50")
    const offset = parseInt(request.nextUrl.searchParams.get("offset") || "0")

    // Construir query
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

    // Aplicar filtro de estado si existe
    if (status) {
      query = query.eq("status", status)
    }

    const { data: reservations, error } = await query

    if (error) {
      console.error("[API] Error fetching reservations:", error)
      return NextResponse.json(
        { error: "Error al obtener reservas", details: error.message, reservations: [] },
        { status: 500 }
      )
    }

    // Calcular estadísticas
    const { data: allReservations } = await supabase
      .from("reservations")
      .select("status")
      .eq("user_id", userId)

    const stats = {
      total: allReservations?.length || 0,
      active: allReservations?.filter((r) => r.status === "active").length || 0,
      pending: allReservations?.filter((r) => r.status === "pending").length || 0,
      confirmed: allReservations?.filter((r) => r.status === "confirmed").length || 0,
      completed: allReservations?.filter((r) => r.status === "completed").length || 0,
      cancelled: allReservations?.filter((r) => r.status === "cancelled").length || 0,
    }

    console.log("[API] Reservations fetched successfully:", {
      count: reservations?.length || 0,
      stats,
    })

    return NextResponse.json({
      success: true,
      reservations: reservations || [],
      stats,
      pagination: {
        limit,
        offset,
        total: allReservations?.length || 0,
      },
    })
  } catch (error) {
    console.error("[API] Unexpected error in GET /api/user/reservations:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Unknown error",
        reservations: [],
      },
      { status: 500 }
    )
  }
}

/**
 * POST - Crear una nueva reserva
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    // 1. Obtener el perfil del usuario para verificar la membresía
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("membership_type")
      .eq("id", userId)
      .single()

    if (profileError || !profile) {
      console.error("[API] Error fetching user profile:", profileError)
      return NextResponse.json({ error: "No se pudo obtener el perfil del usuario" }, { status: 500 })
    }

    const membershipType = profile.membership_type || "none"

    // 2. Definir límites de reserva (asumiendo 1 bolso activo a la vez para todas las membresías de alquiler)
    const MAX_ACTIVE_RESERVATIONS = 1

    // 3. Contar reservas activas del usuario
    const { data: activeReservations, error: activeReservationsError } = await supabase
      .from("reservations")
      .select("id")
      .eq("user_id", userId)
      .in("status", ["active", "confirmed", "pending"]) // Contar estados que ocupan el slot

    if (activeReservationsError) {
      console.error("[API] Error fetching active reservations:", activeReservationsError)
      return NextResponse.json({ error: "Error al verificar reservas activas" }, { status: 500 })
    }

    const activeCount = activeReservations.length

    // 4. Aplicar límite de membresía
    if (activeCount >= MAX_ACTIVE_RESERVATIONS) {
      return NextResponse.json(
        {
          error: `Ya tienes ${activeCount} reserva(s) activa(s) o pendiente(s). Tu membresía (${membershipType}) solo permite ${MAX_ACTIVE_RESERVATIONS} reserva activa a la vez.`,
          details: "El usuario ha alcanzado el límite de reservas activas según su membresía.",
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { bag_id, start_date, end_date } = body

    // Validaciones
    if (!bag_id || !start_date || !end_date) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: bag_id, start_date, end_date" },
        { status: 400 }
      )
    }

    // Validar que start_date sea antes de end_date
    const startDate = new Date(start_date)
    const endDate = new Date(end_date)

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: "La fecha de inicio debe ser anterior a la fecha de fin" },
        { status: 400 }
      )
    }

    // Validar que las fechas sean futuras
    const now = new Date()
    if (startDate < now) {
      return NextResponse.json(
        { error: "La fecha de inicio debe ser futura" },
        { status: 400 }
      )
    }

    // Verificar disponibilidad del bolso
    const { data: bag, error: bagError } = await supabase
      .from("bags")
      .select("id, name, status, daily_price")
      .eq("id", bag_id)
      .single()

    if (bagError || !bag) {
      return NextResponse.json({ error: "Bolso no encontrado" }, { status: 404 })
    }

    if (bag.status !== "available") {
      return NextResponse.json({ error: "El bolso no está disponible" }, { status: 400 })
    }

    // Verificar que no haya reservas activas en el mismo período
    const { data: conflictingReservations } = await supabase
      .from("reservations")
      .select("id")
      .eq("bag_id", bag_id)
      .in("status", ["active", "confirmed", "pending"])
      .or(`and(start_date.lte.${end_date},end_date.gte.${start_date})`)

    if (conflictingReservations && conflictingReservations.length > 0) {
      return NextResponse.json(
        { error: "El bolso ya tiene reservas en ese período" },
        { status: 409 }
      )
    }

    // Calcular el monto total
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const totalAmount = days * (bag.daily_price || 0)

    // Crear la reserva
    const { data: reservation, error: createError } = await supabase
      .from("reservations")
      .insert({
        user_id: userId,
        bag_id,
        start_date,
        end_date,
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
      console.error("[API] Error creating reservation:", createError)
      return NextResponse.json(
        { error: "Error al crear la reserva", details: createError.message },
        { status: 500 }
      )
    }

    console.log("[API] Reservation created successfully:", reservation.id)

    return NextResponse.json({
      success: true,
      message: "Reserva creada exitosamente",
      reservation,
    })
  } catch (error) {
    console.error("[API] Unexpected error in POST /api/user/reservations:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

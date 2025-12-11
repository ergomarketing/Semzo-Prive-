import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error("Missing Supabase configuration")
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "mailbox@semzoprive.com"

async function notifyAdmin(subject: string, htmlContent: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || "https://semzoprive.com"}/api/admin/send-email`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: ADMIN_EMAIL,
          subject: `[Admin] ${subject}`,
          body: htmlContent,
          html: htmlContent,
        }),
      },
    )
    console.log(`[v0] Admin notification sent:`, subject, response.ok)
  } catch (error) {
    console.error("[v0] Error notifying admin:", error)
  }
}

function getPriceForMembership(bag: any, membershipType: string | null): number {
  const membership = membershipType?.toLowerCase() || "free"

  // Precios de membresía mensual (el usuario ya paga esto)
  // Si tiene membresía activa, el precio de la reserva es 0
  const membershipPrices: Record<string, number> = {
    signature: 129,
    prive: 189,
    essentiel: 59,
  }

  // Si el usuario tiene membresía activa, no paga extra por la reserva
  if (membership === "signature" || membership === "prive" || membership === "essentiel") {
    return 0 // Ya paga con su membresía
  }

  // Si es free/petite, cobra el precio del bolso
  return bag.price || 0
}

/**
 * GET - Obtener todas las reservas del usuario autenticado
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase()
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
        membership_type,
        created_at,
        updated_at,
        bags (
          id,
          name,
          brand,
          image_url,
          price,
          price_essentiel,
          price_signature,
          price_prive,
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
    const supabase = getSupabase()
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

    const { data: userProfile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, email, membership_type, membership_status")
      .eq("id", userId)
      .single()

    if (profileError) {
      console.error("[v0] Error fetching user profile:", profileError)
    }

    const userMembershipType = userProfile?.membership_type || "free"
    const userMembershipStatus = userProfile?.membership_status

    console.log("[v0] User membership:", { type: userMembershipType, status: userMembershipStatus })

    const { data: bag, error: bagError } = await supabase
      .from("bags")
      .select("id, name, brand, image_url, status, price, price_essentiel, price_signature, price_prive")
      .eq("id", bag_id)
      .single()

    console.log("[v0] Bag found:", bag, "Error:", bagError)

    if (bagError || !bag) {
      return NextResponse.json({ error: "Bolso no encontrado" }, { status: 404 })
    }

    const normalizedStatus = bag.status?.toLowerCase()
    if (normalizedStatus !== "available" && normalizedStatus !== "disponible") {
      console.log("[v0] Bag not available, status:", bag.status)
      return NextResponse.json({ error: "El bolso no está disponible" }, { status: 400 })
    }

    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    const totalAmount = getPriceForMembership(bag, userMembershipType)

    console.log("[v0] Creating reservation:", { userId, bag_id, days, totalAmount, membershipType: userMembershipType })

    const { data: reservation, error: createError } = await supabase
      .from("reservations")
      .insert({
        user_id: userId,
        bag_id,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: "confirmed", // Confirmada automáticamente para miembros activos
        total_amount: totalAmount,
        membership_type: userMembershipType, // Guardar tipo de membresía
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

    await notifyAdmin(
      `Nueva Reserva - ${bag.brand} ${bag.name}`,
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a4b;">Nueva Reserva</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Cliente:</strong> ${userProfile?.full_name || "N/A"}</p>
          <p><strong>Email:</strong> ${userProfile?.email || "N/A"}</p>
          <p><strong>Membresía:</strong> <span style="background: #1a1a4b; color: white; padding: 2px 8px; border-radius: 4px; text-transform: uppercase;">${userMembershipType}</span></p>
          <p><strong>Bolso:</strong> ${bag.brand} - ${bag.name}</p>
          <p><strong>Fechas:</strong> ${startDate.toLocaleDateString("es-ES")} - ${endDate.toLocaleDateString("es-ES")}</p>
          <p><strong>Duración:</strong> ${days} días</p>
          <p><strong>Monto adicional:</strong> ${totalAmount}€ ${totalAmount === 0 ? "(incluido en membresía)" : ""}</p>
          <p><strong>Estado:</strong> Confirmada</p>
        </div>
        ${bag.image_url ? `<img src="${bag.image_url}" alt="${bag.name}" style="max-width: 200px; border-radius: 8px;" />` : ""}
        <div style="margin-top: 20px;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://semzoprive.com"}/admin/reservations" style="background: #1a1a4b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Ver en Panel Admin</a>
        </div>
      </div>
      `,
    )

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

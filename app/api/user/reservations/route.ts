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
    console.log("[v0] Attempting to send admin notification to:", ADMIN_EMAIL)
    console.log("[v0] Subject:", subject)

    const { EmailServiceProduction } = await import("@/app/lib/email-service-production")
    const emailService = EmailServiceProduction.getInstance()

    const result = await emailService.sendWithResend({
      to: ADMIN_EMAIL,
      subject: `[Admin] ${subject}`,
      html: htmlContent,
      text: subject,
    })

    console.log(`[v0] Admin notification sent successfully to ${ADMIN_EMAIL}:`, subject, "Result:", result)
    return result
  } catch (error) {
    console.error("[v0] Error notifying admin:", error)
    throw error
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

  // Si es Privé, SOLO Privé puede acceder
  if (bag.membership?.toLowerCase() === "prive" && membership !== "prive") {
    throw new Error("Tu membresía no permite acceder a la colección Privé")
  }

  // Si es Signature, necesita Signature o Privé
  if (bag.membership?.toLowerCase() === "signature" && !["signature", "prive"].includes(membership)) {
    throw new Error("Tu membresía no permite acceder a la colección Signature")
  }

  // Si es L'Essentiel, necesita Essentiel, Signature o Privé
  if (bag.membership?.toLowerCase() === "essentiel" && !["essentiel", "signature", "prive"].includes(membership)) {
    throw new Error("Tu membresía no permite acceder a la colección L'Essentiel")
  }

  // Si tiene membresía activa del nivel correcto, no paga extra
  if (["signature", "prive", "essentiel"].includes(membership)) {
    return 0 // Ya paga con su membresía
  }

  // Free/Petite paga el precio del bolso (pero nunca llegará aquí para Privé)
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
      .select("full_name, email, membership_type, membership_status, can_make_reservations")
      .eq("id", userId)
      .single()

    if (profileError) {
      console.error("[v0] Error fetching user profile:", profileError)
      return NextResponse.json({ error: "Error al obtener perfil de usuario" }, { status: 500 })
    }

    const userMembershipType = userProfile?.membership_type || "free"
    const userMembershipStatus = userProfile?.membership_status
    const canMakeReservations = userProfile?.can_make_reservations

    console.log("[v0] User membership:", {
      type: userMembershipType,
      status: userMembershipStatus,
      canMakeReservations,
    })

    if (canMakeReservations === false) {
      return NextResponse.json(
        {
          error: "Tu cuenta no tiene permisos para hacer reservas. Contacta con soporte si crees que esto es un error.",
        },
        { status: 403 },
      )
    }

    const hasActiveMembership = ["active", "trialing"].includes(userMembershipStatus || "")
    const isFreeOrPetite = ["free", "petite"].includes(userMembershipType.toLowerCase())

    // Solo validar membresía activa si NO es Free/Petite
    if (!isFreeOrPetite && !hasActiveMembership) {
      return NextResponse.json(
        {
          error: "Necesitas una membresía activa para realizar reservas",
        },
        { status: 403 },
      )
    }

    const { data: bag, error: bagError } = await supabase
      .from("bags")
      .select(
        "id, name, brand, image_url, status, price, price_essentiel, price_signature, price_prive, membership_type",
      )
      .eq("id", bag_id)
      .single()

    console.log("[v0] Bag found:", bag, "Error:", bagError)

    if (bagError || !bag) {
      return NextResponse.json({ error: "Bolso no encontrado" }, { status: 404 })
    }

    const normalizedStatus = bag.status?.toLowerCase()
    if (normalizedStatus !== "available" && normalizedStatus !== "disponible") {
      console.log("[v0] Bag not available, status:", bag.status)
      return NextResponse.json({ error: "El bolso no está disponible en este momento" }, { status: 400 })
    }

    const bagTier = (bag.membership_type || "essentiel").toLowerCase()
    const userTier = userMembershipType.toLowerCase()

    console.log("[v0] Membership tier validation:", { bagTier, userTier })

    if (["free", "petite"].includes(userTier)) {
      if (bagTier === "prive") {
        return NextResponse.json(
          {
            error:
              "Este bolso de la colección Privé requiere una membresía Privé (189€/mes). Actualiza tu membresía para acceder a esta colección exclusiva.",
          },
          { status: 403 },
        )
      }

      if (bagTier === "signature") {
        return NextResponse.json(
          {
            error:
              "Este bolso de la colección Signature requiere una membresía Signature (129€/mes) o superior. Actualiza tu membresía para acceder.",
          },
          { status: 403 },
        )
      }

      if (bagTier === "essentiel") {
        return NextResponse.json(
          {
            error:
              "Este bolso de la colección L'Essentiel requiere una membresía L'Essentiel (59€/mes) o superior. Actualiza tu membresía para acceder.",
          },
          { status: 403 },
        )
      }
    } else {
      if (bagTier === "prive" && userTier !== "prive") {
        return NextResponse.json(
          {
            error: "Este bolso requiere membresía Privé. Actualiza tu membresía para acceder a esta colección.",
          },
          { status: 403 },
        )
      }

      if (bagTier === "signature" && !["signature", "prive"].includes(userTier)) {
        return NextResponse.json(
          {
            error: "Este bolso requiere membresía Signature o superior. Actualiza tu membresía para acceder.",
          },
          { status: 403 },
        )
      }

      if (bagTier === "essentiel" && !["essentiel", "signature", "prive"].includes(userTier)) {
        return NextResponse.json(
          {
            error: "Este bolso requiere membresía L'Essentiel o superior para reservar.",
          },
          { status: 403 },
        )
      }
    }

    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    let totalAmount = 0
    if (["essentiel", "signature", "prive"].includes(userTier)) {
      totalAmount = 0 // Membresías de pago: reservas incluidas
    } else {
      totalAmount = bag.price || 59 // Free/Petite: pagan precio por reserva
    }

    console.log("[v0] Creating reservation:", {
      userId,
      bag_id,
      days,
      totalAmount,
      membershipType: userMembershipType,
      bagTier,
    })

    const { data: reservation, error: createError } = await supabase
      .from("reservations")
      .insert({
        user_id: userId,
        bag_id,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: "confirmed",
        total_amount: totalAmount,
        membership_type: userMembershipType,
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

    await supabase.from("audit_logs").insert({
      user_id: userId,
      action: "reservation_created",
      entity_type: "reservation",
      entity_id: reservation.id,
      old_data: null,
      new_data: {
        bag_id,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: "confirmed",
        total_amount: totalAmount,
      },
      created_at: new Date().toISOString(),
    })

    await supabase.from("bags").update({ status: "rented", updated_at: new Date().toISOString() }).eq("id", bag_id)

    try {
      await notifyAdmin(
        `Nueva Reserva - ${bag.brand} ${bag.name}`,
        `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a4b;">Nueva Reserva Creada</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1a1a4b; margin-top: 0;">Información del Cliente</h3>
          <p><strong>Nombre:</strong> ${userProfile?.full_name || "N/A"}</p>
          <p><strong>Email:</strong> ${userProfile?.email || "N/A"}</p>
          <p><strong>Membresía:</strong> <span style="background: #1a1a4b; color: white; padding: 2px 8px; border-radius: 4px; text-transform: uppercase;">${userMembershipType}</span></p>
          
          <h3 style="color: #1a1a4b;">Detalles de la Reserva</h3>
          <p><strong>ID Reserva:</strong> ${reservation.id}</p>
          <p><strong>Bolso:</strong> ${bag.brand} - ${bag.name}</p>
          <p><strong>Fechas:</strong> ${startDate.toLocaleDateString("es-ES")} - ${endDate.toLocaleDateString("es-ES")}</p>
          <p><strong>Duración:</strong> ${days} días</p>
          <p><strong>Monto adicional:</strong> ${totalAmount}€ ${totalAmount === 0 ? "(incluido en membresía)" : ""}</p>
          <p><strong>Estado:</strong> <span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 4px;">Confirmada</span></p>
          <p><strong>Fecha de creación:</strong> ${new Date().toLocaleString("es-ES")}</p>
        </div>
        ${bag.image_url ? `<img src="${bag.image_url}" alt="${bag.name}" style="max-width: 200px; border-radius: 8px; margin: 20px 0;" />` : ""}
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://semzoprive.com"}/admin/reservations" style="background: #1a1a4b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Ver en Panel Admin</a>
        </div>
      </div>
      `,
      )
      console.log("[v0] Admin notification sent successfully for reservation:", reservation.id)
    } catch (adminEmailError) {
      console.error("[v0] FAILED to send admin notification:", adminEmailError)
    }

    try {
      const { EmailServiceProduction } = await import("@/app/lib/email-service-production")
      const emailService = EmailServiceProduction.getInstance()

      console.log("[v0] Sending user confirmation email to:", userProfile?.email)
      await emailService.sendReservationNotification({
        userEmail: userProfile?.email || "",
        userName: userProfile?.full_name || "Cliente",
        bagName: `${bag.brand} ${bag.name}`,
        reservationDate: startDate.toLocaleDateString("es-ES"),
        reservationId: reservation.id,
      })
      console.log("[v0] User confirmation email sent successfully")
    } catch (emailError) {
      console.error("[v0] FAILED to send user confirmation email:", emailError)
    }

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

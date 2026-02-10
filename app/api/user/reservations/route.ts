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

    const { bag_id, start_date, end_date, usePassId } = body

    if (!bag_id || !start_date || !end_date) {
      return NextResponse.json({ error: "Faltan campos requeridos: bag_id, start_date, end_date" }, { status: 400 })
    }

    const startDate = new Date(start_date)
    const endDate = new Date(end_date)

    if (startDate >= endDate) {
      return NextResponse.json({ error: "La fecha de inicio debe ser anterior a la fecha de fin" }, { status: 400 })
    }

    // Check membership_intents first (source of truth)
    const { data: activeIntent } = await supabase
      .from("membership_intents")
      .select("id, membership_type, status, activated_at, created_at")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    // Check user_memberships as secondary source
    const { data: userMembershipRecord } = await supabase
      .from("user_memberships")
      .select("membership_type, status, start_date")
      .eq("user_id", userId)
      .maybeSingle()

    // Get profile for email only
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .single()

    if (!userProfile) {
      return NextResponse.json({ error: "Error al obtener perfil de usuario" }, { status: 500 })
    }

    // Determine if user can rent: ONLY from membership_intents or user_memberships
    const canRent =
      activeIntent?.status === "active" ||
      userMembershipRecord?.status === "active"

    const effectivePlan =
      activeIntent?.membership_type || userMembershipRecord?.membership_type || "free"

    if (!canRent) {
      console.log("[v0] User cannot rent - no active membership found")
      return NextResponse.json(
        {
          error:
            "Tu membresía debe estar activa para realizar reservas. Completa la verificación de identidad o contacta con soporte.",
          membership_status: "inactive",
        },
        { status: 403 },
      )
    }

    console.log("[v0] User has active membership:", {
      plan: effectivePlan,
      fromIntent: !!activeIntent,
      fromUserMembership: !!userMembershipRecord,
    })

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

    const userMembershipPlan = effectivePlan
    const bagTier = (bag.membership_type || "essentiel").toLowerCase()

    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    // VALIDACION OBLIGATORIA DE PASES PARA PETITE
    // Petite: 30 días naturales, pases = cambios de bolso, máximo 4 pases en vigencia
    let passToUse: any = null

    if (userMembershipPlan === "petite") {
      // 1. Verificar que la membresía Petite esté vigente (30 días desde started_at)
      const membershipStartDate = activeIntent?.activated_at || activeIntent?.created_at || 
        userMembershipRecord?.start_date

      if (!membershipStartDate) {
        return NextResponse.json(
          { error: "No se encontró la fecha de inicio de tu membresía. Contacta soporte." },
          { status: 400 },
        )
      }

      const startedAt = new Date(membershipStartDate)
      const expiresAt = new Date(startedAt.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 días
      const now = new Date()

      if (now > expiresAt) {
        const expiredDaysAgo = Math.floor((now.getTime() - expiresAt.getTime()) / (1000 * 60 * 60 * 24))
        return NextResponse.json(
          {
            error: `Tu membresía Petite expiró hace ${expiredDaysAgo} día(s). Renueva para seguir disfrutando del servicio.`,
            membershipExpired: true,
            expiredAt: expiresAt.toISOString(),
          },
          { status: 403 },
        )
      }

      // 2. Contar pases usados en el período de 30 días de esta membresía
      const { count: usedPassesCount, error: countError } = await supabase
        .from("bag_passes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "used")
        .gte("used_at", startedAt.toISOString())
        .lte("used_at", expiresAt.toISOString())

      if (countError) {
        console.error("[v0] Error counting used passes:", countError)
      }

      const MAX_PASSES_PER_MEMBERSHIP = 4
      if ((usedPassesCount || 0) >= MAX_PASSES_PER_MEMBERSHIP) {
        return NextResponse.json(
          {
            error: `Has alcanzado el límite de ${MAX_PASSES_PER_MEMBERSHIP} cambios de bolso en tu membresía actual. Puedes renovar tu membresía cuando expire el ${expiresAt.toLocaleDateString("es-ES")}.`,
            maxPassesReached: true,
            usedPasses: usedPassesCount,
            maxPasses: MAX_PASSES_PER_MEMBERSHIP,
            membershipExpiresAt: expiresAt.toISOString(),
          },
          { status: 403 },
        )
      }

      // 3. Petite DEBE tener un pase disponible del tier correcto o superior
      const tierHierarchy: Record<string, number> = {
        lessentiel: 1,
        essentiel: 1,
        signature: 2,
        prive: 3,
      }

      const requiredTierLevel = tierHierarchy[bagTier] || 1

      // Buscar un pase disponible que cubra el tier del bolso
      const { data: availablePasses, error: passError } = await supabase
        .from("bag_passes")
        .select("id, pass_tier, status, expires_at, created_at")
        .eq("user_id", userId)
        .eq("status", "available")
        .order("created_at", { ascending: true })

      if (passError) {
        console.error("[v0] Error fetching passes:", passError)
        return NextResponse.json({ error: "Error al verificar pases disponibles" }, { status: 500 })
      }

      // Filtrar pases que cubren el tier requerido
      const validPasses = (availablePasses || []).filter((pass) => {
        const passTierLevel = tierHierarchy[pass.pass_tier?.toLowerCase()] || 1
        return passTierLevel >= requiredTierLevel
      })

      if (validPasses.length === 0) {
        const tierNames: Record<string, string> = {
          lessentiel: "L'Essentiel",
          essentiel: "L'Essentiel",
          signature: "Signature",
          prive: "Privé",
        }
        const requiredTierName = tierNames[bagTier] || bagTier
        const remainingPasses = MAX_PASSES_PER_MEMBERSHIP - (usedPassesCount || 0)

        return NextResponse.json(
          {
            error: `Necesitas un Pase de Bolso ${requiredTierName} para reservar este bolso. Te quedan ${remainingPasses} cambio(s) disponibles en tu membresía.`,
            needsPass: true,
            requiredTier: bagTier,
            remainingPasses,
            membershipExpiresAt: expiresAt.toISOString(),
          },
          { status: 403 },
        )
      }

      // Usar el primer pase válido disponible
      passToUse = validPasses[0]
      const remainingAfterThis = MAX_PASSES_PER_MEMBERSHIP - (usedPassesCount || 0) - 1
      console.log("[v0] Petite reservation:", {
        pass: passToUse.id,
        tier: passToUse.pass_tier,
        usedPasses: usedPassesCount,
        remainingAfter: remainingAfterThis,
        membershipExpires: expiresAt.toISOString(),
      })
    }

    // Membresías superiores (essentiel, signature, prive) tienen reservas incluidas
    // Verificar que el tier del bolso esté cubierto por la membresía
    if (["essentiel", "signature", "prive"].includes(userMembershipPlan)) {
      const tierHierarchy: Record<string, number> = {
        lessentiel: 1,
        essentiel: 1,
        signature: 2,
        prive: 3,
      }
      const userTierLevel = tierHierarchy[userMembershipPlan] || 0
      const bagTierLevel = tierHierarchy[bagTier] || 1

      if (bagTierLevel > userTierLevel) {
        const tierNames: Record<string, string> = {
          lessentiel: "L'Essentiel",
          essentiel: "L'Essentiel",
          signature: "Signature",
          prive: "Privé",
        }
        return NextResponse.json(
          {
            error: `Tu membresía ${userMembershipPlan} no incluye bolsos de la colección ${tierNames[bagTier]}. Puedes comprar un Pase de Bolso o actualizar tu membresía.`,
            needsUpgrade: true,
            requiredTier: bagTier,
          },
          { status: 403 },
        )
      }
    }

    // El precio siempre es 0 para membresías activas (el costo está en la membresía o el pase)
    const totalAmount = 0

    console.log("[v0] Creating reservation:", {
      userId,
      bag_id,
      days,
      totalAmount,
      membershipPlan: userMembershipPlan,
      bagTier,
      usingPass: passToUse?.id || null,
    })

    // IDEMPOTENCIA: Verificar si ya existe una reserva reciente del mismo usuario para el mismo bolso
    const { data: existingReservation } = await supabase
      .from("reservations")
      .select("id, created_at")
      .eq("user_id", userId)
      .eq("bag_id", bag_id)
      .gte("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .maybeSingle()

    if (existingReservation) {
      console.log("[v0] Duplicate reservation detected (idempotency), returning existing:", existingReservation.id)
      const { data: existingWithBag } = await supabase
        .from("reservations")
        .select("*, bags(id, name, brand, image_url)")
        .eq("id", existingReservation.id)
        .single()
      return NextResponse.json({ reservation: existingWithBag, message: "Reserva ya existente" })
    }

    // LLAMADA ATÓMICA AL RPC: locks + creación de reserva
    const passIdToConsume = passToUse?.id || usePassId
    
    console.log("[v0] Calling atomic RPC V3:", {
      user_id: userId,
      bag_id,
      pass_id: passIdToConsume,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    })

    const { data: reservationId, error: rpcError } = await supabase.rpc("create_reservation_atomic", {
      p_user_id: userId,
      p_bag_id: bag_id,
      p_pass_id: passIdToConsume || null,
      p_start_date: startDate.toISOString(),
      p_end_date: endDate.toISOString(),
    })

    if (rpcError) {
      console.error("[v0] RPC V3 error:", rpcError)
      
      // Mapear errores específicos del RPC
      const errorMsg = rpcError.message || ""
      
      if (errorMsg.includes("BAG_NOT_AVAILABLE")) {
        return NextResponse.json(
          { error: "El bolso ya no está disponible. Alguien más lo reservó." },
          { status: 409 },
        )
      }
      
      if (errorMsg.includes("PASS_NOT_AVAILABLE")) {
        return NextResponse.json(
          { error: "El pase ya no está disponible. Por favor, intenta con otro pase." },
          { status: 409 },
        )
      }
      
      // Otros errores técnicos
      return NextResponse.json(
        { error: "Error al crear la reserva", details: errorMsg },
        { status: 500 },
      )
    }

    if (!reservationId) {
      console.error("[v0] RPC returned null reservation ID")
      return NextResponse.json(
        { error: "Error al crear la reserva: ID inválido" },
        { status: 500 },
      )
    }
    
    console.log("[v0] Reservation created via RPC V3:", reservationId)

    // Obtener la reserva completa con información del bolso
    const { data: reservation, error: fetchError } = await supabase
      .from("reservations")
      .select(`
        *,
        bags (
          id,
          name,
          brand,
          image_url
        )
      `)
      .eq("id", reservationId)
      .single()

    if (fetchError || !reservation) {
      console.error("[v0] Error fetching created reservation:", fetchError)
      return NextResponse.json(
        { error: "Reserva creada pero no se pudo recuperar", details: fetchError?.message },
        { status: 500 },
      )
    }

    console.log("[v0] New reservation created successfully:", reservation.id)

    // POST-PROCESAMIENTO: Actualizar contador de pases disponibles
    if (passIdToConsume) {
      // El pase ya fue marcado como usado por el RPC
      // Solo actualizamos el contador en profiles
      const { data: passCount } = await supabase.rpc("count_available_passes", { p_user_id: userId })
      if (passCount !== null) {
        await supabase.from("profiles").update({ available_passes_count: passCount }).eq("id", userId)
      }
    }

    try {
      await supabase.from("audit_log").insert({
        user_id: userId,
        action: "reservation_created",
        entity_type: "reservation",
        entity_id: reservation.id,
        old_data: {},
        new_data: {
          bag_id,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status: "confirmed",
          total_amount: totalAmount,
          used_pass_id: usePassId,
        },
        created_at: new Date().toISOString(),
      })
    } catch (auditError) {
      console.error("[v0] Audit log error (non-critical):", auditError)
    }

    // Bolso ya fue marcado como rented en PASO 2 (lock optimista)

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
          <p><strong>Membresía:</strong> <span style="background: #1a1a4b; color: white; padding: 2px 8px; border-radius: 4px; text-transform: uppercase;">${userProfile.membership_plan}</span></p>
          
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

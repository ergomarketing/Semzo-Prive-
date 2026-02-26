import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

// CRITICAL: No cache - user-specific authenticated data
export const dynamic = "force-dynamic"

/**
 * CANONICAL DASHBOARD ENDPOINT - SINGLE SOURCE OF TRUTH
 * Este endpoint es la ÚNICA fuente de datos del dashboard.
 * Toda la lógica de negocio se calcula aquí, NO en el frontend.
 */
export async function GET() {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  try {
    // 1. PROFILE - Información personal
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    const emailComplete = !profile?.email?.endsWith("@phone.semzoprive.com")

    // 2. MEMBERSHIP - Estado de membresía (ÚNICA source of truth: user_memberships)
    const { data: activeMembership } = await supabase
      .from("user_memberships")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    // user_memberships es la UNICA fuente de verdad
    const membershipType = activeMembership?.membership_type || null
    const membershipStatus = activeMembership ? "active" : "inactive"

    // Identity se valida aparte desde profiles
    const needsVerification = activeMembership && profile?.identity_verified === false

    // Calcular fechas de membresía
    let membershipStartedAt = null
    let membershipEndsAt = null

    if (activeMembership) {
      membershipStartedAt = activeMembership.created_at
        
      // Para Petite: 30 días desde activación
      if (membershipType === "petite" && activeMembership.ends_at) {
        membershipEndsAt = activeMembership.ends_at
      }
      // Para otras membresías: ends_at puede ser null (lifetime)
      else if (activeMembership.ends_at) {
        membershipEndsAt = activeMembership.ends_at
      }
    }

    // 3. PASSES - Pases disponibles por tier
    const { data: availablePasses } = await supabase
      .from("bag_passes")
      .select("pass_tier")
      .eq("user_id", user.id)
      .eq("status", "available")

    const passesByTier = {
      lessentiel: 0,
      signature: 0,
      prive: 0,
    }

    availablePasses?.forEach((pass) => {
      const tier = pass.pass_tier?.toLowerCase()
      if (tier === "lessentiel" || tier === "essentiel") {
        passesByTier.lessentiel++
      } else if (tier === "signature") {
        passesByTier.signature++
      } else if (tier === "prive" || tier === "privé") {
        passesByTier.prive++
      }
    })

    const totalAvailablePasses = passesByTier.lessentiel + passesByTier.signature + passesByTier.prive

    // Para Petite: contar pases usados en el período de vigencia
    let usedPassesInPeriod = 0
    if (membershipType === "petite" && membershipStartedAt && membershipEndsAt) {
      const { count } = await supabase
        .from("bag_passes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "used")
        .gte("used_at", membershipStartedAt)
        .lte("used_at", membershipEndsAt)

      usedPassesInPeriod = count || 0
    }

    // 4. RESERVATIONS - Reservas activas e historial
    const { count: activeReservations } = await supabase
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", ["pending", "confirmed", "active"])

    const { count: totalReservations } = await supabase
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)

    // 5. GIFT CARDS - Saldo total disponible
    // Estrategia optimizada: 2 queries en paralelo, luego deduplicar
    const [{ data: directGiftCards }, { data: intentGiftCardIds }] = await Promise.all([
      supabase
        .from("gift_cards")
        .select("id, amount")
        .eq("used_by", user.id)
        .eq("status", "active")
        .gt("amount", 0),
      supabase
        .from("membership_intents")
        .select("gift_card_id")
        .eq("user_id", user.id)
        .not("gift_card_id", "is", null),
    ])

    // Si hay gift cards asociados a intents, obtenerlos
    let intentGiftCards: any[] = []
    const gcIds = (intentGiftCardIds || []).map((i) => i.gift_card_id).filter(Boolean)
    if (gcIds.length > 0) {
      const { data } = await supabase
        .from("gift_cards")
        .select("id, amount")
        .in("id", gcIds)
        .eq("status", "active")
        .gt("amount", 0)
      intentGiftCards = data || []
    }

    // Deduplicar: misma card puede estar via used_by Y via intent
    const allCards = [...(directGiftCards || []), ...intentGiftCards]
    const uniqueGiftCards = allCards.filter(
      (card, index, self) => index === self.findIndex((c) => c.id === card.id),
    )

    // IMPORTANTE: amount está en centavos, convertir a euros
    const totalGiftCardBalance = uniqueGiftCards.reduce((sum, card) => sum + (card.amount || 0), 0) / 100

    // 6. FLAGS - Banderas de estado calculadas en backend
    // needsEmail: true si no tiene email real (null, vacio, o placeholder)
    // NUNCA bloquea reservas ni pagos, solo muestra aviso informativo
    const hasRealEmail = !!profile?.email && 
      !profile.email.endsWith("@phone.semzoprive.com") && 
      profile.email.includes("@")
    const needsEmail = !hasRealEmail
    // canReserve NO depende de email - usuarios SMS pueden reservar
    const canReserve = membershipStatus === "active" && totalAvailablePasses > 0

    // Verificar si la membresía Petite expiró
    const isPetiteExpired =
      membershipType === "petite" && membershipEndsAt && new Date() > new Date(membershipEndsAt)

    // RESPUESTA CANÓNICA - Todo calculado en backend
    return NextResponse.json({
      profile: {
        first_name: profile?.first_name || profile?.full_name?.split(" ")[0] || "",
        last_name: profile?.last_name || profile?.full_name?.split(" ").slice(1).join(" ") || "",
        email: profile?.email || "",
        email_complete: emailComplete,
        phone: profile?.phone || "",
        auth_method: profile?.auth_method || null,
      },
      membership: {
        type: membershipType,
        status: isPetiteExpired ? "expired" : membershipStatus,
        needs_verification: needsVerification,
        started_at: membershipStartedAt,
        ends_at: membershipEndsAt,
        petite_passes_used: membershipType === "petite" ? usedPassesInPeriod : null,
        petite_passes_max: membershipType === "petite" ? 4 : null,
      },
      passes: {
        available: totalAvailablePasses,
        by_tier: passesByTier,
      },
      reservations: {
        active: activeReservations || 0,
        history: totalReservations || 0,
      },
      gift_cards: {
        total_balance: Math.round(totalGiftCardBalance * 100) / 100, // 2 decimales
      },
      flags: {
        needs_email: needsEmail,
        needs_verification: needsVerification,
        can_reserve: canReserve,
        is_petite_expired: isPetiteExpired,
      },
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching dashboard data:", error)
    return NextResponse.json({ error: "Error al cargar datos del dashboard" }, { status: 500 })
  }
}

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
    // Buscar cualquier membresia reciente del usuario, no solo activas,
    // para poder guiar al usuario a completar pasos pendientes (Identity, SEPA).
    const { data: anyMembership } = await supabase
      .from("user_memberships")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    // Una membresía cancelada con end_date futuro mantiene acceso. Por eso
    // consideramos "con acceso efectivo" no solo a status='active' sino también
    // a cancelling/cancelled mientras end_date sea futuro.
    const membershipEndDateRaw = anyMembership?.end_date || (anyMembership as any)?.ends_at || null
    const hasFutureEnd = membershipEndDateRaw
      ? new Date(membershipEndDateRaw).getTime() > Date.now()
      : false

    const accessGrantingStatuses = ["active", "cancelling", "cancelled", "canceled", "past_due"]
    const hasEffectiveAccess =
      !!anyMembership &&
      accessGrantingStatuses.includes(anyMembership.status) &&
      (anyMembership.status === "active" ? true : hasFutureEnd)

    // activeMembership: la membresía con derecho efectivo de uso (no solo active)
    const activeMembership = hasEffectiveAccess ? anyMembership : null

    // user_memberships es la UNICA fuente de verdad
    const membershipType = anyMembership?.membership_type || null
    // Exponer el estado real (active, pending_verification, pending_sepa, etc.)
    // para que el frontend pueda redirigir al paso pendiente.
    const membershipStatus = anyMembership?.status || "inactive"
    const billingCycle = (anyMembership as any)?.billing_cycle || "monthly"

    // Identity: leer de identity_verifications (FUENTE DE VERDAD)
    const { data: identityRecord } = await supabase
      .from("identity_verifications")
      .select("status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    const isIdentityVerified =
      identityRecord?.status === "verified" || identityRecord?.status === "approved"
    const needsVerification = activeMembership && !isIdentityVerified

    // Calcular fechas de membresía. La BD usa start_date/end_date como
    // canónico; ends_at queda como fallback para registros antiguos.
    let membershipStartedAt: string | null = null
    let membershipEndsAt: string | null = null

    if (anyMembership) {
      membershipStartedAt =
        (anyMembership as any).start_date ||
        (anyMembership as any).started_at ||
        anyMembership.created_at ||
        null
      membershipEndsAt =
        (anyMembership as any).end_date || (anyMembership as any).ends_at || null
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
    // canReserve: requiere acceso efectivo (no solo active) y reglas de pases para Petite.
    // Para Petite exige pases disponibles. Para otros planes, acceso vigente y can_make_reservations.
    const canMakeReservationsFlag =
      (anyMembership as any)?.can_make_reservations !== false // default true si no existe el campo
    const canReserve = hasEffectiveAccess && canMakeReservationsFlag &&
      (membershipType === "petite" ? totalAvailablePasses > 0 : true)

    // Verificar si la membresía Petite expiró
    const isPetiteExpired =
      membershipType === "petite" && membershipEndsAt && new Date() > new Date(membershipEndsAt)

    // ui_status: estado normalizado para la UI (incluye cancelled_active)
    let uiStatus: string = "inactive"
    if (membershipStatus === "active") uiStatus = "active"
    else if (membershipStatus === "paused") uiStatus = "paused"
    else if (membershipStatus === "past_due") uiStatus = "past_due"
    else if (["cancelling", "cancelled", "canceled"].includes(membershipStatus)) {
      uiStatus = hasFutureEnd ? "cancelled_active" : "cancelled"
    } else if (membershipStatus === "pending_sepa") uiStatus = "pending_sepa"
    else if (
      membershipStatus === "pending_verification" ||
      membershipStatus === "paid_pending_verification"
    )
      uiStatus = "pending_verification"
    else if (membershipStatus === "initiated") uiStatus = "pending_payment"
    else if (membershipStatus === "expired" || isPetiteExpired) uiStatus = "expired"

    // RESPUESTA CANÓNICA - Todo calculado en backend
    return NextResponse.json({
      profile: {
        first_name: profile?.first_name || profile?.full_name?.split(" ")[0] || "",
        last_name: profile?.last_name || profile?.full_name?.split(" ").slice(1).join(" ") || "",
        email: profile?.email || "",
        email_complete: emailComplete,
        phone: profile?.phone || "",
        auth_method: profile?.auth_method || null,
        // Datos de envio para que el dashboard muestre "Configurada" cuando existan
        shipping_address: profile?.shipping_address || null,
        shipping_city: profile?.shipping_city || null,
        shipping_postal_code: profile?.shipping_postal_code || null,
        shipping_phone: profile?.shipping_phone || null,
        shipping_country: profile?.shipping_country || null,
      },
      membership: {
        type: membershipType,
        // Exponer el estado real del DB para que el dashboard pueda redirigir
        // a Identity / SEPA cuando corresponda.
        //
        // PRIORIDAD: un impago (past_due) es un problema de cobro que SIEMPRE
        // debe mostrar el aviso de pago, aunque el periodo Petite ya haya
        // vencido. Sin esta prioridad, isPetiteExpired convertía past_due en
        // "expired" y el banner de pago no aparecía nunca.
        status:
          membershipStatus === "past_due"
            ? "past_due"
            : isPetiteExpired
              ? "expired"
              : membershipStatus,
        raw_status: anyMembership?.status || null,
        ui_status: uiStatus,
        billing_cycle: billingCycle, // 'monthly' | 'quarterly'
        has_effective_access: hasEffectiveAccess,
        needs_verification: needsVerification,
        started_at: membershipStartedAt,
        ends_at: membershipEndsAt,
        // Alias canónicos (la BD usa start_date/end_date)
        start_date: membershipStartedAt,
        end_date: membershipEndsAt,
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

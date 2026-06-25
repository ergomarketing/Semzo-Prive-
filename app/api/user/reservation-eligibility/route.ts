import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { canCreateReservations, isReservationOngoing } from "@/lib/membership-state-mapper"

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Missing Supabase configuration")
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function getAuthenticatedUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      },
    )
    const {
      data: { user },
      error,
    } = await supabaseAuth.auth.getUser()
    if (error || !user) return null
    return user.id
  } catch {
    return null
  }
}

const REASON_MESSAGES: Record<string, string> = {
  status_past_due: "Tienes un pago pendiente. Regulariza tu membresía para poder reservar.",
  status_unpaid: "Tienes un pago pendiente. Regulariza tu membresía para poder reservar.",
  status_paused: "Tu membresía está pausada. Reactívala para reservar.",
  status_expired: "Tu membresía expiró. Renueva para seguir reservando.",
  status_incomplete_expired: "Tu membresía expiró. Renueva para seguir reservando.",
  status_initiated: "Tu membresía aún se está activando. Espera unos minutos.",
  end_date_passed: "Tu membresía expiró. Renueva para seguir reservando.",
  can_make_reservations_false: "Tu membresía no permite reservar en este momento.",
  no_membership: "Necesitas una membresía activa para reservar.",
  bag_in_possession:
    "Tienes un bolso en curso. Devuélvelo desde tu dashboard antes de reservar otro.",
}

/**
 * GET - Fuente unica de verdad para saber si la socia puede reservar/comprar
 * un pase AHORA. Aplica las dos reglas de negocio:
 *   1. No morosa (past_due/unpaid), expirada ni pausada.
 *   2. No tener ya un bolso en posesion (reserva no completada/cancelada).
 *
 * Lo usa el frontend para bloquear ANTES de llegar al carrito/checkout.
 */
export async function GET(_request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return NextResponse.json(
        { allowed: false, reason: "not_authenticated", message: "Inicia sesión para reservar." },
        { status: 401 },
      )
    }

    const supabase = getSupabase()

    // Regla 1: elegibilidad de membresia (misma logica que el resto de gates).
    // IMPORTANTE: si NO existe ninguna membresia, NO bloqueamos: es una socia
    // nueva en proceso de comprar su primera membresia/pase. El gate solo
    // aplica a membresias EXISTENTES que esten en mal estado (morosa, etc.).
    const { data: membership } = await supabase
      .from("user_memberships")
      .select("status, end_date, can_make_reservations")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (membership) {
      const eligibility = canCreateReservations({
        status: membership.status,
        can_make_reservations: (membership as any).can_make_reservations,
        end_date: membership.end_date,
      })

      if (!eligibility.allowed) {
        return NextResponse.json({
          allowed: false,
          reason: eligibility.reason,
          message: REASON_MESSAGES[eligibility.reason || ""] || "Tu membresía no permite reservar.",
        })
      }
    }

    // Regla 2: bolso en posesion (reserva en curso). Aplica SIEMPRE, tenga o
    // no membresia activa: si hay un bolso sin devolver, no puede reservar otro.
    const { data: reservations } = await supabase
      .from("reservations")
      .select("status")
      .eq("user_id", userId)

    const hasOngoing = (reservations || []).some((r) => isReservationOngoing(r.status))

    if (hasOngoing) {
      return NextResponse.json({
        allowed: false,
        reason: "bag_in_possession",
        message: REASON_MESSAGES.bag_in_possession,
      })
    }

    return NextResponse.json({ allowed: true })
  } catch (error) {
    return NextResponse.json(
      {
        allowed: false,
        reason: "server_error",
        message: "No se pudo verificar tu elegibilidad. Inténtalo de nuevo.",
        details: error instanceof Error ? error.message : "unknown",
      },
      { status: 500 },
    )
  }
}

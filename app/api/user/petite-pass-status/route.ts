import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export const dynamic = "force-dynamic"

/**
 * Devuelve el estado del pase Petite activo de la socia logueada.
 * Lo usa el dashboard para mostrar el banner de vencimiento.
 */
export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ has_active_pass: false, debug: "no_user" }, { status: 401 })
  }

  console.log("[v0] petite-pass-status user.id:", user.id)

  // Reserva activa con pase Petite (usar service role para evitar RLS)
  const { createClient: createServiceClient } = await import("@supabase/supabase-js")
  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: reservation, error: queryError } = await supabaseAdmin
    .from("reservations")
    .select(`
      id,
      bag_id,
      status,
      delivered_at,
      pass_expires_at,
      bag_pass_id,
      bags!reservations_bag_id_fkey ( name, brand )
    `)
    .eq("user_id", user.id)
    .not("bag_pass_id", "is", null)
    .not("pass_expires_at", "is", null)
    // Solo reservas en curso. Excluye cancelled y completed para que el banner
    // desaparezca una vez logistica confirma la devolucion fisica (completed).
    .in("status", ["pending", "confirmed", "active", "overdue"])
    .order("pass_expires_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  console.log("[v0] petite-pass-status query:", { reservation, queryError, userId: user.id })

  if (!reservation) {
    return NextResponse.json({ has_active_pass: false, debug: "no_reservation", user_id: user.id })
  }

  const now = new Date()
  const expiresAt = (reservation as any).pass_expires_at
    ? new Date((reservation as any).pass_expires_at)
    : null

  let state: "pending_delivery" | "active" | "expiring_soon" | "expired" = "pending_delivery"
  let daysRemaining: number | null = null

  if (expiresAt) {
    const diffMs = expiresAt.getTime() - now.getTime()
    daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    if (diffMs <= 0) state = "expired"
    else if (daysRemaining <= 2) state = "expiring_soon"
    else state = "active"
  }

  const bag: any = (reservation as any).bags

  return NextResponse.json({
    has_active_pass: true,
    reservation_id: (reservation as any).id,
    bag_name: bag ? `${bag.brand || ""} ${bag.name || ""}`.trim() : null,
    delivered_at: (reservation as any).delivered_at,
    pass_expires_at: (reservation as any).pass_expires_at,
    state,
    days_remaining: daysRemaining,
  })
}

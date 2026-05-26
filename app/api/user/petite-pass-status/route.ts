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
    return NextResponse.json({ has_active_pass: false }, { status: 401 })
  }

  // Reserva activa con pase Petite
  const { data: reservation } = await supabase
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
    .in("status", ["confirmed", "active"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!reservation) {
    return NextResponse.json({ has_active_pass: false })
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

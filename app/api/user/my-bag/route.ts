import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/user/my-bag
 *
 * Devuelve el bolso actualmente en posesion de la socia + su modo de ownership
 * (discover | collect) y el progreso acumulado si aplica.
 *
 * Logica:
 *  1. Busca la reserva activa mas reciente del usuario.
 *  2. Busca el ownership_progress activo asociado a ese bolso.
 *     - Si no existe (bolsos reservados antes de Fase 3), asume "discover".
 *  3. Devuelve datos consolidados para la card del dashboard.
 *
 * NO modifica datos. Solo lectura.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // 1. Reserva activa mas reciente (active | confirmed)
    const { data: reservation, error: resError } = await supabase
      .from("reservations")
      .select(`
        id,
        bag_id,
        status,
        start_date,
        end_date,
        bags (
          id,
          name,
          brand,
          image_url,
          purchase_price,
          authenticity_certificate_url
        )
      `)
      .eq("user_id", user.id)
      .in("status", ["active", "confirmed"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (resError) {
      console.error("[v0] my-bag: error fetching reservation:", resError)
    }

    if (!reservation || !reservation.bag_id) {
      return NextResponse.json({ hasBag: false })
    }

    const bag = Array.isArray(reservation.bags) ? reservation.bags[0] : reservation.bags
    if (!bag) {
      return NextResponse.json({ hasBag: false })
    }

    // 2. ownership_progress activo para este user + bag
    const { data: progress } = await supabase
      .from("ownership_progress")
      .select("id, mode, purchase_price, accumulated, status, started_at")
      .eq("user_id", user.id)
      .eq("bag_id", reservation.bag_id)
      .eq("status", "active")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    const mode: "discover" | "collect" = progress?.mode === "collect" ? "collect" : "discover"

    return NextResponse.json({
      hasBag: true,
      reservation: {
        id: reservation.id,
        status: reservation.status,
        start_date: reservation.start_date,
        end_date: reservation.end_date,
      },
      bag: {
        id: bag.id,
        name: bag.name,
        brand: bag.brand,
        image_url: bag.image_url,
        purchase_price: bag.purchase_price != null ? Number(bag.purchase_price) : null,
        authenticity_certificate_url: bag.authenticity_certificate_url || null,
      },
      ownership: {
        mode,
        accumulated: progress?.accumulated != null ? Number(progress.accumulated) : 0,
        purchase_price_snapshot:
          progress?.purchase_price != null ? Number(progress.purchase_price) : null,
        started_at: progress?.started_at || null,
        progress_id: progress?.id || null,
      },
    })
  } catch (error) {
    console.error("[v0] my-bag: unexpected error:", error)
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 })
  }
}

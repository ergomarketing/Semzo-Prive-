import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

/**
 * GET /api/admin/logistics/pending-shipments
 * Devuelve reservas confirmadas/activas que aun NO tienen shipment creado.
 * Incluye los datos del cliente (profiles.shipping_*) para autopoblar el modal
 * de creacion de envios en el panel de Logistica.
 */
export async function GET() {
  try {
    // 1. IDs de reservas que YA tienen shipment (para excluirlas)
    const { data: existingShipments, error: shipErr } = await supabase
      .from("shipments")
      .select("reservation_id")
      .not("reservation_id", "is", null)

    if (shipErr) {
      console.error("[pending-shipments] error fetching existing shipments:", shipErr)
    }

    const usedReservationIds = (existingShipments || [])
      .map((s) => s.reservation_id)
      .filter(Boolean) as string[]

    // 2. Reservas activas/confirmadas
    let query = supabase
      .from("reservations")
      .select(
        `
          id,
          user_id,
          status,
          start_date,
          end_date,
          created_at,
          bags!reservations_bag_id_fkey ( id, name, brand ),
          profiles!reservations_user_id_fkey (
            id,
            email,
            full_name,
            shipping_address,
            shipping_city,
            shipping_postal_code,
            shipping_phone,
            shipping_country
          )
        `,
      )
      .in("status", ["confirmed", "active", "pending"])
      .order("created_at", { ascending: false })
      .limit(50)

    if (usedReservationIds.length > 0) {
      query = query.not("id", "in", `(${usedReservationIds.join(",")})`)
    }

    const { data, error } = await query

    if (error) {
      console.error("[pending-shipments] error fetching reservations:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] })
  } catch (err: any) {
    console.error("[pending-shipments] unexpected:", err?.message)
    return NextResponse.json(
      { error: err?.message || "Internal error" },
      { status: 500 },
    )
  }
}

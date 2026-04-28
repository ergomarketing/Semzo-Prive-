import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

/**
 * GET /api/admin/logistics/pending-shipments
 * Devuelve reservas confirmadas/activas que aun NO tienen shipment creado.
 * Usa queries separadas (no embeds PostgREST) para evitar problemas con FKs
 * que apuntan a auth.users en lugar de profiles.
 */
export async function GET() {
  try {
    // 1. Reservation IDs que ya tienen shipment (excluir)
    const { data: existingShipments } = await supabase
      .from("shipments")
      .select("reservation_id")
      .not("reservation_id", "is", null)

    const usedReservationIds = (existingShipments || [])
      .map((s: any) => s.reservation_id)
      .filter(Boolean) as string[]

    // 2. Reservas activas/confirmadas/pending sin embed
    let resQuery = supabase
      .from("reservations")
      .select("id, user_id, bag_id, status, start_date, end_date, created_at")
      .in("status", ["confirmed", "active", "pending"])
      .order("created_at", { ascending: false })
      .limit(50)

    if (usedReservationIds.length > 0) {
      resQuery = resQuery.not("id", "in", `(${usedReservationIds.join(",")})`)
    }

    const { data: reservations, error: resErr } = await resQuery

    if (resErr) {
      console.error("[pending-shipments] reservations error:", resErr)
      return NextResponse.json({ error: resErr.message }, { status: 500 })
    }

    if (!reservations || reservations.length === 0) {
      return NextResponse.json({ data: [] })
    }

    // 3. Datos de bolsos en paralelo
    const bagIds = Array.from(
      new Set(reservations.map((r: any) => r.bag_id).filter(Boolean)),
    )
    const userIds = Array.from(
      new Set(reservations.map((r: any) => r.user_id).filter(Boolean)),
    )

    const [bagsRes, profilesRes] = await Promise.all([
      bagIds.length > 0
        ? supabase.from("bags").select("id, name, brand").in("id", bagIds)
        : Promise.resolve({ data: [], error: null } as any),
      userIds.length > 0
        ? supabase
            .from("profiles")
            .select(
              "id, email, full_name, shipping_address, shipping_city, shipping_postal_code, shipping_phone, shipping_country",
            )
            .in("id", userIds)
        : Promise.resolve({ data: [], error: null } as any),
    ])

    if (bagsRes.error) console.error("[pending-shipments] bags error:", bagsRes.error)
    if (profilesRes.error) console.error("[pending-shipments] profiles error:", profilesRes.error)

    const bagsById = new Map<string, any>((bagsRes.data || []).map((b: any) => [b.id, b]))
    const profilesById = new Map<string, any>((profilesRes.data || []).map((p: any) => [p.id, p]))

    const result = reservations.map((r: any) => ({
      id: r.id,
      user_id: r.user_id,
      status: r.status,
      start_date: r.start_date,
      end_date: r.end_date,
      created_at: r.created_at,
      bags: bagsById.get(r.bag_id) || null,
      profiles: profilesById.get(r.user_id) || null,
    }))

    return NextResponse.json({ data: result })
  } catch (err: any) {
    console.error("[pending-shipments] unexpected:", err?.message)
    return NextResponse.json(
      { error: err?.message || "Internal error" },
      { status: 500 },
    )
  }
}

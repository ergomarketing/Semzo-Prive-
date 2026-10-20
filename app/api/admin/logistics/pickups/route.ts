import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireAdminAuth } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

/**
 * GET /api/admin/logistics/pickups
 * Recogidas a domicilio que la socia ha solicitado desde su panel y que aun no se han confirmado
 * (hay que pedirlas en la web de Correos y despues avisar a la socia).
 */
export async function GET(request: NextRequest) {
  const authError = await requireAdminAuth(request)
  if (authError) return authError

  const { data, error } = await supabase
    .from("returns")
    .select(
      `
      id, notes, created_at, status,
      shipments!returns_shipment_id_fkey (
        id, pickup_date, pickup_slot, pickup_confirmed_at, return_tracking_number,
        reservations!shipments_reservation_id_fkey (
          id, status,
          profiles!reservations_user_id_fkey ( full_name, email ),
          bags!reservations_bag_id_fkey ( name, brand )
        )
      )
    `,
    )
    .eq("return_carrier", "pickup")
    .neq("status", "cancelled")
    .order("created_at", { ascending: false })
    .limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const pickups = (data || [])
    .map((row: any) => {
      const shipment = Array.isArray(row.shipments) ? row.shipments[0] : row.shipments
      const reservation = Array.isArray(shipment?.reservations) ? shipment?.reservations[0] : shipment?.reservations
      const profile = Array.isArray(reservation?.profiles) ? reservation?.profiles[0] : reservation?.profiles
      const bag = Array.isArray(reservation?.bags) ? reservation?.bags[0] : reservation?.bags
      return {
        return_id: row.id,
        shipment_id: shipment?.id ?? null,
        pickup_date: shipment?.pickup_date ?? null,
        pickup_slot: shipment?.pickup_slot ?? null,
        confirmed_at: shipment?.pickup_confirmed_at ?? null,
        notes: row.notes,
        reservation_status: reservation?.status ?? null,
        member: profile?.full_name || profile?.email || "—",
        email: profile?.email || null,
        bag: bag ? `${bag.brand || ""} ${bag.name || ""}`.trim() : "—",
      }
    })
    .filter((p) => !p.confirmed_at && ["active", "overdue", "confirmed"].includes(p.reservation_status || ""))

  return NextResponse.json({ pickups })
}

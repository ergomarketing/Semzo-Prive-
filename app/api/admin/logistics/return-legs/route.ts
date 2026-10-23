import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireAdminAuth } from "@/lib/admin-auth"
import { isReturnWindowOpen } from "@/lib/return-window"

export const dynamic = "force-dynamic"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

/**
 * GET /api/admin/logistics/return-legs
 *
 * Devoluciones EN CAMINO o por verificar: envios con etiqueta de devolucion de Correos cuya reserva sigue abierta
 * (active / overdue / confirmed) y esta a punto de vencer o vencida (la etiqueta de vuelta existe desde el primer dia). No dependen de la tabla "returns" (que solo se rellena si la socia pulsa
 * "devolver" en su panel): el seguimiento de Correos de la ida y la vuelta vive en shipments.
 */
export async function GET(request: NextRequest) {
  const authError = await requireAdminAuth(request)
  if (authError) return authError

  const { data, error } = await supabase
    .from("shipments")
    .select(
      `
      id,
      reservation_id,
      return_tracking_number,
      return_status,
      updated_at,
      reservations!shipments_reservation_id_fkey (
        id,
        status,
        end_date,
        profiles!reservations_user_id_fkey ( full_name, email ),
        bags!reservations_bag_id_fkey ( name, brand )
      )
    `,
    )
    .not("return_tracking_number", "is", null)
    .order("updated_at", { ascending: false })
    .limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const legs = (data || [])
    .map((row: any) => {
      const reservation = Array.isArray(row.reservations) ? row.reservations[0] : row.reservations
      const profile = Array.isArray(reservation?.profiles) ? reservation?.profiles[0] : reservation?.profiles
      const bag = Array.isArray(reservation?.bags) ? reservation?.bags[0] : reservation?.bags
      return {
        shipment_id: row.id,
        reservation_id: row.reservation_id,
        reservation_status: reservation?.status ?? null,
        end_date: reservation?.end_date ?? null,
        return_tracking_number: row.return_tracking_number,
        return_status: row.return_status,
        updated_at: row.updated_at,
        member: profile?.full_name || profile?.email || "—",
        email: profile?.email || null,
        bag: bag ? `${bag.brand || ""} ${bag.name || ""}`.trim() : "—",
      }
    })
    .filter((leg) => ["active", "overdue", "confirmed"].includes(leg.reservation_status || ""))
    // La etiqueta de vuelta existe desde el primer dia: solo se lista cuando el bolso puede estar volviendo
    // (reserva a punto de vencer o vencida) o Correos ya la dio por entregada.
    .filter((leg) => leg.return_status === "delivered" || isReturnWindowOpen(leg.end_date, leg.reservation_status))

  return NextResponse.json({ legs })
}

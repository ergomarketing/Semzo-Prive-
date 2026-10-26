import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireAdminAuth } from "@/lib/admin-auth"
import { closeReservationOnReturnReceived } from "@/lib/return-close"

export const dynamic = "force-dynamic"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

/**
 * POST /api/admin/logistics/return-legs/receive  { reservation_id }
 *
 * "Recibida y verificada": Erika confirma que ha recibido el bolso correcto. Cierra la reserva, libera el bolso,
 * avisa a la lista de espera, activa el proximo bolso en cola si lo hay y manda a la socia el correo de devolucion
 * recibida. Marca la etiqueta de devolucion como entregada.
 */
export async function POST(request: NextRequest) {
  const authError = await requireAdminAuth(request)
  if (authError) return authError

  try {
    const body = await request.json().catch(() => ({}))
    const reservationId = String(body?.reservation_id || "")
    if (!reservationId) return NextResponse.json({ error: "Falta reservation_id" }, { status: 400 })

    const result = await closeReservationOnReturnReceived(supabase, reservationId)
    if (!result.closed) {
      return NextResponse.json(
        { error: "Esa reserva ya no está en curso (¿ya se cerró?)", reason: result.reason },
        { status: 409 },
      )
    }

    const now = new Date().toISOString()
    // Cerrar tambien el rastro de la devolucion: el envio (etiqueta de Correos o recogida a domicilio, que no
    // tiene numero de seguimiento) y la fila de "returns" que ve Logistica -> Devoluciones. Sin esto la
    // devolucion verificada seguia saliendo como "Pendiente".
    const { data: shipmentRows } = await supabase
      .from("shipments")
      .update({ return_status: "delivered", return_actual_delivery: now, updated_at: now })
      .eq("reservation_id", reservationId)
      .not("return_status", "is", null)
      .select("id")
    const shipmentIds = (shipmentRows ?? []).map((row: { id: string }) => row.id)
    if (shipmentIds.length > 0) {
      await supabase
        .from("returns")
        .update({ status: "received", updated_at: now })
        .in("shipment_id", shipmentIds)
        .in("status", ["pending", "approved", "in_transit"])
    }

    await supabase.from("logistics_audit_log").insert({
      action: "return_received_manual",
      entity_type: "reservation",
      entity_id: reservationId,
      new_values: { status: "completed", trigger: "manual_receive_button" },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[return-legs/receive] error:", err)
    return NextResponse.json({ error: "No se pudo cerrar la devolución" }, { status: 500 })
  }
}

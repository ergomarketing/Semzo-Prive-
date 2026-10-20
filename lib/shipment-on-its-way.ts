/**
 * Envia (una sola vez por envio) el correo "Tu nuevo bolso ya viaja hacia ti".
 *
 * Lo pueden disparar dos sitios: el panel de Logistica al crear el envio y el seguimiento de Correos cuando
 * detecta que el paquete se mueve. La marca shipments.in_transit_email_sent_at evita que salgan dos correos.
 *
 * Version: "cambio de bolso" si la socia acaba de devolver otro (reserva nacida de la cola de "proximo bolso" o una
 * reserva anterior cerrada en los ultimos 30 dias); si no, la version de primer bolso (socia nueva).
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import { EmailServiceProduction } from "@/app/lib/email-service-production"

const SWAP_WINDOW_MS = 30 * 24 * 60 * 60 * 1000

export async function sendShipmentOnItsWay(
  supabase: SupabaseClient,
  shipmentId: string,
): Promise<{ sent: boolean; reason?: string }> {
  try {
    const { data: shipment } = await supabase
      .from("shipments")
      .select(
        `id, reservation_id, tracking_number, in_transit_email_sent_at,
         reservations!shipments_reservation_id_fkey (
           id, user_id, queued_from_prev_cycle,
           profiles!reservations_user_id_fkey ( email, full_name ),
           bags!reservations_bag_id_fkey ( name, brand )
         )`,
      )
      .eq("id", shipmentId)
      .maybeSingle()
    if (!shipment) return { sent: false, reason: "shipment_not_found" }
    if (shipment.in_transit_email_sent_at) return { sent: false, reason: "already_sent" }

    const reservation = (Array.isArray((shipment as any).reservations) ? (shipment as any).reservations[0] : (shipment as any).reservations) as any
    const profile = Array.isArray(reservation?.profiles) ? reservation.profiles[0] : reservation?.profiles
    const bag = Array.isArray(reservation?.bags) ? reservation.bags[0] : reservation?.bags
    if (!profile?.email) return { sent: false, reason: "no_email" }

    let fromSwap = !!reservation?.queued_from_prev_cycle
    if (!fromSwap && reservation?.user_id) {
      const since = new Date(Date.now() - SWAP_WINDOW_MS).toISOString()
      const { data: previous } = await supabase
        .from("reservations")
        .select("id")
        .eq("user_id", reservation.user_id)
        .eq("status", "completed")
        .neq("id", reservation.id)
        .gte("updated_at", since)
        .limit(1)
      fromSwap = !!previous && previous.length > 0
    }

    // Se reserva el envio ANTES de mandar (marca atomica) para que dos disparos a la vez no dupliquen.
    const { data: claimed } = await supabase
      .from("shipments")
      .update({ in_transit_email_sent_at: new Date().toISOString() })
      .eq("id", shipmentId)
      .is("in_transit_email_sent_at", null)
      .select("id")
    if (!claimed || claimed.length === 0) return { sent: false, reason: "already_sent" }

    const ok = await EmailServiceProduction.getInstance().sendShipmentInTransitEmail({
      userEmail: profile.email,
      userName: profile.full_name || "",
      bagName: bag ? `${bag.brand || ""} ${bag.name || ""}`.trim() : undefined,
      trackingNumber: shipment.tracking_number,
      fromSwap,
    })
    if (!ok) {
      // Si no se pudo enviar, se libera la marca para que el otro disparador lo reintente.
      await supabase.from("shipments").update({ in_transit_email_sent_at: null }).eq("id", shipmentId)
      return { sent: false, reason: "send_failed" }
    }
    return { sent: true }
  } catch (err) {
    console.error("[shipment-on-its-way] Error enviando el correo de envio en camino:", err)
    return { sent: false, reason: "error" }
  }
}

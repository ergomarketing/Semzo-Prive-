import { type NextRequest, NextResponse } from "next/server"
import { CorreosAPI } from "@/lib/correos-api"
import { createClient } from "@supabase/supabase-js"
import { adminNotifications } from "@/lib/admin-notifications"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

/**
 * GET /api/admin/logistics/shipments/track?tracking_number=XXX
 * Obtener estado de tracking de un envio (via proxy Correos).
 *
 * Nota: el endpoint /api/correos/track aun no esta expuesto en el proxy.
 * Cuando se anada, este handler funcionara automaticamente.
 */
export async function GET(request: NextRequest) {
  try {
    const trackingNumber = request.nextUrl.searchParams.get("tracking_number")
    if (!trackingNumber) {
      return NextResponse.json({ error: "tracking_number is required" }, { status: 400 })
    }

    const correosClient = new CorreosAPI()
    const trackingInfo = await correosClient.trackShipment(trackingNumber)

    if (trackingInfo.estadoEnvio) {
      const statusMap: Record<string, string> = {
        "EN TRANSITO": "in_transit",
        ENTREGADO: "delivered",
        "EN REPARTO": "out_for_delivery",
        PENDIENTE: "pending",
      }
      const newStatus = statusMap[trackingInfo.estadoEnvio.toUpperCase()] || "in_transit"

      // Estado previo para detectar transicion (evita avisos admin duplicados al re-trackear)
      const { data: prevShipment } = await supabase
        .from("shipments")
        .select("status")
        .eq("tracking_number", trackingNumber)
        .maybeSingle()

      await supabase
        .from("shipments")
        .update({
          status: newStatus,
          actual_delivery: trackingInfo.fechaEntrega || null,
          updated_at: new Date().toISOString(),
        })
        .eq("tracking_number", trackingNumber)

      // AVISO ADMIN: solo en la PRIMERA transicion a "delivered"
      if (newStatus === "delivered" && prevShipment?.status !== "delivered") {
        try {
          const { data: shipmentData } = await supabase
            .from("shipments")
            .select(`
              tracking_number,
              reservations!shipments_reservation_id_fkey (
                profiles!reservations_user_id_fkey ( email, full_name ),
                bags!reservations_bag_id_fkey ( name, brand )
              )
            `)
            .eq("tracking_number", trackingNumber)
            .maybeSingle()

          const reservation = (shipmentData as any)?.reservations
          const profile = reservation?.profiles
          const bag = reservation?.bags

          if (profile?.email) {
            await adminNotifications
              .notifyShipmentStatus({
                userName: profile.full_name || profile.email,
                userEmail: profile.email,
                bagName: bag?.name || "—",
                bagBrand: bag?.brand || "",
                status: "delivered",
                trackingNumber,
              })
              .catch(() => {})
          }
        } catch (notifyErr) {
          console.error("[Logistics API] Error aviso admin entrega:", notifyErr)
        }
      }
    }

    return NextResponse.json({
      tracking_number: trackingNumber,
      status: trackingInfo.estadoEnvio,
      events: trackingInfo.eventos,
      delivered_at: trackingInfo.fechaEntrega,
    })
  } catch (error) {
    console.error("[Logistics API] Error tracking shipment:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al rastrear envio" },
      { status: 500 },
    )
  }
}

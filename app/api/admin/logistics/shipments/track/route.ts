import { type NextRequest, NextResponse } from "next/server"
import { CorreosAPI } from "@/lib/correos-api"
import { createClient } from "@supabase/supabase-js"

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

      await supabase
        .from("shipments")
        .update({
          status: newStatus,
          actual_delivery: trackingInfo.fechaEntrega || null,
          updated_at: new Date().toISOString(),
        })
        .eq("tracking_number", trackingNumber)
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

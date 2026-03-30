import { type NextRequest, NextResponse } from "next/server"
import { CorreosAPI } from "@/lib/correos-api"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/admin/logistics/shipments/track?tracking_number=XXX
 * Obtener estado de tracking de un envío
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const trackingNumber = searchParams.get("tracking_number")

    if (!trackingNumber) {
      return NextResponse.json({ error: "tracking_number is required" }, { status: 400 })
    }

    // Obtener credenciales de Correos
    const { data: correosSettings } = await supabase
      .from("logistics_settings")
      .select("api_credentials, is_enabled")
      .eq("carrier_name", "Correos")
      .single()

    if (!correosSettings?.api_credentials || !correosSettings.is_enabled) {
      return NextResponse.json({ error: "Correos no está configurado" }, { status: 400 })
    }

    const { clientId, clientSecret } = correosSettings.api_credentials as {
      clientId: string
      clientSecret: string
    }

    const correosClient = new CorreosAPI({ clientId, clientSecret })
    const trackingInfo = await correosClient.trackShipment(trackingNumber)

    // Actualizar estado en la base de datos si ha cambiado
    if (trackingInfo.estadoEnvio) {
      const statusMap: Record<string, string> = {
        "EN TRANSITO": "in_transit",
        "ENTREGADO": "delivered",
        "EN REPARTO": "out_for_delivery",
        "PENDIENTE": "pending",
      }

      const newStatus = statusMap[trackingInfo.estadoEnvio.toUpperCase()] || "in_transit"

      await supabase
        .from("shipments")
        .update({
          status: newStatus,
          actual_delivery: trackingInfo.fechaEntrega || null,
          updated_at: new Date().toISOString()
        })
        .eq("tracking_number", trackingNumber)
    }

    return NextResponse.json({
      tracking_number: trackingNumber,
      status: trackingInfo.estadoEnvio,
      events: trackingInfo.eventos,
      delivered_at: trackingInfo.fechaEntrega
    })
  } catch (error) {
    console.error("[Logistics API] Error tracking shipment:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al rastrear envío" },
      { status: 500 }
    )
  }
}

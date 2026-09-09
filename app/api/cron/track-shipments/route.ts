import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { CorreosAPI, isCorreosProxyConfigured } from "@/lib/correos-api"
import { adminNotifications } from "@/lib/admin-notifications"
import { EmailServiceProduction } from "@/app/lib/email-service-production"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const emailService = new EmailServiceProduction()

const CORREOS_STATUS_MAP: Record<string, string> = {
  "EN TRANSITO": "in_transit",
  ENTREGADO: "delivered",
  "EN REPARTO": "out_for_delivery",
  PENDIENTE: "pending",
}

/**
 * GET /api/cron/track-shipments
 *
 * Consulta periodicamente el estado en Correos de todos los envios activos
 * (aun no entregados) y, en la PRIMERA transicion a "delivered":
 *   - Actualiza shipments.status/actual_delivery (dispara el trigger de BD
 *     que fija reservations.delivered_at/start_date/end_date/pass_expires_at).
 *   - Envia el correo de confirmacion de entrega a la socia.
 *   - Envia el aviso interno al admin.
 *
 * Antes, esta deteccion solo ocurria si un admin abria el panel de logistica
 * y pulsaba "Verificar estado" manualmente para cada envio.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!isCorreosProxyConfigured()) {
    return NextResponse.json({ error: "Correos proxy no configurado", tracked: 0, delivered: 0 }, { status: 503 })
  }

  const correosClient = new CorreosAPI()
  let tracked = 0
  let delivered = 0
  const errors: Array<{ tracking_number: string; error: string }> = []

  try {
    const { data: activeShipments, error: fetchError } = await supabase
      .from("shipments")
      .select("id, reservation_id, tracking_number, status")
      .not("tracking_number", "is", null)
      .in("status", ["pending", "in_transit", "out_for_delivery"])

    if (fetchError) throw fetchError
    if (!activeShipments || activeShipments.length === 0) {
      return NextResponse.json({ success: true, tracked: 0, delivered: 0 })
    }

    for (const shipment of activeShipments) {
      try {
        const trackingInfo = await correosClient.trackShipment(shipment.tracking_number as string)
        tracked++

        if (!trackingInfo.estadoEnvio) continue

        const newStatus = CORREOS_STATUS_MAP[trackingInfo.estadoEnvio.toUpperCase()] || "in_transit"
        const wasDelivered = shipment.status === "delivered"

        await supabase
          .from("shipments")
          .update({
            status: newStatus,
            actual_delivery: trackingInfo.fechaEntrega || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", shipment.id)

        // Solo en la PRIMERA transicion a "delivered" (evita duplicar avisos).
        if (newStatus === "delivered" && !wasDelivered) {
          delivered++

          const { data: reservation } = await supabase
            .from("reservations")
            .select(`
              id, end_date,
              profiles!reservations_user_id_fkey ( email, full_name ),
              bags!reservations_bag_id_fkey ( name, brand )
            `)
            .eq("id", shipment.reservation_id)
            .maybeSingle()

          const profile = (reservation as any)?.profiles
          const bag = (reservation as any)?.bags
          const bagName = bag ? `${bag.brand || ""} ${bag.name || ""}`.trim() : undefined

          if (profile?.email) {
            await emailService
              .sendShipmentDeliveredEmail({
                userEmail: profile.email,
                userName: profile.full_name || profile.email,
                bagName,
                membershipEndDate: reservation?.end_date || undefined,
              })
              .catch((e) => console.error(`[track-shipments] Error email socia ${profile.email}:`, e))

            await adminNotifications
              .notifyShipmentStatus({
                userName: profile.full_name || profile.email,
                userEmail: profile.email,
                bagName: bag?.name || "—",
                bagBrand: bag?.brand || "",
                status: "delivered",
                trackingNumber: shipment.tracking_number as string,
              })
              .catch((e) => console.error("[track-shipments] Error aviso admin:", e))
          }
        }
      } catch (shipmentError) {
        const message = shipmentError instanceof Error ? shipmentError.message : "Error desconocido"
        errors.push({ tracking_number: shipment.tracking_number as string, error: message })
        console.error(`[track-shipments] Error tracking ${shipment.tracking_number}:`, message)
      }
    }

    return NextResponse.json({ success: true, tracked, delivered, errors })
  } catch (error) {
    console.error("[track-shipments] Error general:", error)
    const message = error instanceof Error ? error.message : "Error al rastrear envios"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"

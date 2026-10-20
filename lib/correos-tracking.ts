import type { SupabaseClient } from "@supabase/supabase-js"
import type { CorreosTrackingResponse } from "@/lib/correos-api"

export type ShipmentStatus = "pending" | "in_transit" | "out_for_delivery" | "delivered"
export type TrackingDirection = "outbound" | "return"

const CORREOS_STATUS_MAP: Record<string, ShipmentStatus> = {
  "PRE ADMISION": "pending",
  PREADMISION: "pending",
  PENDIENTE: "pending",
  "EN TRANSITO": "in_transit",
  "EN REPARTO": "out_for_delivery",
  ENTREGADO: "delivered",
}

function normalizeCorreosStatus(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
}

/**
 * Traduce el texto de estado de Correos a nuestro estado interno.
 * Devuelve null si el texto no esta en el mapa: en ese caso NO se debe
 * cambiar el estado (antes se asumia "in_transit" y un envio sin depositar
 * aparecia como en transito).
 */
export function mapCorreosStatus(raw: string): ShipmentStatus | null {
  return CORREOS_STATUS_MAP[normalizeCorreosStatus(raw)] ?? null
}

/**
 * Guarda en correos_tracking_log lo que Correos respondio realmente, solo
 * cuando cambia el texto de estado o el numero de eventos. Nunca lanza: el
 * registro es de auditoria y no debe romper el seguimiento.
 */
export async function recordCorreosTracking(
  supabase: SupabaseClient,
  params: {
    shipmentId: string
    direction: TrackingDirection
    trackingNumber: string
    info: CorreosTrackingResponse
    mappedStatus: ShipmentStatus | null
  },
): Promise<void> {
  try {
    const { shipmentId, direction, trackingNumber, info, mappedStatus } = params
    const eventsCount = info.eventos.length

    const { data: last, error: lastError } = await supabase
      .from("correos_tracking_log")
      .select("raw_status, events_count")
      .eq("shipment_id", shipmentId)
      .eq("direction", direction)
      .order("checked_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (lastError) {
      console.error("[correos-tracking] No se pudo leer el ultimo registro:", lastError.message)
      return
    }

    if (last && last.raw_status === info.estadoEnvio && last.events_count === eventsCount) return

    const { error: insertError } = await supabase.from("correos_tracking_log").insert({
      shipment_id: shipmentId,
      direction,
      tracking_number: trackingNumber,
      raw_status: info.estadoEnvio,
      mapped_status: mappedStatus,
      events_count: eventsCount,
      events: info.eventos,
      delivered_at: info.fechaEntrega || null,
    })

    if (insertError) {
      console.error("[correos-tracking] No se pudo guardar el registro:", insertError.message)
    }
  } catch (error) {
    console.error("[correos-tracking] Error inesperado al registrar:", error)
  }
}

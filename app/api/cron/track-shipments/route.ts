import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { CorreosAPI, isCorreosProxyConfigured } from "@/lib/correos-api"
import { adminNotifications } from "@/lib/admin-notifications"
import { EmailServiceProduction } from "@/app/lib/email-service-production"
import { mapCorreosStatus } from "@/lib/correos-status"
import { buildReturnLabelUrl } from "@/lib/return-label-link"
import { buildReturnLabelReminderEmail } from "@/app/lib/email-service-production"
import { logEmail } from "@/lib/email-logger"

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
 * (aun no entregados) y, en la PRIMERA transicion pending -> "in_transit" o
 * -> "delivered":
 *   - Actualiza shipments.status/actual_delivery (dispara el trigger de BD
 *     que fija reservations.delivered_at/start_date/end_date/pass_expires_at
 *     en el caso de "delivered").
 *   - Envia a la socia el correo correspondiente (envio en camino / entrega
 *     confirmada), con {{nombre_bolso}} resuelto desde la reserva activa
 *     vinculada al envio (shipments -> reservations -> bags).
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
    // OJO: no se sale aqui si no hay envios de ida activos. Antes un "return" temprano hacia que, cuando todos los
    // envios de ida estaban entregados, el seguimiento de las DEVOLUCIONES (abajo) no se ejecutara nunca.

    for (const shipment of activeShipments || []) {
      try {
        const trackingInfo = await correosClient.trackShipment(shipment.tracking_number as string)
        tracked++

        if (!trackingInfo.estadoEnvio) continue

        // Estado desconocido de Correos: no se toca el guardado (antes se marcaba "en transito" por defecto).
        const newStatus = mapCorreosStatus(trackingInfo.estadoEnvio)
        if (!newStatus) {
          console.warn("[track-shipments] Estado de Correos no reconocido:", trackingInfo.estadoEnvio)
          continue
        }
        const wasPending = shipment.status === "pending"
        const wasDelivered = shipment.status === "delivered"

        await supabase
          .from("shipments")
          .update({
            status: newStatus,
            actual_delivery: trackingInfo.fechaEntrega || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", shipment.id)

        // Solo en la PRIMERA transicion pending -> in_transit o -> delivered
        // (evita duplicar avisos en cada poll). {{nombre_bolso}} de ambos
        // emails viene de la reserva activa vinculada al envio (shipments ->
        // reservations -> bags), nunca de un valor fijo.
        const justShipped = newStatus === "in_transit" && wasPending
        const justDelivered = newStatus === "delivered" && !wasDelivered

        if (justShipped || justDelivered) {
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
            if (justShipped) {
              await emailService
                .sendShipmentInTransitEmail({
                  userEmail: profile.email,
                  userName: profile.full_name || profile.email,
                  bagName,
                })
                .catch((e) => console.error(`[track-shipments] Error email envio en transito ${profile.email}:`, e))

              await adminNotifications
                .notifyShipmentStatus({
                  userName: profile.full_name || profile.email,
                  userEmail: profile.email,
                  bagName: bag?.name || "—",
                  bagBrand: bag?.brand || "",
                  status: "in_transit",
                  trackingNumber: shipment.tracking_number as string,
                })
                .catch((e) => console.error("[track-shipments] Error aviso admin:", e))
            }

            if (justDelivered) {
              delivered++

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
        }
      } catch (shipmentError) {
        const message = shipmentError instanceof Error ? shipmentError.message : "Error desconocido"
        errors.push({ tracking_number: shipment.tracking_number as string, error: message })
        console.error(`[track-shipments] Error tracking ${shipment.tracking_number}:`, message)
      }
    }

    // ============================================================
    // SEGUIMIENTO DE DEVOLUCIONES
    // ============================================================
    // La etiqueta de devolucion se genera cuando la socia notifica el envio
    // (return_tracking_number), pero antes de esto NADA volvia a consultar
    // Correos sobre ese numero: el filtro de arriba excluye los envios ya
    // "delivered" (entrega de ida), asi que el seguimiento del paquete de
    // vuelta quedaba invisible para siempre. Aqui se rastrea por separado.
    const { data: returnShipments, error: returnFetchError } = await supabase
      .from("shipments")
      .select("id, reservation_id, return_tracking_number, return_status")
      .not("return_tracking_number", "is", null)
      .or("return_status.is.null,return_status.in.(pending,in_transit,out_for_delivery)")

    if (returnFetchError) throw returnFetchError

    let returnsDelivered = 0

    for (const shipment of returnShipments || []) {
      try {
        const trackingInfo = await correosClient.trackShipment(shipment.return_tracking_number as string)
        tracked++

        if (!trackingInfo.estadoEnvio) continue

        const newReturnStatus = mapCorreosStatus(trackingInfo.estadoEnvio)
        if (!newReturnStatus) {
          console.warn("[track-shipments] Estado de devolucion no reconocido:", trackingInfo.estadoEnvio)
          continue
        }
        const wasUntracked = !shipment.return_status
        const wasReturnDelivered = shipment.return_status === "delivered"

        await supabase
          .from("shipments")
          .update({
            return_status: newReturnStatus,
            return_actual_delivery: trackingInfo.fechaEntrega || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", shipment.id)

        const justShippedBack = newReturnStatus === "in_transit" && wasUntracked
        const justReturnDelivered = newReturnStatus === "delivered" && !wasReturnDelivered

        if (justShippedBack || justReturnDelivered) {
          const { data: reservation } = await supabase
            .from("reservations")
            .select(`
              id,
              profiles!reservations_user_id_fkey ( email, full_name ),
              bags!reservations_bag_id_fkey ( name, brand )
            `)
            .eq("id", shipment.reservation_id)
            .maybeSingle()

          const profile = (reservation as any)?.profiles
          const bag = (reservation as any)?.bags
          const bagName = bag ? `${bag.brand || ""} ${bag.name || ""}`.trim() : "tu bolso"

          if (justShippedBack) {
            await adminNotifications
              .notifyShipmentStatus({
                userName: profile?.full_name || profile?.email || "—",
                userEmail: profile?.email || "—",
                bagName: bag?.name || "—",
                bagBrand: bag?.brand || "",
                status: "return_in_transit" as any,
                trackingNumber: shipment.return_tracking_number as string,
              })
              .catch((e) => console.error("[track-shipments] Error aviso admin devolucion en transito:", e))
          }

          if (justReturnDelivered) {
            returnsDelivered++

            // Correos dice "entregado", pero el correo de "devolucion recibida" a la socia SOLO sale cuando Erika
            // verifica el bolso (boton "Recibida y verificada" / cierre en Devoluciones): aqui solo se avisa al admin.
            // Antes se enviaba aqui Y al cerrar la devolucion: dos correos, el primero sin haber verificado nada.
            await adminNotifications
              .notifyShipmentStatus({
                userName: profile?.full_name || profile?.email || "—",
                userEmail: profile?.email || "—",
                bagName: bag?.name || "—",
                bagBrand: bag?.brand || "",
                status: "return_delivered" as any,
                trackingNumber: shipment.return_tracking_number as string,
              })
              .catch((e) => console.error("[track-shipments] Error aviso admin devolucion recibida:", e))
          }
        }
      } catch (shipmentError) {
        const message = shipmentError instanceof Error ? shipmentError.message : "Error desconocido"
        errors.push({ tracking_number: shipment.return_tracking_number as string, error: message })
        console.error(`[track-shipments] Error tracking devolucion ${shipment.return_tracking_number}:`, message)
      }
    }

    // --- AVISO AL ADMIN: etiqueta de devolucion aun en PRE-ADMISION justo al vencer la reserva ---
    // El bolso va con la etiqueta de vuelta ya creada. Si al llegar el vencimiento (hoy o manana) Correos sigue sin
    // haberla escaneado, la socia no ha entregado el paquete: se avisa UNA vez, a tiempo, y no despues de vencida.
    let preAdmissionAlerts = 0
    const alertWindowEnd = new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString()
    const { data: dueSoon } = await supabase
      .from("reservations")
      .select(
        `
        id, end_date, status,
        profiles!reservations_user_id_fkey ( email, full_name ),
        bags!reservations_bag_id_fkey ( name, brand ),
        shipments!shipments_reservation_id_fkey ( return_tracking_number, return_status )
      `,
      )
      .in("status", ["active", "confirmed"])
      .gt("end_date", new Date().toISOString())
      .lte("end_date", alertWindowEnd)

    for (const reservation of dueSoon || []) {
      const shipmentRow = (Array.isArray((reservation as any).shipments)
        ? (reservation as any).shipments[0]
        : (reservation as any).shipments) as { return_tracking_number?: string | null; return_status?: string | null } | null
      if (!shipmentRow?.return_tracking_number) continue
      if (shipmentRow.return_status && shipmentRow.return_status !== "pending") continue // ya escaneada por Correos

      const { data: already } = await supabase
        .from("admin_notifications")
        .select("id")
        .eq("type", "return_label_not_scanned")
        .contains("metadata", { reservation_id: reservation.id })
        .limit(1)
      if (already && already.length > 0) continue

      const profile = (reservation as any).profiles
      const bag = (reservation as any).bags
      const who = profile?.full_name || profile?.email || "la socia"
      const bagLabel = bag ? `${bag.brand || ""} ${bag.name || ""}`.trim() : "el bolso"
      const dueDay = new Date(reservation.end_date).toLocaleDateString("es-ES", { day: "numeric", month: "long" })
      await supabase.from("admin_notifications").insert({
        type: "return_label_not_scanned",
        priority: "high",
        title: `Devolución sin entregar en Correos — ${bagLabel}`,
        message: `${who} debe devolver ${bagLabel} el ${dueDay} y Correos aún muestra la etiqueta (${shipmentRow.return_tracking_number}) en PRE-ADMISIÓN: el paquete no se ha entregado. Escríbele hoy para evitar el aviso de cargo.`,
        metadata: { reservation_id: reservation.id, return_tracking_number: shipmentRow.return_tracking_number },
      })
      preAdmissionAlerts++

      // Y aviso a la socia (plantilla de Erika): su etiqueta sigue sin escanear; el boton descarga la etiqueta.
      if (profile?.email) {
        const built = buildReturnLabelReminderEmail({
          fullName: profile.full_name,
          bagName: bagLabel,
          labelUrl: buildReturnLabelUrl(reservation.id),
        })
        const sentToMember = await emailService.sendWithResend({ to: profile.email, subject: built.subject, html: built.html })
        await logEmail({
          recipientEmail: profile.email,
          recipientName: profile.full_name || null,
          subject: built.subject,
          emailType: "return_label_not_scanned",
          status: sentToMember ? "sent" : "failed",
          metadata: { reservationId: reservation.id },
        })
      }
    }

    return NextResponse.json({ success: true, tracked, delivered, returnsDelivered, preAdmissionAlerts, errors })
  } catch (error) {
    console.error("[track-shipments] Error general:", error)
    const message = error instanceof Error ? error.message : "Error al rastrear envios"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"

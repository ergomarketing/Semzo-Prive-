import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireAdminAuth } from "@/lib/admin-auth"
import { EmailServiceProduction, buildPickupConfirmedEmail } from "@/app/lib/email-service-production"
import { logEmail } from "@/lib/email-logger"

export const dynamic = "force-dynamic"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const SLOT_LABELS: Record<string, string> = {
  "09:00-14:00": "Mañana (9:00 - 14:00)",
  "14:00-19:00": "Tarde (14:00 - 19:00)",
}

/**
 * POST /api/admin/logistics/pickups/confirm  { shipment_id }
 * "Ya la pedí en Correos": manda a la socia el correo "Recogida confirmada" con el día y la franja que ella eligió
 * (los que has pedido en Correos) y marca la recogida como confirmada. Una sola vez.
 */
export async function POST(request: NextRequest) {
  const authError = await requireAdminAuth(request)
  if (authError) return authError

  const body = await request.json().catch(() => ({}))
  const shipmentId = String(body?.shipment_id || "")
  if (!shipmentId) return NextResponse.json({ error: "Falta shipment_id" }, { status: 400 })

  const { data: shipment } = await supabase
    .from("shipments")
    .select(
      `id, pickup_date, pickup_slot, pickup_confirmed_at,
       reservations!shipments_reservation_id_fkey (
         profiles!reservations_user_id_fkey ( full_name, email ),
         bags!reservations_bag_id_fkey ( name, brand )
       )`,
    )
    .eq("id", shipmentId)
    .maybeSingle()
  if (!shipment) return NextResponse.json({ error: "Envío no encontrado" }, { status: 404 })
  if (shipment.pickup_confirmed_at) return NextResponse.json({ error: "Esta recogida ya está confirmada" }, { status: 409 })
  if (!shipment.pickup_date) return NextResponse.json({ error: "La recogida no tiene fecha" }, { status: 400 })

  const reservation = (Array.isArray((shipment as any).reservations) ? (shipment as any).reservations[0] : (shipment as any).reservations) as any
  const profile = Array.isArray(reservation?.profiles) ? reservation.profiles[0] : reservation?.profiles
  const bag = Array.isArray(reservation?.bags) ? reservation.bags[0] : reservation?.bags
  if (!profile?.email) return NextResponse.json({ error: "La socia no tiene email" }, { status: 400 })

  const pickupDay = new Date(`${String(shipment.pickup_date).slice(0, 10)}T12:00:00`).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  const built = buildPickupConfirmedEmail({
    fullName: profile.full_name,
    bagName: bag ? `${bag.brand || ""} ${bag.name || ""}`.trim() : "tu bolso",
    pickupDay,
    timeSlot: SLOT_LABELS[shipment.pickup_slot || ""] || shipment.pickup_slot || "Franja pendiente de confirmar",
  })
  const sent = await EmailServiceProduction.getInstance().sendWithResend({
    to: profile.email,
    subject: built.subject,
    html: built.html,
  })
  await logEmail({
    recipientEmail: profile.email,
    recipientName: profile.full_name || null,
    subject: built.subject,
    emailType: "pickup_confirmed",
    status: sent ? "sent" : "failed",
    metadata: { shipmentId },
  })
  if (!sent) return NextResponse.json({ error: "No se pudo enviar el correo a la socia" }, { status: 502 })

  await supabase.from("shipments").update({ pickup_confirmed_at: new Date().toISOString() }).eq("id", shipmentId)
  return NextResponse.json({ success: true })
}

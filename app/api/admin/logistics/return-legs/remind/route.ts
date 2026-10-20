import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireAdminAuth } from "@/lib/admin-auth"
import { EmailServiceProduction, buildReturnLabelReminderEmail } from "@/app/lib/email-service-production"
import { buildReturnLabelUrl } from "@/lib/return-label-link"
import { logEmail } from "@/lib/email-logger"

export const dynamic = "force-dynamic"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

/**
 * POST /api/admin/logistics/return-legs/remind  { reservation_id }
 * Envia a UNA socia concreta el correo "Tu paquete te esta esperando" (recordatorio de entregar el bolso en Correos)
 * con sus datos reales y el enlace para descargar su etiqueta. Se puede repetir las veces que haga falta.
 */
export async function POST(request: NextRequest) {
  const authError = await requireAdminAuth(request)
  if (authError) return authError

  const body = await request.json().catch(() => ({}))
  const reservationId = String(body?.reservation_id || "")
  if (!reservationId) return NextResponse.json({ error: "Falta reservation_id" }, { status: 400 })

  const { data: reservation } = await supabase
    .from("reservations")
    .select(
      "id, status, profiles!reservations_user_id_fkey ( full_name, email ), bags!reservations_bag_id_fkey ( name, brand )",
    )
    .eq("id", reservationId)
    .maybeSingle()
  if (!reservation) return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
  const profile = Array.isArray((reservation as any).profiles) ? (reservation as any).profiles[0] : (reservation as any).profiles
  const bag = Array.isArray((reservation as any).bags) ? (reservation as any).bags[0] : (reservation as any).bags
  if (!profile?.email) return NextResponse.json({ error: "La socia no tiene email" }, { status: 400 })

  const built = buildReturnLabelReminderEmail({
    fullName: profile.full_name,
    bagName: bag ? `${bag.brand || ""} ${bag.name || ""}`.trim() : "tu bolso",
    labelUrl: buildReturnLabelUrl(reservationId),
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
    emailType: "return_label_reminder_manual",
    status: sent ? "sent" : "failed",
    metadata: { reservationId },
  })
  if (!sent) return NextResponse.json({ error: "No se pudo enviar el correo" }, { status: 502 })
  return NextResponse.json({ success: true, sentTo: profile.email })
}

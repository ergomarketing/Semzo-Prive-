/**
 * CRON: Recordatorios de devolucion 2 dias antes
 *
 * Logica por tipo de membresia:
 *  - Petite: delivered_at + 5 dias (aviso 2 dias antes de los 7 que tiene)
 *  - Essentiel / Signature / Prive: pass_expires_at - 2 dias
 *
 * Guard de deduplicacion: columna reminder_2d_sent_at en reservations.
 * Frecuencia: diaria (08:00 UTC en vercel.json)
 */

import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { logEmail } from "@/lib/email-logger"
import { renderReturnReminderBrandEmail } from "@/emails/templates/return-reminder-brand"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const resend = new Resend(process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY)
const FROM_EMAIL = "hola@semzoprive.com"

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getSupabase()
  const now = new Date()

  const { data: reservations, error } = await supabase
    .from("reservations")
    .select(`
      id,
      user_id,
      membership_type,
      delivered_at,
      pass_expires_at,
      reminder_2d_sent_at,
      bags!inner(name, brand, image_url),
      profiles!inner(email, first_name, last_name)
    `)
    .not("status", "in", "(completed,cancelled,canceled)")
    .is("reminder_2d_sent_at", null)
    .not("delivered_at", "is", null)

  if (error) {
    console.error("[return-reminder] Error cargando reservas:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let sent = 0
  let skipped = 0

  for (const res of reservations || []) {
    const bag = res.bags as any
    const profile = res.profiles as any
    if (!profile?.email || !bag) {
      skipped++
      continue
    }

    const delivered = new Date(res.delivered_at!)
    const membershipType: string = res.membership_type || "petite"
    const isPetite = membershipType === "petite"

    let reminderDate: Date
    if (isPetite) {
      reminderDate = new Date(delivered.getTime() + 5 * 24 * 60 * 60 * 1000)
    } else if (res.pass_expires_at) {
      reminderDate = new Date(new Date(res.pass_expires_at).getTime() - 2 * 24 * 60 * 60 * 1000)
    } else {
      skipped++
      continue
    }

    reminderDate.setHours(0, 0, 0, 0)
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    if (reminderDate.getTime() !== todayStart.getTime()) {
      skipped++
      continue
    }

    const returnBy = new Date(delivered.getTime() + 7 * 24 * 60 * 60 * 1000)
    if (!isPetite && res.pass_expires_at) {
      returnBy.setTime(new Date(res.pass_expires_at).getTime())
    }
    const returnByFormatted = returnBy.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })

    const userName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "socia"
    const bagName = bag.name
    const bagBrand = bag.brand
    const fullBagName = `${bagBrand} ${bagName}`.trim()

    // Documento de marca completo (mismo diseño que el resto de emails de
    // lifecycle): {{nombre}}, {{nombre_bolso}} y {{fecha_devolucion}} vienen
    // siempre de esta reserva concreta, nunca de un valor fijo.
    const html = renderReturnReminderBrandEmail({
      name: userName.split(" ")[0] || userName,
      bagName: fullBagName,
      returnDate: returnByFormatted,
    })

    const subject = `Tu ${fullBagName} vuelve en 2 días`

    const { error: sendErr } = await resend.emails.send({
      from: `Semzo Privé <${FROM_EMAIL}>`,
      to: profile.email,
      subject,
      html,
    })

    if (sendErr) {
      console.error("[return-reminder] Error enviando a:", profile.email, sendErr)
      await logEmail({
        recipientEmail: profile.email,
        recipientName: userName,
        subject,
        emailType: "return_reminder",
        status: "failed",
        errorMessage: String((sendErr as any)?.message || sendErr),
        metadata: { reservationId: res.id, bag: `${bagBrand} ${bagName}` },
      })
      continue
    }

    await supabase
      .from("reservations")
      .update({ reminder_2d_sent_at: new Date().toISOString() })
      .eq("id", res.id)

    await logEmail({
      recipientEmail: profile.email,
      recipientName: userName,
      subject,
      emailType: "return_reminder",
      status: "sent",
      metadata: { reservationId: res.id, bag: `${bagBrand} ${bagName}` },
    })

    sent++
    console.log(`[return-reminder] Recordatorio enviado a ${profile.email} | bolso: ${bagBrand} ${bagName}`)
  }

  return NextResponse.json({
    ok: true,
    sent,
    skipped,
    total: (reservations || []).length,
  })
}

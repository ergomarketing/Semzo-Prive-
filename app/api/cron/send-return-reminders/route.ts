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
import { generateReturnReminderHTML } from "@/lib/email-templates-membership"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const resend = new Resend(process.env.EMAIL_API_KEY || process.env.RESEND_API_KEY)
const FROM_EMAIL = "hola@semzoprive.com"
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_ENV === "production"
    ? "https://semzoprive.com"
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000")

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getSupabase()
  const now = new Date()

  // Rango: reservas donde el aviso cae HOY (±12h para no saltarse nada)
  const windowStart = new Date(now)
  windowStart.setHours(0, 0, 0, 0)
  const windowEnd = new Date(now)
  windowEnd.setHours(23, 59, 59, 999)

  // Reservas activas (bolso en posesión) sin recordatorio enviado aún
  const { data: reservations, error } = await supabase
    .from("reservations")
    .select(`
      id,
      user_id,
      membership_type,
      delivered_at,
      pass_expires_at,
      reminder_2d_sent_at,
      bags!inner(name, brand),
      profiles!inner(email, first_name, last_name)
    `)
    .not("status", "in", "(completed,cancelled,canceled)")
    .is("reminder_2d_sent_at", null)
    .not("delivered_at", "is", null) // solo bolsos ya entregados a la socia

  if (error) {
    console.error("[return-reminder] Error cargando reservas:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let sent = 0
  let skipped = 0

  for (const res of reservations || []) {
    const bag = res.bags as any
    const profile = res.profiles as any
    if (!profile?.email || !bag) { skipped++; continue }

    const delivered = new Date(res.delivered_at!)
    const membershipType: string = res.membership_type || "petite"

    // Calcular la fecha en que debemos enviar el aviso (2 días antes del vencimiento)
    let reminderDate: Date

    if (membershipType === "petite") {
      // Petite: el pase dura 7 días desde entrega → aviso el día 5
      reminderDate = new Date(delivered.getTime() + 5 * 24 * 60 * 60 * 1000)
    } else if (res.pass_expires_at) {
      // Resto: usar pass_expires_at - 2 días
      reminderDate = new Date(new Date(res.pass_expires_at).getTime() - 2 * 24 * 60 * 60 * 1000)
    } else {
      skipped++
      continue
    }

    // Solo enviar si el aviso cae hoy
    reminderDate.setHours(0, 0, 0, 0)
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
    if (reminderDate.getTime() !== todayStart.getTime()) { skipped++; continue }

    // Fecha de devolución para mostrar en el email
    const returnBy = new Date(delivered.getTime() + 7 * 24 * 60 * 60 * 1000)
    if (membershipType !== "petite" && res.pass_expires_at) {
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

    const html = generateReturnReminderHTML({
      userName,
      bagName,
      bagBrand,
      returnByDate: returnByFormatted,
      membershipType,
      dashboardUrl: `${SITE_URL}/dashboard`,
    })

    const subject =
      membershipType === "petite"
        ? `Tu bolso ${bagBrand} ${bagName} regresa pronto — Semzo Privé`
        : `Recordatorio: devolución de tu bolso en 2 días — Semzo Privé`

    const { error: sendErr } = await resend.emails.send({
      from: `Semzo Privé <${FROM_EMAIL}>`,
      to: profile.email,
      subject,
      html,
    })

    if (sendErr) {
      console.error("[return-reminder] Error enviando a:", profile.email, sendErr)
      continue
    }

    // Marcar como enviado
    await supabase
      .from("reservations")
      .update({ reminder_2d_sent_at: new Date().toISOString() })
      .eq("id", res.id)

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

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"
import {
  generateDunningE2HTML,
  generateDunningE3HTML,
  generateDunningAdminHTML,
} from "@/lib/email-templates-membership"

export const dynamic = "force-dynamic"

const resend = new Resend(process.env.EMAIL_API_KEY || process.env.RESEND_API_KEY)
const ADMIN_EMAIL = "mailbox@semzoprive.com"
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
    { auth: { persistSession: false } }
  )
}

/**
 * Cron diario: envía E2 (+3 días) y E3 (+7 días) a socias con pago fallido.
 * Se apoya en dunning_status de user_memberships para saber en qué paso va.
 * Guard de deduplicación: no reenvía si ya se envió el paso correspondiente.
 */
export async function GET(request: NextRequest) {
  // Seguridad: solo Vercel Cron o llamada interna con secret
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const supabase = getSupabase()
  const now = new Date()

  // Socias con pago fallido pendiente de follow-up (e1_sent o e2_sent)
  const { data: memberships, error } = await supabase
    .from("user_memberships")
    .select("id, user_id, membership_type, status, dunning_status, failed_payment_count, updated_at")
    .in("dunning_status", ["e1_sent", "e2_sent"])
    .in("status", ["past_due", "unpaid"])

  if (error) {
    console.error("[dunning-cron] Error cargando membresías:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let e2Sent = 0
  let e3Sent = 0
  let skipped = 0

  for (const membership of memberships || []) {
    const dunningStart = new Date(membership.updated_at)
    const daysSince = Math.floor((now.getTime() - dunningStart.getTime()) / (1000 * 60 * 60 * 24))

    // E2 a los 3 días, E3 a los 7 días
    const shouldSendE2 = membership.dunning_status === "e1_sent" && daysSince >= 3
    const shouldSendE3 = membership.dunning_status === "e2_sent" && daysSince >= 4 // 4 más desde E2 = 7 total

    if (!shouldSendE2 && !shouldSendE3) {
      skipped++
      continue
    }

    // Datos de la socia
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, email")
      .eq("id", membership.user_id)
      .maybeSingle()

    if (!profile?.email) continue

    const userName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "socia"

    // Bolso activo en posesión
    const { data: activeReservation } = await supabase
      .from("reservations")
      .select("bags(name, brand)")
      .eq("user_id", membership.user_id)
      .not("status", "in", "(completed,cancelled,canceled)")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    const bag = (activeReservation?.bags as any)
    const bagName = bag ? `${bag.brand} ${bag.name}` : undefined
    const updatePaymentUrl = `${SITE_URL}/dashboard/membresia`
    const step = shouldSendE2 ? 2 : 3

    // Generar HTML
    const userHtml = shouldSendE2
      ? generateDunningE2HTML({ userName, membershipType: membership.membership_type, bagName, updatePaymentUrl })
      : generateDunningE3HTML({ userName, membershipType: membership.membership_type, bagName, updatePaymentUrl })

    const subject = shouldSendE2
      ? "¿Actualizamos juntas tu método de pago? — Semzo Privé"
      : "Seguimos aquí para ayudarte con tu membresía — Semzo Privé"

    // Enviar a socia
    const { error: sendErr } = await resend.emails.send({
      from: `Semzo Privé <${FROM_EMAIL}>`,
      to: profile.email,
      subject,
      html: userHtml,
    })

    if (sendErr) {
      console.error(`[dunning-cron] Error enviando E${step} a:`, profile.email, sendErr)
      continue
    }

    // Notificar al admin
    const adminHtml = generateDunningAdminHTML({
      userName,
      userEmail: profile.email,
      membershipType: membership.membership_type,
      bagName,
      failedAt: new Date(membership.updated_at).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" }),
      dunningStep: step,
    })

    await resend.emails.send({
      from: `Semzo Privé <${FROM_EMAIL}>`,
      to: ADMIN_EMAIL,
      subject: `[Semzo Admin] Seguimiento pago pendiente (paso ${step}) — ${userName}`,
      html: adminHtml,
    })

    // Actualizar dunning_status
    const newStatus = shouldSendE2 ? "e2_sent" : "e3_sent"
    await supabase
      .from("user_memberships")
      .update({ dunning_status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", membership.id)

    if (shouldSendE2) e2Sent++; else e3Sent++
    console.log(`[dunning-cron] E${step} enviado a:`, profile.email)
  }

  return NextResponse.json({
    ok: true,
    e2Sent,
    e3Sent,
    skipped,
    processed: (memberships || []).length,
  })
}

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"
import { render } from "@react-email/components"
import DunningEmail from "@/emails/templates/dunning"
import AdminNotificationEmail from "@/emails/templates/admin-notification"
import { logEmail } from "@/lib/email-logger"

export const dynamic = "force-dynamic"

const resend = new Resend(process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY)
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
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  })
}

function capitalize(s: string): string {
  if (!s) return ""
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

/**
 * Cron diario: envía E2 (+3 días) y E3 (+7 días) a socias con pago fallido.
 * Se apoya en dunning_status de user_memberships para saber en qué paso va.
 * Guard de deduplicación: no reenvía si ya se envió el paso correspondiente.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const supabase = getSupabase()
  const now = new Date()

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

    const shouldSendE2 = membership.dunning_status === "e1_sent" && daysSince >= 3
    const shouldSendE3 = membership.dunning_status === "e2_sent" && daysSince >= 4

    if (!shouldSendE2 && !shouldSendE3) {
      skipped++
      continue
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, email")
      .eq("id", membership.user_id)
      .maybeSingle()

    if (!profile?.email) continue

    const userName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "socia"

    const { data: activeReservation } = await supabase
      .from("reservations")
      .select("bags(name, brand)")
      .eq("user_id", membership.user_id)
      .not("status", "in", "(completed,cancelled,canceled)")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    const bag = activeReservation?.bags as any
    const bagName = bag ? `${bag.brand} ${bag.name}` : undefined
    const updatePaymentUrl = `${SITE_URL}/dashboard/membresia`
    const step = shouldSendE2 ? 2 : 3
    const membershipLabel = capitalize(membership.membership_type)

    const userHtml = await render(
      <DunningEmail step={step as 2 | 3} name={userName} membershipLabel={membershipLabel} bagName={bagName} updatePaymentUrl={updatePaymentUrl} />,
    )

    const subject =
      step === 2
        ? "¿Actualizamos juntas tu método de pago? — Semzo Privé"
        : "Seguimos aquí para ayudarte con tu membresía — Semzo Privé"

    const { error: sendErr } = await resend.emails.send({
      from: `Semzo Privé <${FROM_EMAIL}>`,
      to: profile.email,
      subject,
      html: userHtml,
    })

    if (sendErr) {
      console.error(`[dunning-cron] Error enviando E${step} a:`, profile.email, sendErr)
      await logEmail({
        recipientEmail: profile.email,
        recipientName: userName,
        subject,
        emailType: `dunning_e${step}`,
        status: "failed",
        errorMessage: String((sendErr as any)?.message || sendErr),
        metadata: { membershipId: membership.id, step },
      })
      continue
    }

    await logEmail({
      recipientEmail: profile.email,
      recipientName: userName,
      subject,
      emailType: `dunning_e${step}`,
      status: "sent",
      metadata: { membershipId: membership.id, step },
    })

    const adminHtml = await render(
      <AdminNotificationEmail
        title={`Seguimiento pago pendiente (paso ${step}) — ${userName}`}
        rows={[
          { label: "Socia", value: userName },
          { label: "Email", value: profile.email },
          { label: "Membresía", value: membershipLabel },
          ...(bagName ? [{ label: "Bolso en posesión", value: bagName }] : []),
          {
            label: "Fallo detectado",
            value: new Date(membership.updated_at).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" }),
          },
          { label: "Email enviado a socia", value: `Paso ${step} de 3` },
        ]}
      />,
    )

    await resend.emails.send({
      from: `Semzo Privé <${FROM_EMAIL}>`,
      to: ADMIN_EMAIL,
      subject: `[Semzo Admin] Seguimiento pago pendiente (paso ${step}) — ${userName}`,
      html: adminHtml,
    })

    const newStatus = shouldSendE2 ? "e2_sent" : "e3_sent"
    await supabase
      .from("user_memberships")
      .update({ dunning_status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", membership.id)

    if (shouldSendE2) e2Sent++
    else e3Sent++
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

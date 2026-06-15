import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"
import { Email1Bienvenida } from "@/emails/leads/email-1-bienvenida"
import { Email2Storytelling } from "@/emails/leads/email-2-storytelling"
import { Email3PropuestaValor } from "@/emails/leads/email-3-propuesta-valor"
import { Email4Escasez } from "@/emails/leads/email-4-escasez"
import { Email5Cierre } from "@/emails/leads/email-5-cierre"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

const EMAIL_SUBJECTS: Record<number, string> = {
  1: "Bienvenida a algo diferente, {{name}}",
  2: "No todo el mundo sabe lo que tiene delante",
  3: "¿Qué incluye realmente una suscripción SEMZO?",
  4: "Prendas como estas no esperan",
  5: "Una última cosa, {{name}}",
}

type EmailProps = {
  name: string
  trackingPixelUrl: string
  ctaUrl: string
  unsubscribeUrl: string
}

function getEmailComponent(emailNumber: number, props: EmailProps) {
  switch (emailNumber) {
    case 1: return Email1Bienvenida(props)
    case 2: return Email2Storytelling(props)
    case 3: return Email3PropuestaValor(props)
    case 4: return Email4Escasez(props)
    case 5: return Email5Cierre(props)
    default: return null
  }
}

export async function GET(req: NextRequest) {
  // Verificar CRON_SECRET para proteger el endpoint
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const now = new Date().toISOString()

  // Obtener emails pendientes cuya scheduled_for ya pasó
  const { data: pendingEmails, error } = await supabase
    .from("email_sequence_log")
    .select("*, leads(*)")
    .eq("status", "pending")
    .lte("scheduled_for", now)
    .order("scheduled_for", { ascending: true })
    .limit(50) // procesar máximo 50 por ejecución

  if (error) {
    console.error("[cron/send-lead-emails] Error obteniendo pendientes:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!pendingEmails || pendingEmails.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: "Nada pendiente" })
  }

  let sent = 0
  let skipped = 0
  let failed = 0

  for (const row of pendingEmails) {
    const lead = row.leads as any

    // Saltar si el lead convirtió o se dio de baja
    if (!lead || lead.status === "subscribed" || lead.status === "unsubscribed") {
      await supabase
        .from("email_sequence_log")
        .update({ status: "skipped" })
        .eq("id", row.id)
      skipped++
      continue
    }

    const subject = EMAIL_SUBJECTS[row.email_number]?.replace("{{name}}", lead.name || "") || "SEMZO Privé"
    const trackingPixelUrl = `${process.env.APP_URL}/api/track/open?lid=${lead.id}&eid=${row.id}`
    const ctaBaseUrl = `${process.env.APP_URL}/api/track/click?lid=${lead.id}&eid=${row.id}&url=`
    const unsubscribeUrl = `${process.env.APP_URL}/api/webhooks/unsubscribe?lid=${lead.id}`

    const ctaDestination = row.email_number <= 2
      ? `${process.env.APP_URL}/catalog`
      : `${process.env.APP_URL}/membresias`

    const emailProps: EmailProps = {
      name: lead.name || "",
      trackingPixelUrl,
      ctaUrl: ctaBaseUrl + encodeURIComponent(ctaDestination),
      unsubscribeUrl,
    }

    const component = getEmailComponent(row.email_number, emailProps)
    if (!component) {
      skipped++
      continue
    }

    try {
      await resend.emails.send({
        from: process.env.FROM_EMAIL || "SEMZO Privé <hola@semzoprive.com>",
        to: [lead.email],
        subject,
        react: component,
      })

      await supabase
        .from("email_sequence_log")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", row.id)

      sent++
    } catch (err) {
      console.error(`[cron/send-lead-emails] Error email ${row.email_number} a ${lead.email}:`, err)
      await supabase
        .from("email_sequence_log")
        .update({ status: "failed", error_message: String(err) })
        .eq("id", row.id)
      failed++
    }
  }

  return NextResponse.json({ ok: true, sent, skipped, failed })
}

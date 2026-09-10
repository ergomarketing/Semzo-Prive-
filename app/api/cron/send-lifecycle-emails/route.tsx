import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"
import { render } from "@react-email/components"
import { logEmail } from "@/lib/email-logger"
import LifecycleSequenceEmail from "@/emails/templates/lifecycle-sequence"

/**
 * Cron de envío único y genérico para TODAS las secuencias de lifecycle de
 * la Fase 3 (onboarding, checkout abandonado, renovación, tarjeta por
 * caducar, win-back, reactivación de pausa, back-in-stock, NPS).
 *
 * AISLADO de la Secuencia 1 (leads/newsletter): lee de lifecycle_email_log /
 * lifecycle_email_templates, nunca de email_sequence_log / email_templates.
 * Se ejecuta varias veces al día (ver vercel.json) para que los delays
 * cortos (0h, 24h) no esperen a un cron diario.
 */
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const resend = new Resend(process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY)

function renderTemplate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce((str, [key, value]) => str.replaceAll(`{{${key}}}`, value), template)
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const now = new Date().toISOString()

  const { data: pendingEmails, error } = await supabase
    .from("lifecycle_email_log")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_for", now)
    .order("scheduled_for", { ascending: true })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!pendingEmails || pendingEmails.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: "Nada pendiente" })
  }

  const { data: templates, error: tplError } = await supabase
    .from("lifecycle_email_templates")
    .select("sequence_key, step_number, subject, body_html, is_full_document")
    .eq("active", true)

  if (tplError || !templates) {
    return NextResponse.json({ error: "Error cargando lifecycle_email_templates" }, { status: 500 })
  }

  const templateMap = Object.fromEntries(
    templates.map((t) => [`${t.sequence_key}:${t.step_number}`, t]),
  )

  const appUrl = process.env.APP_URL || "https://semzoprive.com"

  let sent = 0
  let skipped = 0
  let failed = 0

  for (const row of pendingEmails) {
    const template = templateMap[`${row.sequence_key}:${row.step_number}`]

    if (!template) {
      await supabase.from("lifecycle_email_log").update({ status: "skipped" }).eq("id", row.id)
      skipped++
      continue
    }

    const vars: Record<string, string> = {
      name: row.recipient_name || "",
      app_url: appUrl,
      ...(row.metadata || {}),
    }

    const subject = renderTemplate(template.subject, vars)
    const bodyHtml = renderTemplate(template.body_html, vars)
    const emailType = `${row.sequence_key}_${row.step_number}`

    try {
      // Plantillas "documento completo" (diseño de marca con su propio
      // <html>/<head>/<body>, logo y tipografías) se envían tal cual, sin
      // envolverlas en EmailLayout para no duplicar la estructura HTML.
      const html = template.is_full_document ? bodyHtml : await render(<LifecycleSequenceEmail bodyHtml={bodyHtml} />)

      const { data: resendData, error: resendError } = await resend.emails.send({
        from: process.env.FROM_EMAIL || "SEMZO Privé <hola@semzoprive.com>",
        to: [row.recipient_email],
        subject,
        html,
      })

      if (resendError) {
        console.error(`[cron/send-lifecycle-emails] Resend error ${emailType} to ${row.recipient_email}:`, resendError)
        await supabase
          .from("lifecycle_email_log")
          .update({ status: "failed", error_message: JSON.stringify(resendError) })
          .eq("id", row.id)
        await logEmail({
          recipientEmail: row.recipient_email,
          recipientName: row.recipient_name,
          subject,
          emailType,
          status: "failed",
          errorMessage: JSON.stringify(resendError),
          metadata: { lifecycleLogId: row.id, sequenceKey: row.sequence_key, stepNumber: row.step_number },
        })
        failed++
        continue
      }

      await supabase
        .from("lifecycle_email_log")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", row.id)

      await logEmail({
        recipientEmail: row.recipient_email,
        recipientName: row.recipient_name,
        subject,
        emailType,
        status: "sent",
        resendId: resendData?.id ?? null,
        metadata: { lifecycleLogId: row.id, sequenceKey: row.sequence_key, stepNumber: row.step_number },
      })

      sent++
    } catch (err) {
      console.error(`[cron/send-lifecycle-emails] Error inesperado ${emailType}:`, err)
      await supabase
        .from("lifecycle_email_log")
        .update({ status: "failed", error_message: String(err) })
        .eq("id", row.id)
      failed++
    }
  }

  return NextResponse.json({ ok: true, sent, skipped, failed })
}

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"
import { render } from "@react-email/components"
import { logEmail } from "@/lib/email-logger"
import { MARKETING_LIFECYCLE_SEQUENCES } from "@/lib/lifecycle-emails/enroll"
import { getResendApiKey } from "@/lib/resend-api-key"
import LifecycleSequenceEmail from "@/emails/templates/lifecycle-sequence"
import { isAuthorizedCron } from "@/lib/cron-auth"

/**
 * Cron de envío único y genérico para TODAS las secuencias de lifecycle de
 * la Fase 3 (onboarding, checkout abandonado, renovación, tarjeta por
 * caducar, win-back, reactivación de pausa, back-in-stock, NPS).
 *
 * AISLADO de la Secuencia 1 (leads/newsletter): lee de lifecycle_email_log /
 * lifecycle_email_templates, nunca de email_sequence_log / email_templates.
 *
 * Corre 1x/día (ver vercel.json) — el plan Hobby de Vercel no permite crons
 * con más de una ejecución diaria (un schedule "0 8,14,20 * * *" aquí
 * bloqueaba TODO el deploy del sitio). Efecto: los delays cortos (0h, 1h)
 * de checkout abandonado pueden tardar hasta ~24h en salir en vez de
 * llegar casi en tiempo real. Si se necesita más granularidad, subir a
 * Vercel Pro (hasta 40 crons, sin límite de frecuencia) es el camino.
 */
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const resend = new Resend(getResendApiKey())

async function isUnsubscribed(email: string | null): Promise<boolean> {
  const address = (email || "").toLowerCase().trim()
  if (!address) return false
  const { data: lead } = await supabase.from("leads").select("status").eq("email", address).maybeSingle()
  if (lead?.status === "unsubscribed") return true
  const { data: newsletter } = await supabase
    .from("newsletter_subscriptions")
    .select("status")
    .eq("email", address)
    .maybeSingle()
  return newsletter?.status === "unsubscribed"
}

function renderTemplate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce((str, [key, value]) => str.replaceAll(`{{${key}}}`, value), template)
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
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

    // Red de seguridad: un correo de marketing no sale a quien ya se dio de baja (aunque estuviera programado).
    if ((MARKETING_LIFECYCLE_SEQUENCES as string[]).includes(row.sequence_key) && (await isUnsubscribed(row.recipient_email))) {
      await supabase
        .from("lifecycle_email_log")
        .update({ status: "skipped", error_message: "baja del correo" })
        .eq("id", row.id)
      skipped++
      continue
    }

    // Carrito abandonado: solo sale mientras el intento siga abierto y la persona no sea ya socia activa.
    // Si compro, el intento caduco o se hizo socia entre el aviso 1 y el 3, los avisos pendientes se cancelan.
    if (row.sequence_key === "checkout_abandoned") {
      const { data: intent } = await supabase
        .from("membership_intents")
        .select("status")
        .eq("id", row.entity_id)
        .maybeSingle()
      const { data: active } = row.user_id
        ? await supabase.from("user_memberships").select("id").eq("user_id", row.user_id).eq("status", "active").limit(1)
        : { data: null }
      if (intent?.status !== "initiated" || (active && active.length > 0)) {
        await supabase
          .from("lifecycle_email_log")
          .update({ status: "cancelled", error_message: "el carrito ya no esta abandonado" })
          .eq("id", row.id)
        skipped++
        continue
      }
    }

    if (!template) {
      await supabase.from("lifecycle_email_log").update({ status: "skipped" }).eq("id", row.id)
      skipped++
      continue
    }

    const isMarketing = (MARKETING_LIFECYCLE_SEQUENCES as string[]).includes(row.sequence_key)
    const unsubscribeUrl = `${appUrl}/api/webhooks/unsubscribe?email=${encodeURIComponent((row.recipient_email || "").toLowerCase())}`

    const vars: Record<string, string> = {
      // Solo el primer nombre: "Hola Erika," y no "Hola Erika González,".
      name: (row.recipient_name || "").trim().split(/\s+/)[0] || "",
      nombre: (row.recipient_name || "").trim().split(/\s+/)[0] || "", // alias: las plantillas nuevas usan {{nombre}}
      app_url: appUrl,
      ...(row.metadata || {}),
    }

    const subject = renderTemplate(template.subject, vars)
    // El pie de las plantillas trae "Darse de baja" con href="#" (enlace muerto). En marketing apunta a la baja
    // real; en correos de servicio (renovacion, tarjeta...) no hay baja posible y se quita.
    const deadUnsubscribe = /<span>© 2026 SEMZO PRIVÉ · <\/span><a href="#"([^>]*)>Darse de baja<\/a>/g
    const bodyHtml = renderTemplate(template.body_html, vars).replace(
      deadUnsubscribe,
      isMarketing
        ? `<span>© 2026 SEMZO PRIVÉ · </span><a href="${unsubscribeUrl}"$1>Darse de baja</a>`
        : "<span>© 2026 SEMZO PRIVÉ</span>",
    )
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
        // Baja de un clic (Gmail / Apple Mail) en los correos de marketing.
        ...(isMarketing
          ? { headers: { "List-Unsubscribe": `<${unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } }
          : {}),
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

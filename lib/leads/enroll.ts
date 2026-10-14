/**
 * enrollLead — helper centralizado para meter cualquier contacto en el embudo de leads.
 * Llamar desde cualquier endpoint: registro gratuito, newsletter, invitación ES/EN, referidos.
 *
 * Fuentes válidas:
 *  google_ads | organic_web | social | invitation_es | invitation_en | referral | manual
 */
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"
import { logEmail } from "@/lib/email-logger"
import { getResendApiKey } from "@/lib/resend-api-key"
import { ensureUnsubscribeFooter, rewriteLeadEmailLinks } from "@/lib/email-tracking"

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export type LeadSource =
  | "google_ads"
  | "organic_web"
  | "social"
  | "invitation_es"
  | "invitation_en"
  | "referral"
  | "manual"

interface EnrollOptions {
  email: string
  name?: string
  phone?: string
  source: LeadSource
  utm_campaign?: string
  utm_medium?: string
  utm_content?: string
  referral_code?: string
}

/**
 * Alta idempotente en newsletter_subscriptions. Se llama en el momento del
 * registro para que el contacto aparezca en la lista de newsletter de inmediato,
 * sin esperar a completar la secuencia de 5 emails.
 */
async function subscribeToNewsletter(email: string, name?: string | null, phone?: string | null) {
  const supabase = getServiceClient()
  try {
    await supabase.from("newsletter_subscriptions").upsert(
      {
        email,
        name: name || null,
        phone: phone || null,
        status: "active",
        subscribed_at: new Date().toISOString(),
        preferences: { newArrivals: true, exclusiveOffers: true, styleGuides: true, events: false, membershipUpdates: true },
      },
      { onConflict: "email", ignoreDuplicates: false }
    )
  } catch (e) {
    console.error("[enrollLead] Error en alta de newsletter:", e)
    // No bloquear el flujo de registro si falla el alta de newsletter
  }
}

export async function enrollLead(opts: EnrollOptions): Promise<{ ok: boolean; leadId?: string; reason?: string }> {
  const supabase = getServiceClient()
  const email = opts.email.toLowerCase().trim()

  // Alta inmediata en newsletter (idempotente) — ocurre en TODO registro.
  await subscribeToNewsletter(email, opts.name, opts.phone)

  // 1. Upsert en tabla leads (si ya existe no duplicar, solo actualizar source si era desconocido)
  const { data: existing } = await supabase
    .from("leads")
    .select("id, status")
    .eq("email", email)
    .maybeSingle()

  if (existing) {
    // Si ya está en el embudo (activa o completada) no reiniciar la secuencia
    if (existing.status !== "unsubscribed") {
      return { ok: true, leadId: existing.id, reason: "already_enrolled" }
    }
    // Si se había dado de baja, la reactivamos
    await supabase
      .from("leads")
      .update({ status: "lead", unsubscribed_at: null })
      .eq("id", existing.id)
    return { ok: true, leadId: existing.id, reason: "reactivated" }
  }

  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      email,
      name: opts.name || null,
      phone: opts.phone || null,
      source: opts.source,
      utm_campaign: opts.utm_campaign || null,
      utm_medium: opts.utm_medium || null,
      utm_content: opts.utm_content || null,
      referral_code: opts.referral_code || null,
      status: "lead",
    })
    .select("id")
    .single()

  if (error || !lead) {
    console.error("[enrollLead] Error insertando lead:", error)
    return { ok: false, reason: error?.message }
  }

  // 2. Programar los 5 emails según delay_days de email_templates
  const { data: templates } = await supabase
    .from("email_templates")
    .select("id, delay_days")
    .eq("active", true)
    .order("id")

  if (templates && templates.length > 0) {
    const now = new Date()
    const scheduled = templates.map((t) => {
      const scheduledFor = new Date(now)
      scheduledFor.setDate(scheduledFor.getDate() + t.delay_days)
      return {
        lead_id: lead.id,
        email_number: t.id,
        scheduled_for: scheduledFor.toISOString(),
        status: "pending",
      }
    })
    await supabase.from("email_sequence_log").insert(scheduled)
  }

  // 3. Enviar Email 1 inmediatamente (delay_days = 0)
  try {
    await sendEmailNow(lead.id, email, opts.name || "")
  } catch (e) {
    console.error("[enrollLead] Error enviando Email 1:", e)
    // No bloquear el flujo si falla el primer email
  }

  return { ok: true, leadId: lead.id }
}

async function sendEmailNow(leadId: string, email: string, name: string) {
  const supabase = getServiceClient()
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://semzoprive.com"

  // Obtener template 1
  const { data: template } = await supabase
    .from("email_templates")
    .select("subject, body_html")
    .eq("id", 1)
    .single()

  if (!template) return

  // /api/track/* identifica el envio por el id (uuid) de la fila de email_sequence_log.
  // Antes se pasaba eid=1 (el numero de email), que no coincide con ninguna fila y hacia
  // que el email 1 nunca registrara aperturas ni clics.
  const { data: seqRow } = await supabase
    .from("email_sequence_log")
    .select("id")
    .eq("lead_id", leadId)
    .eq("email_number", 1)
    .maybeSingle()
  const rowId = seqRow?.id as string | undefined

  const ctaUrl = rowId
    ? `${appUrl}/api/track/click?lid=${leadId}&eid=${rowId}&url=${encodeURIComponent(`${appUrl}/membresias`)}`
    : `${appUrl}/membresias`
  const unsubUrl = `${appUrl}/api/webhooks/unsubscribe?lid=${leadId}`
  const trackingPixel = rowId
    ? `<img src="${appUrl}/api/track/open?lid=${leadId}&eid=${rowId}" width="1" height="1" style="display:none" />`
    : ""

  const subject = template.subject.replace(/\{\{name\}\}/g, name || "")
  let bodyHtml = template.body_html
    .replace(/\{\{name\}\}/g, name || "")
    .replace(/\{\{cta_url\}\}/g, ctaUrl)
    .replace(/\{\{unsubscribe_url\}\}/g, unsubUrl)
  if (rowId) {
    bodyHtml = rewriteLeadEmailLinks(bodyHtml, { appUrl, leadId, sequenceRowId: rowId, unsubscribeUrl: unsubUrl })
  }
  // La plantilla del email 1 no trae enlace de baja: se anade uno discreto.
  bodyHtml = ensureUnsubscribeFooter(bodyHtml, unsubUrl) + trackingPixel

  const resend = new Resend(getResendApiKey())
  const fromEmail = process.env.FROM_EMAIL || "SEMZO Privé <hola@semzoprive.com>"

  try {
    const { data: sendData, error: sendError } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject,
      html: bodyHtml,
      headers: {
        "List-Unsubscribe": `<${unsubUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    })
    await logEmail({
      recipientEmail: email,
      recipientName: name,
      subject,
      emailType: "lead_sequence_1",
      status: sendError ? "failed" : "sent",
      errorMessage: sendError ? String(sendError.message || sendError) : null,
      resendId: sendData?.id ?? null,
      metadata: { leadId, email_number: 1 },
    })
  } catch (e: any) {
    await logEmail({
      recipientEmail: email,
      recipientName: name,
      subject,
      emailType: "lead_sequence_1",
      status: "failed",
      errorMessage: String(e?.message || e),
      metadata: { leadId, email_number: 1 },
    })
    throw e
  }

  // Marcar como enviado
  await supabase
    .from("email_sequence_log")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("lead_id", leadId)
    .eq("email_number", 1)
}

/**
 * enrollLead — helper centralizado para meter cualquier contacto en el embudo de leads.
 * Llamar desde cualquier endpoint: registro gratuito, newsletter, invitación ES/EN, referidos.
 *
 * Fuentes válidas:
 *  google_ads | organic_web | social | invitation_es | invitation_en | referral | manual
 */
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"

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

export async function enrollLead(opts: EnrollOptions): Promise<{ ok: boolean; leadId?: string; reason?: string }> {
  const supabase = getServiceClient()
  const email = opts.email.toLowerCase().trim()

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

  const ctaUrl = `${appUrl}/api/track/click?lid=${leadId}&eid=1&url=${encodeURIComponent(`${appUrl}/membresias`)}`
  const unsubUrl = `${appUrl}/api/webhooks/unsubscribe?lid=${leadId}`
  const trackingPixel = `<img src="${appUrl}/api/track/open?lid=${leadId}&eid=1" width="1" height="1" style="display:none" />`

  const subject = template.subject.replace(/\{\{name\}\}/g, name || "")
  const bodyHtml = template.body_html
    .replace(/\{\{name\}\}/g, name || "")
    .replace(/\{\{cta_url\}\}/g, ctaUrl)
    .replace(/\{\{unsubscribe_url\}\}/g, unsubUrl)
    + trackingPixel

  const resend = new Resend(process.env.EMAIL_API_KEY || process.env.RESEND_API_KEY)
  const fromEmail = process.env.FROM_EMAIL || "SEMZO Privé <hola@semzoprive.com>"

  await resend.emails.send({ from: fromEmail, to: email, subject, html: bodyHtml })

  // Marcar como enviado
  await supabase
    .from("email_sequence_log")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("lead_id", leadId)
    .eq("email_number", 1)
}

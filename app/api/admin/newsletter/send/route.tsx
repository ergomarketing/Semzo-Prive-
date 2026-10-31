import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"
import { render } from "@react-email/components"
import { requireAdminAuth } from "@/lib/admin-auth"
import { logEmail } from "@/lib/email-logger"
import { getResendApiKey } from "@/lib/resend-api-key"
import NewsletterEmail from "@/emails/templates/newsletter"
import { personalizeNewsletter } from "@/lib/newsletter-personalize"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MIN_SCHEDULE_AHEAD_MS = 5 * 60 * 1000
const MAX_SCHEDULE_AHEAD_MS = 30 * 24 * 60 * 60 * 1000
const HAS_TIMEZONE = /(?:Z|[+-]\d{2}:\d{2})$/i

/**
 * POST /api/admin/newsletter/send
 *
 * Body:
 *   subject       string        — asunto del email (requerido)
 *   content       string        — cuerpo HTML completo (requerido)
 *   audience      "newsletter" | "leads" | "both"  — audiencia destino (por defecto "both")
 *   raw_html      boolean       — si true, el content es ya HTML completo y no se envuelve en layout genérico
 *   scheduled_at  string        — (opcional) ISO 8601 con zona horaria. Entre 5 minutos y 30 días en el futuro.
 *                                 Si no viene, el envío es inmediato.
 *
 * Responde:
 *   inmediato:   { success: true, sent, failed }
 *   programado:  { success: true, scheduled, failed, campaign_id, scheduled_at }
 */
export async function POST(request: Request) {
  const authError = await requireAdminAuth()
  if (authError) return authError
  try {
    const { subject, content, audience = "both", raw_html = false, scheduled_at } = await request.json()

    if (!subject || !content) {
      return NextResponse.json({ error: "Asunto y contenido son requeridos" }, { status: 400 })
    }

    let scheduledAtIso: string | null = null
    if (scheduled_at !== undefined && scheduled_at !== null && scheduled_at !== "") {
      if (typeof scheduled_at !== "string" || !HAS_TIMEZONE.test(scheduled_at.trim())) {
        return NextResponse.json(
          { error: "scheduled_at debe ser una fecha ISO 8601 con zona horaria (ej. 2026-11-02T10:00:00+01:00)" },
          { status: 400 },
        )
      }
      const scheduledDate = new Date(scheduled_at.trim())
      if (Number.isNaN(scheduledDate.getTime())) {
        return NextResponse.json({ error: "scheduled_at no es una fecha válida" }, { status: 400 })
      }
      const ahead = scheduledDate.getTime() - Date.now()
      if (ahead < MIN_SCHEDULE_AHEAD_MS) {
        return NextResponse.json(
          { error: "La fecha programada debe estar al menos 5 minutos en el futuro" },
          { status: 400 },
        )
      }
      if (ahead > MAX_SCHEDULE_AHEAD_MS) {
        return NextResponse.json(
          { error: "La fecha programada no puede superar los 30 días (límite de Resend)" },
          { status: 400 },
        )
      }
      scheduledAtIso = scheduledDate.toISOString()
    }
    const campaignId = scheduledAtIso ? crypto.randomUUID() : null

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // ── Recopilar destinatarios ─────────────────────────────────────────────

    const recipients: { email: string; name: string | null }[] = []

    if (audience === "newsletter" || audience === "both") {
      const { data: subscribers } = await supabase
        .from("newsletter_subscriptions")
        .select("email, name")
        .eq("status", "active")

      for (const s of subscribers || []) {
        if (!recipients.find((r) => r.email === s.email)) {
          recipients.push({ email: s.email, name: s.name ?? null })
        }
      }
    }

    if (audience === "leads" || audience === "both") {
      const { data: leads } = await supabase
        .from("leads")
        .select("email, name")
        .in("status", ["lead"])   // solo activos, no dados de baja ni ya suscriptores

      for (const l of leads || []) {
        if (!recipients.find((r) => r.email === l.email)) {
          recipients.push({ email: l.email, name: l.name ?? null })
        }
      }
    }

    if (recipients.length === 0) {
      return NextResponse.json({ error: "No hay destinatarios para la audiencia seleccionada", sent: 0 }, { status: 400 })
    }

    const resendApiKey = getResendApiKey()
    if (!resendApiKey) {
      // Modo simulación (entorno sin API key)
      return NextResponse.json({
        success: true,
        sent: scheduledAtIso ? 0 : recipients.length,
        scheduled: scheduledAtIso ? recipients.length : undefined,
        failed: 0,
        simulated: true,
        message: `Simulado: ${recipients.length} destinatarios (RESEND_API_KEY no configurada)`,
      })
    }

    const resend = new Resend(resendApiKey)
    const fromEmail = process.env.FROM_EMAIL || "SEMZO Privé <hola@semzoprive.com>"
    const appUrl    = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://semzoprive.com"

    // ── Enviar a cada destinatario ──────────────────────────────────────────

    let sent      = 0
    let scheduled = 0
    let failed    = 0

    for (const recipient of recipients) {
      try {
        const personalName = recipient.name || ""
        const recipientUnsubscribeUrl = `${appUrl}/api/webhooks/unsubscribe?email=${encodeURIComponent(recipient.email)}`

        // Si el caller envió HTML completo (raw_html=true), solo sustituir variables de
        // personalización y enviar tal cual (ya trae su propia estructura de documento).
        // Si no, el content es cuerpo editorial y se envuelve con el layout de marca compartido.
        const html = raw_html
          ? personalizeNewsletter(content, personalName, recipientUnsubscribeUrl)
          : await render(
              <NewsletterEmail recipientName={personalName || undefined} bodyHtml={content} unsubscribeUrl={recipientUnsubscribeUrl} />,
            )

        const { data: sendData, error } = await resend.emails.send({
          from:    fromEmail,
          to:      [recipient.email],
          subject,
          html,
          headers: {
            "List-Unsubscribe": `<${recipientUnsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
          ...(scheduledAtIso ? { scheduledAt: scheduledAtIso } : {}),
        })

        if (error) {
          console.error(`[newsletter/send] Resend error to ${recipient.email}:`, error)
          failed++
        } else if (scheduledAtIso) {
          scheduled++
        } else {
          sent++
        }

        await logEmail({
          recipientEmail: recipient.email,
          recipientName: personalName || null,
          subject,
          emailType: "newsletter_campaign",
          status: error ? "failed" : scheduledAtIso ? "pending" : "sent",
          errorMessage: error ? String(error.message || error) : null,
          resendId: sendData?.id ?? null,
          metadata: scheduledAtIso
            ? { audience, scheduled_at: scheduledAtIso, campaign_id: campaignId }
            : { audience },
        })
      } catch (err) {
        console.error(`[newsletter/send] Exception sending to ${recipient.email}:`, err)
        failed++
      }
    }

    if (scheduledAtIso) {
      return NextResponse.json({
        success: true,
        scheduled,
        failed,
        campaign_id: campaignId,
        scheduled_at: scheduledAtIso,
      })
    }

    return NextResponse.json({ success: true, sent, failed })
  } catch (error) {
    console.error("[newsletter/send] Unexpected error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al enviar newsletter" },
      { status: 500 },
    )
  }
}

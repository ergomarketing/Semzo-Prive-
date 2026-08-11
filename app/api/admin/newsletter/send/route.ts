import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"
import { requireAdminAuth } from "@/lib/admin-auth"
import { logEmail } from "@/lib/email-logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/admin/newsletter/send
 *
 * Body:
 *   subject   string        — asunto del email (requerido)
 *   content   string        — cuerpo HTML completo (requerido)
 *   audience  "newsletter" | "leads" | "both"  — audiencia destino (por defecto "both")
 *   raw_html  boolean       — si true, el content es ya HTML completo y no se envuelve en layout genérico
 *
 * Responde:
 *   { success: true, sent: number, failed: number }
 */
export async function POST(request: Request) {
  const authError = await requireAdminAuth()
  if (authError) return authError
  try {
    const { subject, content, audience = "both", raw_html = false } = await request.json()

    if (!subject || !content) {
      return NextResponse.json({ error: "Asunto y contenido son requeridos" }, { status: 400 })
    }

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

    const resendApiKey = process.env.EMAIL_API_KEY || process.env.RESEND_API_KEY
    if (!resendApiKey) {
      // Modo simulación (entorno sin API key)
      return NextResponse.json({
        success: true,
        sent: recipients.length,
        failed: 0,
        simulated: true,
        message: `Simulado: ${recipients.length} destinatarios (EMAIL_API_KEY no configurada)`,
      })
    }

    const resend = new Resend(resendApiKey)
    const fromEmail = process.env.FROM_EMAIL || "SEMZO Privé <hola@semzoprive.com>"
    const appUrl    = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://semzoprive.com"

    // ── Enviar a cada destinatario ──────────────────────────────────────────

    let sent   = 0
    let failed = 0

    for (const recipient of recipients) {
      try {
        const personalName = recipient.name || ""

        // Si el caller envió HTML completo (raw_html=true), solo sustituir variables de personalización.
        // Si no, envolver el content en un layout genérico básico.
        const html = raw_html
          ? content
              .replace(/\{\{name\}\}/g, personalName)
              .replace(/\{\{unsubscribe_url\}\}/g, `${appUrl}/api/webhooks/unsubscribe?email=${encodeURIComponent(recipient.email)}`)
          : `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f6f1;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f6f1;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;max-width:600px;width:100%;">
        <tr><td style="background:#1a1f3a;padding:24px 40px;text-align:center;">
          <span style="color:#c9a96e;font-family:Georgia,serif;font-size:18px;letter-spacing:4px;">SEMZO PRIVÉ</span>
        </td></tr>
        <tr><td style="padding:40px;color:#1a1f3a;font-size:16px;line-height:1.7;">
          ${personalName ? `<p>Hola ${personalName},</p>` : ""}
          ${content}
        </td></tr>
        <tr><td style="background:#f9f6f1;padding:24px 40px;text-align:center;font-size:12px;color:#999;">
          © SEMZO Privé ·
          <a href="${appUrl}/api/webhooks/unsubscribe?email=${encodeURIComponent(recipient.email)}" style="color:#999;">Darse de baja</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

        const { data: sendData, error } = await resend.emails.send({
          from:    fromEmail,
          to:      [recipient.email],
          subject,
          html,
        })

        if (error) {
          console.error(`[newsletter/send] Resend error to ${recipient.email}:`, error)
          failed++
        } else {
          sent++
        }

        await logEmail({
          recipientEmail: recipient.email,
          recipientName: personalName || null,
          subject,
          emailType: "newsletter_campaign",
          status: error ? "failed" : "sent",
          errorMessage: error ? String(error.message || error) : null,
          resendId: sendData?.id ?? null,
          metadata: { audience },
        })
      } catch (err) {
        console.error(`[newsletter/send] Exception sending to ${recipient.email}:`, err)
        failed++
      }
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

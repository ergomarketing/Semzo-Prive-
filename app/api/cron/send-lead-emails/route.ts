import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

function renderTemplate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (str, [key, value]) => str.replaceAll(`{{${key}}}`, value),
    template
  )
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const now = new Date().toISOString()

  // Emails pendientes cuya scheduled_for ya pasó
  const { data: pendingEmails, error } = await supabase
    .from("email_sequence_log")
    .select("*, leads(*)")
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

  // Cargar todos los templates activos de Supabase
  const { data: templates, error: tplError } = await supabase
    .from("email_templates")
    .select("id, subject, body_html")
    .eq("active", true)

  if (tplError || !templates) {
    return NextResponse.json({ error: "Error cargando templates" }, { status: 500 })
  }

  const templateMap = Object.fromEntries(templates.map((t) => [t.id, t]))

  let sent = 0
  let skipped = 0
  let failed = 0

  for (const row of pendingEmails) {
    const lead = row.leads as any

    // Saltar si el lead convirtió o se dio de baja
    if (!lead || lead.status === "subscribed" || lead.status === "unsubscribed") {
      await supabase.from("email_sequence_log").update({ status: "skipped" }).eq("id", row.id)
      skipped++
      continue
    }

    const template = templateMap[row.email_number]
    if (!template) {
      skipped++
      continue
    }

    const appUrl = process.env.APP_URL || "https://semzoprive.com"
    const ctaDestination = row.email_number <= 2 ? `${appUrl}/catalog` : `${appUrl}/membresias`

    const vars = {
      name: lead.name || "",
      cta_url: `${appUrl}/api/track/click?lid=${lead.id}&eid=${row.id}&url=${encodeURIComponent(ctaDestination)}`,
      unsubscribe_url: `${appUrl}/api/webhooks/unsubscribe?lid=${lead.id}`,
      tracking_pixel: `<img src="${appUrl}/api/track/open?lid=${lead.id}&eid=${row.id}" width="1" height="1" style="display:none" />`,
    }

    const subject = renderTemplate(template.subject, vars)
    const bodyHtml = renderTemplate(template.body_html, vars)

    // Envolver en el layout base
    const html = `<!DOCTYPE html>
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
          ${bodyHtml}
          ${vars.tracking_pixel}
        </td></tr>
        <tr><td style="background:#f9f6f1;padding:24px 40px;text-align:center;font-size:12px;color:#999;">
          © SEMZO Privé · <a href="${vars.unsubscribe_url}" style="color:#999;">Darse de baja</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

    try {
      const { data: resendData, error: resendError } = await resend.emails.send({
        from: process.env.FROM_EMAIL || "SEMZO Privé <hola@semzoprive.com>",
        to: [lead.email],
        subject,
        html,
      })

      if (resendError) {
        console.error(`[cron] Resend error email_${row.email_number} to ${lead.email}:`, resendError)
        await supabase
          .from("email_sequence_log")
          .update({ status: "failed", error_message: JSON.stringify(resendError) })
          .eq("id", row.id)
        failed++
        continue
      }

      console.log(`[cron] Resend OK email_${row.email_number} to ${lead.email} id=${resendData?.id}`)

      await supabase
        .from("email_sequence_log")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", row.id)

      // Si es el Email 5 (último), migrar automáticamente a newsletter
      if (row.email_number === 5) {
        await supabase
          .from("leads")
          .update({ status: "subscribed", subscribed_at: new Date().toISOString() })
          .eq("id", lead.id)
          .eq("status", "lead") // solo si no se dio de baja durante la secuencia

        // Insertar también en newsletter_subscriptions para unificar la base
        await supabase
          .from("newsletter_subscriptions")
          .upsert(
            {
              email: lead.email,
              name: lead.name || null,
              phone: lead.phone || null,
              status: "active",
              subscribed_at: new Date().toISOString(),
              preferences: { newArrivals: true, exclusiveOffers: true, styleGuides: true, events: false, membershipUpdates: true },
            },
            { onConflict: "email", ignoreDuplicates: false }
          )
      }

      sent++
    } catch (err) {
      await supabase
        .from("email_sequence_log")
        .update({ status: "failed", error_message: String(err) })
        .eq("id", row.id)
      failed++
    }
  }

  return NextResponse.json({ ok: true, sent, skipped, failed })
}

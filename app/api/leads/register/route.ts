import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"
import { Email1Bienvenida } from "@/emails/leads/email-1-bienvenida"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.EMAIL_API_KEY || process.env.RESEND_API_KEY)

// Delays en horas para cada email de la secuencia
const EMAIL_DELAYS_HOURS = [0, 48, 96, 144, 168]

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, name, phone, source = "google_ads", utm_campaign, utm_medium, utm_content } = body

    if (!email) {
      return NextResponse.json({ error: "email requerido" }, { status: 400 })
    }

    // Upsert lead (si ya existe, no duplica)
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .upsert(
        { email: email.toLowerCase().trim(), name, phone, source, utm_campaign, utm_medium, utm_content },
        { onConflict: "email", ignoreDuplicates: false }
      )
      .select()
      .single()

    if (leadError) {
      console.error("[leads/register] Error upsert lead:", leadError)
      return NextResponse.json({ error: leadError.message }, { status: 500 })
    }

    // Si ya era subscribed o unsubscribed no programamos secuencia
    if (lead.status === "subscribed" || lead.status === "unsubscribed") {
      return NextResponse.json({ ok: true, skipped: true, reason: lead.status })
    }

    // Cancelar secuencia anterior pendiente si existía (re-registro)
    await supabase
      .from("email_sequence_log")
      .update({ status: "skipped" })
      .eq("lead_id", lead.id)
      .eq("status", "pending")

    // Programar los 5 emails
    const now = new Date()
    const sequenceRows = EMAIL_DELAYS_HOURS.map((hours, index) => {
      const scheduledFor = new Date(now.getTime() + hours * 60 * 60 * 1000)
      return {
        lead_id: lead.id,
        email_number: index + 1,
        scheduled_for: scheduledFor.toISOString(),
        status: "pending",
      }
    })

    const { data: seqRows, error: seqError } = await supabase
      .from("email_sequence_log")
      .insert(sequenceRows)
      .select()

    if (seqError) {
      console.error("[leads/register] Error insertando secuencia:", seqError)
      return NextResponse.json({ error: seqError.message }, { status: 500 })
    }

    // Enviar Email 1 inmediatamente
    const email1Row = seqRows.find((r) => r.email_number === 1)
    if (email1Row) {
      try {
        const trackingPixelUrl = `${process.env.APP_URL}/api/track/open?lid=${lead.id}&eid=${email1Row.id}`
        const ctaBaseUrl = `${process.env.APP_URL}/api/track/click?lid=${lead.id}&eid=${email1Row.id}&url=`

        await resend.emails.send({
          from: process.env.FROM_EMAIL || "SEMZO Privé <hola@semzoprive.com>",
          to: [lead.email],
          subject: `Bienvenida a algo diferente, ${name || ""}`.trim(),
          react: Email1Bienvenida({
            name: name || "",
            trackingPixelUrl,
            ctaUrl: ctaBaseUrl + encodeURIComponent(`${process.env.APP_URL}/catalog`),
            unsubscribeUrl: `${process.env.APP_URL}/api/webhooks/unsubscribe?lid=${lead.id}`,
          }),
        })

        await supabase
          .from("email_sequence_log")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", email1Row.id)
      } catch (emailErr) {
        console.error("[leads/register] Error enviando email 1:", emailErr)
        await supabase
          .from("email_sequence_log")
          .update({ status: "failed", error_message: String(emailErr) })
          .eq("id", email1Row.id)
      }
    }

    return NextResponse.json({ ok: true, lead_id: lead.id })
  } catch (err) {
    console.error("[leads/register] Error inesperado:", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

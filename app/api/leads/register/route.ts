import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

    // El Email 1 (delay 0h) queda con scheduled_for = ahora, igual que el resto
    // de la secuencia: lo recoge el cron send-lead-emails en su próxima ejecución,
    // que renderiza el copy desde la tabla email_templates (fuente única de verdad).
    return NextResponse.json({ ok: true, lead_id: lead.id })
  } catch (err) {
    console.error("[leads/register] Error inesperado:", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { isAllowedDestination } from "@/lib/email-tracking"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Anade utm_* al destino (para que GA4 y la atribucion vean "email"), sin pisar los existentes. */
function withEmailUtm(destination: string, campaign: string): string {
  if (/[?&]utm_source=/i.test(destination)) return destination
  const [base, hash] = destination.split("#")
  const sep = base.includes("?") ? "&" : "?"
  const utm = `utm_source=email&utm_medium=lead_sequence&utm_campaign=${encodeURIComponent(campaign)}`
  return `${base}${sep}${utm}${hash ? `#${hash}` : ""}`
}

/**
 * Redireccionador de clics de la secuencia de leads.
 *  - eid = id (uuid) de la fila de email_sequence_log; registra el primer clic.
 *  - url = destino; solo se admiten URLs de semzoprive.com (no es un redireccionador abierto).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const eid = searchParams.get("eid")
  const url = searchParams.get("url")

  const fallback = process.env.APP_URL || "https://semzoprive.com"
  let destination = url && isAllowedDestination(url) ? url : fallback

  if (eid && UUID.test(eid)) {
    const { data: row, error } = await supabase
      .from("email_sequence_log")
      .select("email_number, clicked_at")
      .eq("id", eid)
      .maybeSingle()

    if (error) {
      console.error("[track/click] error leyendo la fila:", error.message)
    } else if (row) {
      if (!row.clicked_at) {
        const { error: updError } = await supabase
          .from("email_sequence_log")
          .update({ clicked_at: new Date().toISOString() })
          .eq("id", eid)
          .is("clicked_at", null) // solo primer clic
        if (updError) console.error("[track/click] error guardando el clic:", updError.message)
      }
      destination = withEmailUtm(destination, `lead_email_${row.email_number}`)
    }
  }

  return NextResponse.redirect(destination, { status: 302 })
}

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Llamar desde el webhook de Stripe cuando un lead se convierte en socia
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: "email requerido" }, { status: 400 })

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .update({ status: "subscribed", subscribed_at: new Date().toISOString() })
      .eq("email", email.toLowerCase().trim())
      .select()
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 })
    }

    // Cancelar todos los emails pendientes de la secuencia
    await supabase
      .from("email_sequence_log")
      .update({ status: "skipped" })
      .eq("lead_id", lead.id)
      .eq("status", "pending")

    return NextResponse.json({ ok: true, lead_id: lead.id })
  } catch (err) {
    console.error("[leads/convert]", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

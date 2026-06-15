import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: baja desde el enlace del email (lid = lead_id en la URL)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lid = searchParams.get("lid")

  if (!lid) {
    return new NextResponse("Enlace inválido", { status: 400 })
  }

  await processUnsubscribe(lid)

  return new NextResponse(
    `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Baja confirmada</title>
    <style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#fff0f3;}
    .box{text-align:center;max-width:400px;padding:40px;background:#fff;border-radius:8px;}
    h1{color:#1a1a4b;font-size:1.4rem;margin-bottom:12px;}p{color:#666;font-size:.95rem;}</style></head>
    <body><div class="box"><h1>Te has dado de baja correctamente</h1>
    <p>No volverás a recibir emails de SEMZO Privé.<br>Si fue un error, puedes volver a suscribirte en cualquier momento.</p></div></body></html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  )
}

// POST: baja programática (desde Resend webhook o API propia)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const lid = body.lead_id
    const email = body.email

    if (lid) {
      await processUnsubscribe(lid)
    } else if (email) {
      const { data: lead } = await supabase
        .from("leads")
        .select("id")
        .eq("email", email.toLowerCase().trim())
        .single()
      if (lead) await processUnsubscribe(lead.id)
    } else {
      return NextResponse.json({ error: "lead_id o email requerido" }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[unsubscribe]", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

async function processUnsubscribe(leadId: string) {
  await supabase
    .from("leads")
    .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
    .eq("id", leadId)

  await supabase
    .from("email_sequence_log")
    .update({ status: "skipped" })
    .eq("lead_id", leadId)
    .eq("status", "pending")
}

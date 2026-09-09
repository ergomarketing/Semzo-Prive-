import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: baja desde el enlace del email (lid = lead_id, o email, en la URL)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lid = searchParams.get("lid")
  const email = searchParams.get("email")

  if (!lid && !email) {
    return new NextResponse("Enlace inválido", { status: 400 })
  }

  await processUnsubscribeRequest({ lid, email })

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

// POST: baja programática (API propia) y baja "One-Click" (RFC 8058) que los
// clientes de correo disparan directamente sobre la URL del header List-Unsubscribe,
// identificando al lead solo por query params, sin depender del body.
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    let lid = searchParams.get("lid")
    let email = searchParams.get("email")

    if (!lid && !email) {
      const body = await req.json().catch(() => ({}))
      lid = body.lead_id || null
      email = body.email || null
    }

    if (!lid && !email) {
      return NextResponse.json({ error: "lead_id o email requerido" }, { status: 400 })
    }

    await processUnsubscribeRequest({ lid, email })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[unsubscribe]", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

async function processUnsubscribeRequest({ lid, email }: { lid?: string | null; email?: string | null }) {
  let leadId = lid || null

  if (!leadId && email) {
    const { data: lead } = await supabase
      .from("leads")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle()
    leadId = lead?.id ?? null
  }

  if (leadId) {
    await processUnsubscribe(leadId)
  }

  // Baja también de la newsletter si el email coincide, aunque no haya lead asociado.
  if (email) {
    await supabase
      .from("newsletter_subscriptions")
      .update({ status: "unsubscribed" })
      .eq("email", email.toLowerCase().trim())
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

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { applyResendEvent, verifyResendSignature, type ResendWebhookEvent } from "@/lib/resend-webhook"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/webhooks/resend
 *
 * Recibe los eventos de Resend (sent, delivered, bounced, complained, opened, clicked),
 * verifica la firma con RESEND_WEBHOOK_SECRET y actualiza el registro de email_logs
 * localizado por resend_id.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) {
    console.error("[webhooks/resend] Falta RESEND_WEBHOOK_SECRET")
    return NextResponse.json({ error: "Webhook no configurado" }, { status: 500 })
  }

  const payload = await request.text()
  const svixId = request.headers.get("svix-id")

  const isValid = verifyResendSignature({
    payload,
    svixId,
    svixTimestamp: request.headers.get("svix-timestamp"),
    svixSignature: request.headers.get("svix-signature"),
    secret,
  })
  if (!isValid) {
    return NextResponse.json({ error: "Firma no válida" }, { status: 401 })
  }

  let event: ResendWebhookEvent
  try {
    event = JSON.parse(payload)
  } catch {
    return NextResponse.json({ error: "JSON no válido" }, { status: 400 })
  }

  const emailId = event.data?.email_id
  if (!emailId) return NextResponse.json({ ignored: "sin email_id" })

  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data: row, error: findError } = await supabase
      .from("email_logs")
      .select("id, status, sent_at, error_message, metadata")
      .eq("resend_id", emailId)
      .limit(1)
      .maybeSingle()

    if (findError) throw findError
    if (!row) return NextResponse.json({ ignored: "email no registrado en email_logs" })

    const update = applyResendEvent(row, event, svixId)
    if (!update) return NextResponse.json({ ignored: event.type })

    const { error: updateError } = await supabase.from("email_logs").update(update).eq("id", row.id)
    if (updateError) throw updateError

    return NextResponse.json({ ok: true, type: event.type, status: update.status })
  } catch (error) {
    // 500 para que Resend reintente el evento
    console.error("[webhooks/resend] Error procesando el evento:", error)
    return NextResponse.json({ error: "Error procesando el evento" }, { status: 500 })
  }
}

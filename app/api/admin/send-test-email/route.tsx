import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"
import { render } from "@react-email/components"
import { requireAdminAuth } from "@/lib/admin-auth"
import { logEmail } from "@/lib/email-logger"
import { getResendApiKey } from "@/lib/resend-api-key"
import { EmailServiceProduction } from "@/app/lib/email-service-production"
import LifecycleSequenceEmail from "@/emails/templates/lifecycle-sequence"
import { renderReturnReminderBrandEmail } from "@/emails/templates/return-reminder-brand"

/**
 * Disparo manual de CUALQUIER email del sistema (lifecycle + transaccional)
 * hacia una dirección de prueba, para verificación visual desde /admin.
 * NO toca la lógica de envío real (crons/orquestador) — solo la reutiliza
 * o replica su mismo patrón de render, siempre con datos de ejemplo.
 */

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const resend = new Resend(getResendApiKey())
const FROM_EMAIL = process.env.FROM_EMAIL || "SEMZO Privé <hola@semzoprive.com>"

// Emails "de código" (no viven en lifecycle_email_templates).
const CODE_EMAILS = [
  { key: "shipment_in_transit", label: "Envío en tránsito (marca)" },
  { key: "shipment_delivered", label: "Entrega confirmada" },
  { key: "membership_cancelled", label: "Cancelación de membresía" },
  { key: "return_reminder", label: "Recordatorio de devolución (-2 días)" },
] as const

function renderTemplate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce((str, [key, value]) => str.replaceAll(`{{${key}}}`, value), template)
}

// Valores de ejemplo razonables para placeholders comunes; cualquier
// placeholder desconocido cae en un texto genérico para que nunca quede
// un {{...}} sin resolver en el correo de prueba.
function sampleValueFor(key: string): string {
  const known: Record<string, string> = {
    name: "Erika",
    nombre: "Erika",
    app_url: process.env.APP_URL || "https://semzoprive.com",
    nombre_bolso: "Chanel Classic Flap",
    bag_name: "Chanel Classic Flap",
    fecha_devolucion: "viernes, 20 de septiembre",
    membership_type: "Essentiel",
    end_date: "31 de diciembre de 2026",
    amount: "59,00€",
    days_remaining: "3",
  }
  return known[key] || "Ejemplo"
}

function extractPlaceholders(...texts: string[]): string[] {
  const keys = new Set<string>()
  for (const text of texts) {
    for (const match of text.matchAll(/\{\{(\w+)\}\}/g)) keys.add(match[1])
  }
  return Array.from(keys)
}

export async function GET(request: NextRequest) {
  const authError = await requireAdminAuth(request)
  if (authError) return authError

  const { data: templates, error } = await supabase
    .from("lifecycle_email_templates")
    .select("sequence_key, step_number, name, subject")
    .eq("active", true)
    .order("sequence_key")
    .order("step_number")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    lifecycleEmails: templates || [],
    codeEmails: CODE_EMAILS,
  })
}

export async function POST(request: NextRequest) {
  const authError = await requireAdminAuth(request)
  if (authError) return authError

  const body = await request.json()
  const { to, kind, sequenceKey, stepNumber, codeKey } = body as {
    to?: string
    kind?: "lifecycle" | "code"
    sequenceKey?: string
    stepNumber?: number
    codeKey?: string
  }

  if (!to) {
    return NextResponse.json({ error: "Falta el email de destino" }, { status: 400 })
  }

  try {
    if (kind === "lifecycle") {
      if (!sequenceKey || !stepNumber) {
        return NextResponse.json({ error: "Faltan sequenceKey/stepNumber" }, { status: 400 })
      }

      const { data: template, error: tplError } = await supabase
        .from("lifecycle_email_templates")
        .select("subject, body_html, is_full_document")
        .eq("sequence_key", sequenceKey)
        .eq("step_number", stepNumber)
        .single()

      if (tplError || !template) {
        return NextResponse.json({ error: "Plantilla no encontrada" }, { status: 404 })
      }

      const placeholders = extractPlaceholders(template.subject, template.body_html)
      const vars = Object.fromEntries(placeholders.map((key) => [key, sampleValueFor(key)]))

      const subject = `[PRUEBA] ${renderTemplate(template.subject, vars)}`
      const bodyHtml = renderTemplate(template.body_html, vars)
      const html = template.is_full_document ? bodyHtml : await render(<LifecycleSequenceEmail bodyHtml={bodyHtml} />)

      const { error: sendError } = await resend.emails.send({ from: FROM_EMAIL, to, subject, html })
      if (sendError) {
        return NextResponse.json({ error: JSON.stringify(sendError) }, { status: 500 })
      }

      await logEmail({
        recipientEmail: to,
        recipientName: "Prueba manual",
        subject,
        emailType: `${sequenceKey}_${stepNumber}_test`,
        status: "sent",
        metadata: { manualTest: true, sequenceKey, stepNumber },
      })

      return NextResponse.json({ ok: true })
    }

    if (kind === "code") {
      const emailService = new EmailServiceProduction()

      switch (codeKey) {
        case "shipment_in_transit": {
          const ok = await emailService.sendShipmentInTransitEmail({
            userEmail: to,
            userName: "Erika Ejemplo",
            bagName: "Chanel Classic Flap",
          })
          if (!ok) return NextResponse.json({ error: "El envío falló" }, { status: 500 })
          return NextResponse.json({ ok: true })
        }
        case "shipment_delivered": {
          const ok = await emailService.sendShipmentDeliveredEmail({
            userEmail: to,
            userName: "Erika Ejemplo",
            bagName: "Chanel Classic Flap",
            membershipEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          })
          if (!ok) return NextResponse.json({ error: "El envío falló" }, { status: 500 })
          return NextResponse.json({ ok: true })
        }
        case "membership_cancelled": {
          await emailService.sendMembershipCancelledEmail({
            userName: "Erika Ejemplo",
            userEmail: to,
            membershipType: "Essentiel",
            endDate: "31 de diciembre de 2026",
          })
          return NextResponse.json({ ok: true })
        }
        case "return_reminder": {
          const html = renderReturnReminderBrandEmail({
            name: "Erika",
            bagName: "Chanel Classic Flap",
            returnDate: "viernes, 20 de septiembre",
          })
          const { error: sendError } = await resend.emails.send({
            from: FROM_EMAIL,
            to,
            subject: "[PRUEBA] Tu Chanel Classic Flap vuelve en 2 días",
            html,
          })
          if (sendError) return NextResponse.json({ error: JSON.stringify(sendError) }, { status: 500 })
          return NextResponse.json({ ok: true })
        }
        default:
          return NextResponse.json({ error: "codeKey desconocido" }, { status: 400 })
      }
    }

    return NextResponse.json({ error: "kind inválido" }, { status: 400 })
  } catch (err) {
    console.error("[send-test-email] Error:", err)
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error desconocido" }, { status: 500 })
  }
}

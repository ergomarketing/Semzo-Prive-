import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"
import { render } from "@react-email/components"
import { requireAdminAuth } from "@/lib/admin-auth"
import { logEmail } from "@/lib/email-logger"
import { getResendApiKey } from "@/lib/resend-api-key"
import { EmailServiceProduction } from "@/app/lib/email-service-production"
import LifecycleSequenceEmail from "@/emails/templates/lifecycle-sequence"
import { buildAccountConfirmationEmail, buildBagPassPurchaseUserEmail, buildMemberWelcomeEmail, buildMembershipCancelledEmail, buildColeccionaReadyEmail, buildColeccionaSaleEmail, buildSepaPreNoticeEmail, buildSepaExecutionEmail, buildSepaChargeFailedEmail, buildSepaManualPaidEmail, buildNextBagQueuedEmail, buildGiftCardRecipientEmail, buildWithdrawalProcessedEmail, buildReturnReceivedEmail, buildReturnLabelReminderEmail, buildPickupConfirmedEmail, buildSuspendedReturnEmail, buildPaymentFailedEmail, buildPaymentReceiptEmail, buildRefundEmail, buildMembershipRenewedEmail } from "@/app/lib/email-service-production"
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

// Emails "de código" (no viven en lifecycle_email_templates), agrupados por tema. Los que tienen la plantilla
// de Erika se prueban con su diseño real. Los marcados pending: true son HUECOS vacios: su plantilla aun no
// esta cargada (el diseño generico antiguo se apago en la prueba). Se rellenan uno a uno cuando Erika pasa el HTML.
const CODE_EMAILS = [
  { group: "Cuenta y membresía", key: "welcome", label: "1 · Activación de cuenta: confirmar correo (antes lo mandaba Supabase)" },
  { group: "Cuenta y membresía", key: "membership_activated", label: "2 · Bienvenida de socia (membresía activa, también al reactivar)" },
  { group: "Cuenta y membresía", key: "membership_cancelled", label: "Cancelación de membresía" },
  { group: "Pagos", key: "payment_receipt", label: "Recibo de pago" },
  { group: "Pagos", key: "refund", label: "Reembolso" },
  { group: "Pagos", key: "membership_renewed", label: "Recibo de renovación" },
  { group: "Pagos", key: "payment_failed_1", label: "Pago fallido · aviso 1" },
  { group: "Pagos", key: "payment_failed_2", label: "Pago fallido · aviso 2" },
  { group: "Pagos", key: "payment_failed_3", label: "Pago fallido · aviso 3" },
  { group: "Pagos", key: "bag_pass_purchased", label: "Pase Bolso listo" },
  { group: "Pagos", key: "gift_card_recipient", label: "Gift card recibida" },
  { group: "Pagos", key: "sepa_pre_execution", label: "Aviso previo de cargo SEPA" },
  { group: "Pagos", key: "sepa_execution", label: "Cargo SEPA ejecutado" },
  { group: "Pagos", key: "sepa_charge_failed", label: "Cargo SEPA rechazado (fondos insuficientes)" },
  { group: "Pagos", key: "suspended_return", label: "Membresía suspendida con bolso en casa: devolución (texto provisional)" },
  { group: "Pagos", key: "sepa_manual_paid", label: "Pago manual recibido tras cargo rechazado" },
  { group: "Colecciona", key: "colecciona_sale", label: "Venta Colecciona (compra completada)" },
  { group: "Colecciona", key: "colecciona_ready", label: "Colecciona: ya puedes finalizar la compra" },
  { group: "Próximo bolso", key: "next_bag_queued", label: "Próximo bolso reservado (en cola, sale al recibir la devolución)" },
  { group: "Próximo bolso", key: "next_bag_shipping", label: "Tu próximo bolso sale hacia ti (devolución recibida)", pending: true },
  { group: "Colecciona", key: "colecciona_withdrawal", label: "Desistimiento: compra anulada y reembolso" },
  { group: "Envíos y devoluciones", key: "return_received", label: "Devolución recibida" },
  { group: "Envíos y devoluciones", key: "return_not_dropped", label: "Aviso a la socia: entrega tu paquete en Correos (etiqueta sin escanear)" },
  { group: "Envíos y devoluciones", key: "pickup_confirmed", label: "Recogida confirmada (día y franja)" },
  { group: "Envíos y devoluciones", key: "shipment_in_transit", label: "Envío en camino · cambio de bolso (devolución recibida)" },
  { group: "Envíos y devoluciones", key: "shipment_in_transit_first", label: "Envío en camino · primer bolso (socia nueva)" },
  { group: "Envíos y devoluciones", key: "shipment_delivered", label: "Entrega confirmada" },
  { group: "Envíos y devoluciones", key: "return_reminder", label: "Recordatorio de devolución (-2 días)" },
] as { group: string; key: string; label: string; pending?: boolean }[]

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
    tier: "Petite",
    precio: "59",
    fecha_renovacion: "17 de noviembre de 2026",
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

const TEST_SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://semzoprive.com"

/** Construye {asunto, html} de los correos de servicio con datos de ejemplo. */
async function buildServiceTestEmail(key: string): Promise<{ subject: string; html: string } | null> {
  switch (key) {
    case "welcome": {
      const built = buildAccountConfirmationEmail({
        confirmationUrl: `${TEST_SITE}/auth/callback?token_hash=EJEMPLO&type=signup`,
      })
      // Aviso visible solo en la PRUEBA: el enlace del boton es de ejemplo y nunca funciona. Un registro real manda uno valido.
      const note =
        '<div style="background:#fff3cd;color:#7a5a00;font:13px Arial,sans-serif;padding:10px 16px;text-align:center;">' +
        "PRUEBA: el botón lleva un enlace de ejemplo y no funciona. Un registro real envía un enlace válido." +
        "</div>"
      return { subject: built.subject, html: built.html.replace(/(<body[^>]*>)/i, `$1${note}`) }
    }
    case "membership_activated":
      return buildMemberWelcomeEmail({ name: "Erika", tier: "Petite" })
    case "membership_cancelled":
      return buildMembershipCancelledEmail({ userName: "Erika Ejemplo", membershipType: "L'Essentiel", endDate: "31 de diciembre de 2026" })
    case "payment_failed_1":
    case "payment_failed_2":
    case "payment_failed_3":
      return buildPaymentFailedEmail(Number(key.slice(-1)) as 1 | 2 | 3, {
        fullName: "ROSA Gonzalez",
        membershipType: "petite",
        updatePaymentUrl: `${TEST_SITE}/dashboard/payment-method`,
      })
    case "payment_receipt":
      return buildPaymentReceiptEmail({
        fullName: "ROSA Gonzalez",
        amount: 59,
        paymentDate: "19 de octubre de 2026",
        concept: "Membresía L'Essentiel",
        paymentMethod: "Mastercard ···· 2029",
      })
    case "refund":
      return buildRefundEmail({ fullName: "ROSA Gonzalez", amount: 1, concept: "tu compra del Furla Club 2 Mini" })
    case "membership_renewed":
      return buildMembershipRenewedEmail({
        fullName: "ROSA Gonzalez",
        membershipType: "essentiel",
        amount: 59,
        nextRenewalDate: "19 de noviembre de 2026",
      })
    default:
      return null
  }
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

      const subject = renderTemplate(template.subject, vars)
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
      if (CODE_EMAILS.find((e) => e.key === codeKey)?.pending) {
        return NextResponse.json({ error: "Este correo aun no tiene plantilla cargada." }, { status: 400 })
      }
      const emailService = new EmailServiceProduction()

      switch (codeKey) {
        case "shipment_in_transit":
        case "shipment_in_transit_first": {
          const ok = await emailService.sendShipmentInTransitEmail({
            userEmail: to,
            userName: "Erika Ejemplo",
            bagName: "Chanel Classic Flap",
            trackingNumber: "PQCZV8980000001A",
            fromSwap: codeKey === "shipment_in_transit",
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
        case "return_reminder": {
          const html = renderReturnReminderBrandEmail({
            name: "Erika",
            bagName: "Chanel Classic Flap",
            returnDate: "viernes, 20 de septiembre",
          })
          const { error: sendError } = await resend.emails.send({
            from: FROM_EMAIL,
            to,
            subject: "Tu Chanel Classic Flap vuelve en 2 días",
            html,
          })
          if (sendError) return NextResponse.json({ error: JSON.stringify(sendError) }, { status: 500 })
          return NextResponse.json({ ok: true })
        }
        default: {
          const built = await buildServiceTestEmail(codeKey || "")
          if (!built) return NextResponse.json({ error: "codeKey desconocido" }, { status: 400 })
          const { error: sendError } = await resend.emails.send({
            from: FROM_EMAIL,
            to,
            subject: built.subject,
            html: built.html,
          })
          if (sendError) return NextResponse.json({ error: JSON.stringify(sendError) }, { status: 500 })
          return NextResponse.json({ ok: true })
        }
      }
    }

    return NextResponse.json({ error: "kind inválido" }, { status: 400 })
  } catch (err) {
    console.error("[send-test-email] Error:", err)
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error desconocido" }, { status: 500 })
  }
}

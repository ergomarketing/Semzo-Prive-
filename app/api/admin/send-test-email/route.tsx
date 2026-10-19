import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"
import { render } from "@react-email/components"
import { requireAdminAuth } from "@/lib/admin-auth"
import { logEmail } from "@/lib/email-logger"
import { getResendApiKey } from "@/lib/resend-api-key"
import { EmailServiceProduction } from "@/app/lib/email-service-production"
import LifecycleSequenceEmail from "@/emails/templates/lifecycle-sequence"
import MembershipRenewedEmail from "@/emails/templates/membership-renewed"
import DunningEmail from "@/emails/templates/dunning"
import GiftCardRecipientEmail from "@/emails/templates/gift-card-recipient"
import SepaPreExecutionEmail from "@/emails/templates/sepa-pre-execution"
import SepaExecutionEmail from "@/emails/templates/sepa-execution"
import OwnershipCompletedEmail from "@/emails/templates/ownership-completed"
import { getMessages } from "@/emails/messages"
import { BRAND, emailDetailList, emailInfoBox, renderBrandEmail } from "@/app/lib/email-layout"
import { renderColeccionaSaleMemberEmail } from "@/lib/ownership-sale-close"
import { buildAccountConfirmationEmail, buildBagPassPurchaseUserEmail, buildMemberWelcomeEmail } from "@/app/lib/email-service-production"
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
  { group: "Cuenta y membresía", key: "membership_expiring", label: "Aviso de membresía a punto de terminar", pending: true },
  { group: "Cuenta y membresía", key: "membership_cancelled", label: "Cancelación de membresía", pending: true },
  { group: "Pagos", key: "payment_receipt", label: "Recibo de pago", pending: true },
  { group: "Pagos", key: "refund", label: "Reembolso", pending: true },
  { group: "Pagos", key: "membership_renewed", label: "Recibo de renovación", pending: true },
  { group: "Pagos", key: "payment_failed_1", label: "Pago fallido · aviso 1", pending: true },
  { group: "Pagos", key: "payment_failed_2", label: "Pago fallido · aviso 2", pending: true },
  { group: "Pagos", key: "payment_failed_3", label: "Pago fallido · aviso 3", pending: true },
  { group: "Pagos", key: "bag_pass_purchased", label: "Pase Bolso listo" },
  { group: "Pagos", key: "gift_card_recipient", label: "Gift card recibida", pending: true },
  { group: "Pagos", key: "sepa_pre_execution", label: "Aviso previo de cargo SEPA", pending: true },
  { group: "Pagos", key: "sepa_execution", label: "Cargo SEPA ejecutado", pending: true },
  { group: "Colecciona", key: "colecciona_sale", label: "Venta Colecciona (compra completada)", pending: true },
  { group: "Colecciona", key: "colecciona_ready", label: "Colecciona: ya puedes finalizar la compra", pending: true },
  { group: "Envíos y devoluciones", key: "shipment_in_transit", label: "Envío en tránsito (marca)" },
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
  const t = getMessages("es")
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
    case "membership_expiring": {
      const service = new EmailServiceProduction()
      return {
        subject: "Tu membresía Petite expira pronto - Semzo Privé",
        html: service.renderMembershipExpiringHtml({
          userName: "Erika Ejemplo",
          membershipType: "Petite",
          endDate: "17 de noviembre de 2026",
          daysRemaining: 3,
        }),
      }
    }
    case "membership_renewed":
      return {
        subject: "Tu factura de Semzo Privé · J3QQFECB-0055",
        html: await render(
          <MembershipRenewedEmail
            name="Erika"
            amount="19,99"
            invoiceNumber="J3QQFECB-0055"
            invoiceUrl={`${TEST_SITE}/dashboard`}
            dashboardUrl={`${TEST_SITE}/dashboard`}
          />,
        ),
      }
    case "payment_failed_1":
    case "payment_failed_2":
    case "payment_failed_3": {
      const step = Number(key.slice(-1)) as 1 | 2 | 3
      const copy = step === 1 ? t.dunning.e1 : step === 2 ? t.dunning.e2 : t.dunning.e3
      return {
        subject: copy.subject,
        html: await render(
          <DunningEmail
            step={step}
            name="Erika"
            membershipLabel="Petite"
            bagName="Chanel Classic Flap"
            updatePaymentUrl={`${TEST_SITE}/dashboard/membresia`}
          />,
        ),
      }
    }
    case "bag_pass_purchased":
      return buildBagPassPurchaseUserEmail({
        userName: "Erika Ejemplo",
        passTier: "lessentiel",
        quantity: 1,
        totalPrice: 52,
        paymentMethod: "card",
      })
    case "gift_card_recipient":
      return {
        subject: t.giftCardRecipient.subject("100"),
        html: await render(
          <GiftCardRecipientEmail
            recipientName="Erika"
            personalMessage="Para que elijas el bolso que más te guste."
            code="SEMZO-EJEMPLO-1234"
            amountEuros="100"
            redeemUrl={`${TEST_SITE}/dashboard/gift-cards`}
          />,
        ),
      }
    case "sepa_pre_execution":
      return {
        subject: "Aviso Previo a Ejecución de Mandato SEPA - Acción Requerida",
        html: await render(
          <SepaPreExecutionEmail
            customerName="Erika"
            bagName="Chanel Classic Flap"
            rentalEndDate="viernes, 20 de septiembre"
            amountDue={2950}
            reservationId="00000000-0000-0000-0000-000000000000"
            termsUrl={`${TEST_SITE}/legal/terms`}
            dashboardUrl={`${TEST_SITE}/dashboard/mis-reservas`}
          />,
        ),
      }
    case "sepa_execution":
      return {
        subject: "Confirmación de Cargo SEPA Ejecutado - Semzo Privé",
        html: await render(
          <SepaExecutionEmail
            customerName="Erika"
            bagName="Chanel Classic Flap"
            amountCharged={2950}
            reservationId="00000000-0000-0000-0000-000000000000"
            paymentIntentId="pi_ejemplo"
            termsUrl={`${TEST_SITE}/legal/terms`}
          />,
        ),
      }
    case "colecciona_sale":
      return {
        subject: "Chanel 2.55 Reissue ya es tuyo · Semzo Privé",
        html: renderColeccionaSaleMemberEmail({
          firstName: "Erika",
          bagLabel: "Chanel 2.55 Reissue",
          paid: "4.360,50 €",
          invoiceUrl: `${TEST_SITE}/dashboard`,
          hasContract: true,
        }),
      }
    case "colecciona_ready":
      return {
        subject: t.ownershipCompleted.subject,
        html: await render(
          <OwnershipCompletedEmail name="Erika" bagBrand="Chanel" bagName="2.55 Reissue" ctaUrl={`${TEST_SITE}/dashboard`} />,
        ),
      }
    case "payment_receipt":
      // BORRADOR: este correo aun no existe (hoy el recibo lo manda Stripe). Punto de partida para tu plantilla.
      return {
        subject: "Recibo de tu pago · Semzo Privé",
        html: renderBrandEmail({
          preheader: "Hemos recibido tu pago.",
          eyebrow: "Recibo de pago",
          heading: "Hemos recibido tu pago",
          bodyHtml: `
            <p style="margin:0 0 8px 0;">Hola Erika, este es el resumen de tu pago.</p>
            ${emailDetailList([
              { label: "Concepto", value: "Pase Bolso L'Essentiel" },
              { label: "Importe", value: "52,00 €" },
              { label: "Fecha", value: "19 de octubre de 2026" },
              { label: "Método de pago", value: "Tarjeta" },
            ])}
            ${emailInfoBox("Puedes descargar tu factura desde el botón de abajo.")}
          `,
          cta: { label: "Ver mi factura", url: `${TEST_SITE}/dashboard` },
        }),
      }
    case "refund":
      // BORRADOR: este correo aun no existe (no hay manejo de reembolsos). Punto de partida para tu plantilla.
      return {
        subject: "Tu reembolso está en camino · Semzo Privé",
        html: renderBrandEmail({
          preheader: "Hemos emitido tu reembolso.",
          eyebrow: "Reembolso",
          heading: "Hemos emitido tu reembolso",
          bodyHtml: `
            <p style="margin:0 0 8px 0;">Hola Erika, hemos emitido el reembolso de tu pago.</p>
            ${emailDetailList([
              { label: "Importe reembolsado", value: "52,00 €" },
              { label: "Plazo", value: "5-10 días hábiles, según tu banco" },
            ])}
          `,
          cta: { label: "Ir a mi cuenta", url: `${TEST_SITE}/dashboard` },
        }),
      }
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
      if (CODE_EMAILS.find((e) => e.key === codeKey)?.pending) {
        return NextResponse.json({ error: "Este correo aun no tiene plantilla cargada." }, { status: 400 })
      }
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
        default: {
          const built = await buildServiceTestEmail(codeKey || "")
          if (!built) return NextResponse.json({ error: "codeKey desconocido" }, { status: 400 })
          const { error: sendError } = await resend.emails.send({
            from: FROM_EMAIL,
            to,
            subject: `[PRUEBA] ${built.subject}`,
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

interface EmailConfig {
  provider: "resend" | "sendgrid" | "mailgun" | "smtp"
  apiKey: string
  fromEmail: string
  fromName: string
}

interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
  customerName?: string
  confirmationUrl?: string
  name?: string
  phone?: string
  preferences?: any
  bagName?: string
  reservationDate?: string
  reservationId?: string
  /** true solo para marketing: añade la cabecera de baja (List-Unsubscribe). Los correos de servicio no la llevan. */
  marketing?: boolean
  /** Adjuntos (Resend): contenido en base64. */
  attachments?: Array<{ filename: string; content: string }>
}

import { emailQueue } from "./email-queue"
import { BAG_PASS_PURCHASED_HTML } from "@/lib/service-emails/bag-pass-purchased"
import { MEMBERSHIP_CANCELLED_HTML, MEMBERSHIP_CANCELLED_SUBJECT } from "@/lib/service-emails/membership-cancelled"
import { COLECCIONA_READY_HTML, COLECCIONA_READY_SUBJECT } from "@/lib/service-emails/colecciona-ready"
import { MEMBER_WELCOME_HTML, MEMBER_WELCOME_SUBJECT } from "@/lib/service-emails/member-welcome"
import { ACCOUNT_CONFIRMATION_HTML, ACCOUNT_CONFIRMATION_SUBJECT } from "@/lib/service-emails/account-confirmation"
import { firstNameOf, renderServiceTemplate } from "@/lib/service-emails/render"
import { GIFT_CARD_RECIPIENT_HTML } from "@/lib/service-emails/gift-card-recipient"
import { SHIPMENT_ON_ITS_WAY_HTML, SHIPMENT_ON_ITS_WAY_SUBJECT } from "@/lib/service-emails/shipment-on-its-way"
import { NEXT_BAG_QUEUED_HTML, NEXT_BAG_QUEUED_SUBJECT } from "@/lib/service-emails/next-bag-queued"
import {
  COLECCIONA_SALE,
  WITHDRAWAL_PROCESSED,
  PICKUP_CONFIRMED,
  RETURN_LABEL_REMINDER,
  RETURN_RECEIVED,
  SUSPENDED_RETURN,
  SEPA_CHARGE_FAILED,
  SEPA_MANUAL_PAID,
  SEPA_EXECUTION,
  SEPA_PRE_NOTICE,
  MEMBERSHIP_RENEWED,
  PAYMENT_FAILED_1,
  PAYMENT_FAILED_2,
  PAYMENT_FAILED_3,
  PAYMENT_RECEIPT,
  REFUND,
} from "@/lib/service-emails/payment-family"
import { renderBrandEmail, renderAdminEmail, BRAND } from "./email-layout"

import { getResendApiKey } from "@/lib/resend-api-key"
import { logEmail } from "@/lib/email-logger"

function resolveResendApiKey(): string {
  return getResendApiKey()
}

const DASHBOARD_URL = `${BRAND.site}/dashboard`
const CATALOG_URL = `${BRAND.site}/catalog`

function esDate(value: string): string {
  const d = new Date(value)
  return isNaN(d.getTime()) ? value : d.toLocaleDateString("es-ES")
}

/** Correo nº 1 · Confirmación de cuenta, con la plantilla de Erika. Lo usan el envío real y /admin/email-preview. */
export function buildAccountConfirmationEmail(data: { confirmationUrl: string }): { subject: string; html: string } {
  return {
    subject: ACCOUNT_CONFIRMATION_SUBJECT,
    html: renderServiceTemplate(ACCOUNT_CONFIRMATION_HTML, { enlace_confirmacion: data.confirmationUrl }, ["enlace_confirmacion"]),
  }
}

/** Correo "Has cancelado tu membresía" (socia). Lo usan el envio real y la prueba de /admin/email-preview. */
export function buildMembershipCancelledEmail(data: { userName: string; membershipType: string; endDate: string }): {
  subject: string
  html: string
} {
  return {
    subject: MEMBERSHIP_CANCELLED_SUBJECT,
    html: renderServiceTemplate(
      MEMBERSHIP_CANCELLED_HTML,
      {
        nombre: data.userName?.split(" ")[0] || "",
        fecha_fin_acceso: data.endDate,
        tier: data.membershipType,
        enlace_volver: `${BRAND.site}/membresias?utm_source=email&utm_campaign=winback-cancelacion`,
      },
      ["enlace_volver"],
    ),
  }
}

const TIER_LABELS: Record<string, string> = {
  petite: "Petite",
  lessentiel: "L'Essentiel",
  essentiel: "L'Essentiel",
  signature: "Signature",
  prive: "Privé",
}

/** "petite" -> "Petite", "prive" -> "Privé"; si ya viene con nombre de marca, se deja igual. */
export function membershipTierLabel(value: string | null | undefined): string {
  const raw = (value || "").trim()
  return TIER_LABELS[raw.toLowerCase()] || raw || "Semzo Privé"
}

/** 52 -> "52,00" (formato de los importes en los correos: "{{importe}}€"). */
export function formatEuroAmount(value: number | string): string {
  const n = typeof value === "number" ? value : Number(String(value).replace(",", "."))
  return Number.isFinite(n) ? n.toFixed(2).replace(".", ",") : String(value)
}

/** Pago fallido, avisos 1, 2 y 3 (dunning). Enlace del boton: pantalla para cambiar el metodo de pago. */
export function buildPaymentFailedEmail(
  step: 1 | 2 | 3,
  data: { fullName: string | null; membershipType: string | null | undefined; updatePaymentUrl?: string },
): { subject: string; html: string } {
  const template = step === 1 ? PAYMENT_FAILED_1 : step === 2 ? PAYMENT_FAILED_2 : PAYMENT_FAILED_3
  return {
    subject: template.subject,
    html: renderServiceTemplate(
      template.html,
      {
        nombre: firstNameOf(data.fullName),
        tier: membershipTierLabel(data.membershipType),
        url_actualizar_pago: data.updatePaymentUrl || `${BRAND.site}/dashboard/payment-method`,
      },
      ["url_actualizar_pago"],
    ),
  }
}

/** Recibo de pago (aun sin evento que lo dispare: se lista en /admin/email-preview). */
export function buildPaymentReceiptEmail(data: {
  fullName: string | null
  amount: number | string
  paymentDate: string
  concept: string
  paymentMethod: string
}): { subject: string; html: string } {
  return {
    subject: PAYMENT_RECEIPT.subject,
    html: renderServiceTemplate(PAYMENT_RECEIPT.html, {
      nombre: firstNameOf(data.fullName),
      importe: formatEuroAmount(data.amount),
      fecha_pago: data.paymentDate,
      concepto: data.concept,
      metodo_pago: data.paymentMethod,
    }),
  }
}

/** Reembolso procesado (aun sin evento que lo dispare). */
export function buildRefundEmail(data: {
  fullName: string | null
  amount: number | string
  concept: string
}): { subject: string; html: string } {
  return {
    subject: REFUND.subject,
    html: renderServiceTemplate(REFUND.html, {
      nombre: firstNameOf(data.fullName),
      importe: formatEuroAmount(data.amount),
      concepto: data.concept,
    }),
  }
}

/** Recibo de renovacion de la membresia (lo manda el webhook de Stripe al cobrar la cuota). */
export function buildMembershipRenewedEmail(data: {
  fullName: string | null
  membershipType: string | null | undefined
  amount: number | string
  nextRenewalDate: string
}): { subject: string; html: string } {
  return {
    subject: MEMBERSHIP_RENEWED.subject,
    html: renderServiceTemplate(MEMBERSHIP_RENEWED.html, {
      nombre: firstNameOf(data.fullName),
      tier: membershipTierLabel(data.membershipType),
      importe: formatEuroAmount(data.amount),
      fecha_renovacion: data.nextRenewalDate,
    }),
  }
}

/** Aviso previo de cargo SEPA (bolso no devuelto). Lo usa el cron check-overdue-returns y la prueba del admin. */
export function buildSepaPreNoticeEmail(data: {
  fullName: string | null
  bagName: string
  deadline: string
  amount: number | string
  ibanMasked: string
  chargeDate: string
}): { subject: string; html: string } {
  return {
    subject: SEPA_PRE_NOTICE.subject,
    html: renderServiceTemplate(SEPA_PRE_NOTICE.html, {
      nombre: firstNameOf(data.fullName),
      nombre_bolso: data.bagName,
      fecha_limite: data.deadline,
      importe: formatEuroAmount(data.amount),
      iban_masked: data.ibanMasked,
      fecha_cargo: data.chargeDate,
    }),
  }
}

/** Enlace de seguimiento de Correos para un numero de envio. */
export function correosTrackingUrl(trackingNumber: string | null | undefined): string {
  return trackingNumber
    ? `https://www.correos.es/es/es/herramientas/localizador/envios/detalle?tracking-number=${encodeURIComponent(trackingNumber)}`
    : `${BRAND.site}/dashboard`
}

/** "Tu nuevo bolso ya viaja hacia ti": envio en camino (version cambio de bolso o primer bolso). */
export function buildShipmentOnItsWayEmail(data: {
  fullName: string | null
  bagName: string
  trackingNumber?: string | null
  fromSwap: boolean
}): { subject: string; html: string } {
  const returnParagraph = data.fromSwap
    ? '<p style="margin:0 0 20px 0;">Te confirmamos que hemos recibido correctamente el bolso de tu ciclo anterior. Gracias por haberlo cuidado tan bien.</p>'
    : ""
  return {
    subject: SHIPMENT_ON_ITS_WAY_SUBJECT,
    html: renderServiceTemplate(
      SHIPMENT_ON_ITS_WAY_HTML,
      {
        nombre: firstNameOf(data.fullName),
        nombre_bolso: data.bagName,
        url_seguimiento: correosTrackingUrl(data.trackingNumber),
        eyebrow_texto: data.fromSwap ? "Devolución recibida con éxito" : "Tu envío está en camino",
        parrafo_devolucion: returnParagraph,
      },
      ["url_seguimiento"],
      ["parrafo_devolucion"],
    ),
  }
}

/** "Tu próxima pieza ya tiene tu nombre": próximo bolso reservado (en cola). */
export function buildNextBagQueuedEmail(data: { fullName: string | null; bagName: string }): { subject: string; html: string } {
  return {
    subject: NEXT_BAG_QUEUED_SUBJECT,
    html: renderServiceTemplate(NEXT_BAG_QUEUED_HTML, { nombre: firstNameOf(data.fullName), nombre_bolso: data.bagName }),
  }
}

const escapeHtmlText = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

/** Gift Card recibida (la manda el webhook de Stripe al confirmarse el pago de la tarjeta). */
export function buildGiftCardRecipientEmail(data: {
  recipientName?: string | null
  purchaserName?: string | null
  amountEuros: number | string
  code: string
  personalMessage?: string | null
  expiresAt?: string | null
  redeemUrl: string
}): { subject: string; html: string } {
  const purchaser = firstNameOf(data.purchaserName) || "Alguien especial"
  const recipientFirst = firstNameOf(data.recipientName)
  const message = (data.personalMessage || "").trim()
  const expires = data.expiresAt ? new Date(data.expiresAt) : null

  const messageBlock = message
    ? `<table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin-bottom:24px;">
                      <tr>
                        <td align="center" style="padding:0 10px;">
                          <p style="margin:0;font-family:'Playfair Display',Georgia,serif;font-size:16px;font-style:italic;color:#3a3a5c;line-height:1.6;">
                            "${escapeHtmlText(message)}"
                          </p>
                        </td>
                      </tr>
                    </table>`
    : ""
  const expiryLine =
    expires && !Number.isNaN(expires.getTime())
      ? `<p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:12px;color:#7a7a94;">
                      Válida hasta el ${expires.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                    </p>`
      : ""

  return {
    subject: data.purchaserName
      ? `${purchaser} te ha regalado una Gift Card · SEMZO PRIVÉ`
      : "Has recibido una Gift Card · SEMZO PRIVÉ",
    html: renderServiceTemplate(
      GIFT_CARD_RECIPIENT_HTML,
      {
        saludo_nombre: recipientFirst ? ` ${recipientFirst}` : "",
        nombre: recipientFirst,
        nombre_comprador: purchaser,
        importe: formatEuroAmount(data.amountEuros).replace(/,00$/, ""),
        codigo_gift_card: data.code,
        url_canje: data.redeemUrl,
        bloque_mensaje: messageBlock,
        linea_caducidad: expiryLine,
      },
      ["url_canje"],
      ["bloque_mensaje", "linea_caducidad"],
    ),
  }
}

/** Desistimiento de una compra Colecciona procesado: compra anulada y reembolso. */
export function buildWithdrawalProcessedEmail(data: {
  fullName: string | null
  bagName: string
  amount: number | string
}): { subject: string; html: string } {
  return {
    subject: WITHDRAWAL_PROCESSED.subject,
    html: renderServiceTemplate(WITHDRAWAL_PROCESSED.html, {
      nombre: firstNameOf(data.fullName),
      nombre_bolso: data.bagName,
      importe: formatEuroAmount(data.amount),
    }),
  }
}

/** Devolucion recibida y verificada (la manda el cierre de la devolucion en Logistica). */
export function buildReturnReceivedEmail(data: { fullName: string | null; bagName: string }): { subject: string; html: string } {
  return {
    subject: RETURN_RECEIVED.subject,
    html: renderServiceTemplate(RETURN_RECEIVED.html, { nombre: firstNameOf(data.fullName), nombre_bolso: data.bagName }),
  }
}

/** Aviso a la socia: la etiqueta de devolucion sigue sin escanear. El boton descarga la etiqueta de Correos. */
export function buildReturnLabelReminderEmail(data: {
  fullName: string | null
  bagName: string
  labelUrl: string
}): { subject: string; html: string } {
  return {
    subject: RETURN_LABEL_REMINDER.subject,
    html: renderServiceTemplate(
      RETURN_LABEL_REMINDER.html,
      { nombre: firstNameOf(data.fullName), nombre_bolso: data.bagName, url_etiqueta_correos: data.labelUrl },
      ["url_etiqueta_correos"],
    ),
  }
}

/** Recogida confirmada con dia y franja. */
export function buildPickupConfirmedEmail(data: {
  fullName: string | null
  bagName: string
  pickupDay: string
  timeSlot: string
}): { subject: string; html: string } {
  return {
    subject: PICKUP_CONFIRMED.subject,
    html: renderServiceTemplate(PICKUP_CONFIRMED.html, {
      nombre: firstNameOf(data.fullName),
      nombre_bolso: data.bagName,
      dia_recogida: data.pickupDay,
      franja_horaria: data.timeSlot,
    }),
  }
}

/** Membresia suspendida por impago con un bolso en casa: se pide la devolucion. */
export function buildSuspendedReturnEmail(data: {
  fullName: string | null
  membershipType: string | null | undefined
  bagName: string
  returnDeadline: string
  panelUrl?: string
}): { subject: string; html: string } {
  return {
    subject: SUSPENDED_RETURN.subject,
    html: renderServiceTemplate(
      SUSPENDED_RETURN.html,
      {
        nombre: firstNameOf(data.fullName),
        tier: membershipTierLabel(data.membershipType),
        nombre_bolso: data.bagName,
        fecha_limite: data.returnDeadline,
        url_panel: data.panelUrl || `${BRAND.site}/dashboard`,
      },
      ["url_panel"],
    ),
  }
}

/** Pago manual recibido tras un cargo SEPA rechazado (la socia paga desde su panel). */
export function buildSepaManualPaidEmail(data: {
  fullName: string | null
  bagName: string
  amount: number | string
}): { subject: string; html: string } {
  return {
    subject: SEPA_MANUAL_PAID.subject,
    html: renderServiceTemplate(SEPA_MANUAL_PAID.html, {
      nombre: firstNameOf(data.fullName),
      nombre_bolso: data.bagName,
      importe: formatEuroAmount(data.amount),
    }),
  }
}

/** Cargo SEPA por no devolucion RECHAZADO por el banco: pide completar el pago a mano desde el panel. */
export function buildSepaChargeFailedEmail(data: {
  fullName: string | null
  bagName: string
  amount: number | string
  payUrl?: string
}): { subject: string; html: string } {
  return {
    subject: SEPA_CHARGE_FAILED.subject,
    html: renderServiceTemplate(
      SEPA_CHARGE_FAILED.html,
      {
        nombre: firstNameOf(data.fullName),
        nombre_bolso: data.bagName,
        importe: formatEuroAmount(data.amount),
        url_pago: data.payUrl || `${BRAND.site}/dashboard`,
      },
      ["url_pago"],
    ),
  }
}

/** Cargo SEPA ejecutado por no devolucion (solo tras confirmarse el cobro en Stripe). */
export function buildSepaExecutionEmail(data: {
  fullName: string | null
  bagName: string
  amount: number | string
}): { subject: string; html: string } {
  return {
    subject: SEPA_EXECUTION.subject,
    html: renderServiceTemplate(SEPA_EXECUTION.html, {
      nombre: firstNameOf(data.fullName),
      nombre_bolso: data.bagName,
      importe: formatEuroAmount(data.amount),
    }),
  }
}

/** Correo Colecciona "Compra confirmada" (venta cerrada): con contrato adjunto y enlace a la factura. */
export function buildColeccionaSaleEmail(data: {
  fullName: string | null
  bagLabel: string
  amountPaid: number
  invoiceUrl: string | null
  hasContract: boolean
}): { subject: string; html: string } {
  const contractSentence = data.hasContract
    ? "Adjuntamos tu <strong>contrato de compraventa</strong> firmado en PDF. También lo tienes siempre disponible en tu panel, en «Mis bolsos»."
    : "Tu <strong>contrato de compraventa</strong> firmado estará disponible en tu panel, en «Mis bolsos»."
  return {
    subject: `${data.bagLabel} ya es tuyo · Semzo Privé`,
    html: renderServiceTemplate(
      COLECCIONA_SALE.html,
      {
        nombre: firstNameOf(data.fullName),
        nombre_bolso: data.bagLabel,
        importe: formatEuroAmount(data.amountPaid),
        url_factura: data.invoiceUrl || `${BRAND.site}/dashboard`,
        frase_contrato: contractSentence,
      },
      ["url_factura"],
      ["frase_contrato"],
    ),
  }
}

/** Correo Colecciona "Ya puedes finalizar tu compra". Lo usan el envio real y la prueba de /admin/email-preview. */
export function buildColeccionaReadyEmail(data: {
  fullName: string | null
  bagBrand: string
  bagName: string
  imageUrl: string | null
  panelUrl: string
}): { subject: string; html: string } {
  return {
    subject: COLECCIONA_READY_SUBJECT,
    html: renderServiceTemplate(
      COLECCIONA_READY_HTML,
      {
        nombre: firstNameOf(data.fullName),
        nombre_bolso: data.bagName,
        marca_bolso: data.bagBrand,
        imagen_bolso: data.imageUrl || `${BRAND.site}/images/logo-semzo-prive.png`,
        url_panel: data.panelUrl,
      },
      ["imagen_bolso", "url_panel"],
    ),
  }
}

/** Correo nº 2 · Bienvenida de socia (alta y reactivacion). Lo usan el envio real y la prueba de /admin/email-preview. */
export function buildMemberWelcomeEmail(data: { name: string; tier: string }): { subject: string; html: string } {
  return {
    subject: MEMBER_WELCOME_SUBJECT,
    html: renderServiceTemplate(MEMBER_WELCOME_HTML, { nombre: data.name, tier: data.tier }),
  }
}

/** Correo "Pase Bolso listo" (socia). Exportado para usarlo tambien en la prueba de /admin/email-preview. */
export function buildBagPassPurchaseUserEmail(data: {
  userName: string
  passTier: string
  quantity: number
  totalPrice: number
  paymentMethod: string
}): { subject: string; html: string } {
  const tierLabel =
    data.passTier === "lessentiel" || data.passTier === "essentiel"
      ? "L'Essentiel"
      : data.passTier === "prive"
        ? "Privé"
        : data.passTier.charAt(0).toUpperCase() + data.passTier.slice(1)
  const paymentLabel = data.paymentMethod === "gift_card" ? "Gift Card" : "Tarjeta"
  return {
    subject: `Tu Pase Bolso ${tierLabel} está listo - Semzo Privé`,
    html: renderServiceTemplate(BAG_PASS_PURCHASED_HTML, {
      nombre: data.userName?.split(" ")[0] || "",
      pase: tierLabel,
      cantidad: String(data.quantity),
      total: `€${data.totalPrice.toFixed(2)}`,
      metodo_pago: paymentLabel,
    }),
  }
}

export class EmailServiceProduction {
  private static instance: EmailServiceProduction
  private config: EmailConfig
  private adminEmail = "mailbox@semzoprive.com" // Added admin email

  constructor() {
    const resendKey = resolveResendApiKey()
    const hasResend = !!resendKey
    const hasSmtp = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)

    this.config = {
      provider: hasResend ? "resend" : hasSmtp ? "smtp" : "resend",
      apiKey: resendKey,
      fromEmail: process.env.FROM_EMAIL || "hola@semzoprive.com",
      fromName: "Semzo Privé",
    }

    console.log("[v0] EmailServiceProduction initialized:")
    console.log("[v0] Provider:", this.config.provider)
    console.log("[v0] RESEND_API_KEY disponible:", !!process.env.RESEND_API_KEY)
    console.log("[v0] EMAIL_API_KEY disponible:", !!process.env.EMAIL_API_KEY)
    console.log("[v0] SMTP disponible:", hasSmtp)
    console.log("[v0] API Key usada (primeros 10 chars):", this.config.apiKey.substring(0, 10))
    console.log("[v0] API Key válida (empieza con re_):", this.config.apiKey.startsWith("re_"))
  }

  static getInstance(): EmailServiceProduction {
    if (!EmailServiceProduction.instance) {
      EmailServiceProduction.instance = new EmailServiceProduction()
    }
    return EmailServiceProduction.instance
  }

  async sendWithResend(data: EmailData): Promise<boolean> {
    return emailQueue.add(async () => {
      try {
        const apiKey = resolveResendApiKey()

        if (!apiKey) {
          console.error("❌ No hay API key de Resend disponible")
          return false
        }

        const unsubscribeUrl = `${BRAND.site}/api/webhooks/unsubscribe?email=${encodeURIComponent(data.to)}`

        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Semzo Privé <hola@semzoprive.com>",
            to: [data.to],
            reply_to: "soporte@semzoprive.com",
            subject: data.subject,
            html: data.html,
            text: data.text || data.subject,
            // Los correos de servicio (recibos, confirmaciones, avisos de cuenta) NO llevan List-Unsubscribe:
            // Gmail los mostraba como "lista de correos" con "Cancelar suscripcion".
            ...(data.marketing
              ? {
                  headers: {
                    "List-Unsubscribe": `<${unsubscribeUrl}>`,
                    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
                  },
                }
              : {}),
            ...(data.attachments && data.attachments.length > 0 ? { attachments: data.attachments } : {}),
          }),
        })

        if (!response.ok) {
          const errorData = await response.text()
          console.error("❌ Error de Resend:", errorData)
          return false
        }

        const result = await response.json()
        console.log("✅ Email enviado, ID:", result.id)
        return true
      } catch (error) {
        console.error("❌ Error enviando email:", error)
        return false
      }
    })
  }

  // Helper to abstract sending email via Resend or SMTP
  private async sendEmail(data: { to: string; subject: string; html: string }): Promise<boolean> {
    const emailData: EmailData = {
      to: data.to,
      subject: data.subject,
      html: data.html,
      text: data.subject, // Fallback text content
    }

    return this.sendWithResend(emailData)
  }

  async sendWelcomeEmail(email: string, customerName: string, confirmationUrl: string, locale: "es" | "en" = "es"): Promise<boolean> {
    // Plantilla propia de Erika (lib/service-emails/account-confirmation.ts). El idioma por ahora es solo es.
    const built = buildAccountConfirmationEmail({ confirmationUrl })
    const emailData: EmailData = {
      to: email,
      subject: built.subject,
      html: built.html,
      text: this.generateWelcomeText(customerName, confirmationUrl),
      customerName,
      confirmationUrl,
    }

    return await this.sendWithResend(emailData)
  }

  async sendMembershipCancelledEmail(data: {
    userName: string
    userEmail: string
    membershipType: string
    endDate: string
  }) {
    try {
      const built = buildMembershipCancelledEmail(data)
      await this.sendEmail({ to: data.userEmail, subject: built.subject, html: built.html })

      await this.sendEmail({
        to: this.adminEmail,
        subject: `Membresía cancelada: ${data.membershipType}`,
        html: this.generateMembershipCancelledAdminHTML(data),
      })
    } catch (error) {
      console.error("Error sending membership cancelled email:", error)
    }
  }

  // ==========================================================================
  // PLANTILLAS DE MARCA (todas usan renderBrandEmail / renderAdminEmail)
  // ==========================================================================

  private generateWelcomeText(customerName: string, confirmationUrl: string): string {
    return `
      ¡Hola ${customerName}!

      ¡Bienvenida a Semzo Privé! Estamos emocionados de tenerte en nuestra comunidad exclusiva.

      Tu cuenta ha sido creada exitosamente. Para completar tu registro, confirma tu cuenta en:
      ${confirmationUrl}

      Una vez confirmada, podrás:
      - Explorar nuestra colección exclusiva
      - Realizar reservas de bolsos
      - Acceder a ofertas especiales
      - Recibir notificaciones de nuevas llegadas

      Si tienes alguna pregunta, contactanos en: ${BRAND.supportEmail}

      ¡Gracias por unirte a Semzo Privé!

      El equipo de Semzo Privé
      ${BRAND.address}
    `
  }

  /** Para la prueba de /admin/email-preview: el mismo HTML que recibe la socia. */
  private generateMembershipCancelledAdminHTML(data: {
    userName: string
    userEmail: string
    membershipType: string
    endDate: string
  }): string {
    return renderAdminEmail({
      title: "Membresía cancelada",
      rows: [
        { label: "Cliente", value: data.userName },
        { label: "Email", value: data.userEmail },
        { label: "Tipo", value: data.membershipType },
        { label: "Acceso hasta", value: esDate(data.endDate) },
      ],
      accent: "danger",
    })
  }

  // ==========================================================================
  // ENVIO Y DEVOLUCION
  // ==========================================================================

  // Correo "Tu nuevo bolso ya viaja hacia ti" (plantilla de Erika: lib/service-emails/shipment-on-its-way.ts).
  // Para no duplicar envios usa lib/shipment-on-its-way.ts (un correo por envio, version segun cambio de bolso).
  async sendShipmentInTransitEmail(data: {
    userEmail: string
    userName: string
    bagName?: string
    trackingNumber?: string | null
    fromSwap?: boolean
  }): Promise<boolean> {
    const built = buildShipmentOnItsWayEmail({
      fullName: data.userName,
      bagName: data.bagName || "tu bolso",
      trackingNumber: data.trackingNumber,
      fromSwap: !!data.fromSwap,
    })
    return await this.sendWithResend({ to: data.userEmail, subject: built.subject, html: built.html })
  }

  async sendShipmentDeliveredEmail(data: {
    userEmail: string
    userName: string
    bagName?: string
    membershipEndDate?: string
  }): Promise<boolean> {
    const firstName = data.userName?.split(" ")[0] || ""
    const bagName = data.bagName || "tu bolso"

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SEMZO PRIVÉ · Tu bolso ha llegado</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=Great+Vibes&display=swap" rel="stylesheet" />
  <style>
    @media only screen and (max-width: 480px) {
      .responsive-title { font-size: 24px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f9f8f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

  <!-- CONTENEDOR PRINCIPAL -->
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background-color:#ffffff;margin:0 auto;border-collapse:collapse;">
    <tr>
      <td style="padding:0;background-color:#ffffff;">

        <!-- ========================================== -->
        <!-- 1. LOGO                                   -->
        <!-- ========================================== -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:12px 20px 6px 20px;">
              <img src="https://semzoprive.com/images/logo-semzo-prive.png"
                   alt=""
                   width="200"
                   style="display:block;height:auto;max-width:200px;border:0;" />
            </td>
          </tr>
        </table>

        <!-- ========================================== -->
        <!-- 2. IMAGEN HERO                            -->
        <!-- ========================================== -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0 0 0;">
              <img src="https://h0ayghjex33jktep.public.blob.vercel-storage.com/blog-images/1768579438886-gucci___dior___chanel_alquilar_x_semana.jpg"
                   alt=""
                   width="600"
                   style="display:block;width:100%;height:auto;border:0;" />
            </td>
          </tr>
        </table>

        <!-- ========================================== -->
        <!-- 3. TITULAR                                -->
        <!-- ========================================== -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:32px 30px 8px 30px;">
              <h1 style="margin:0;font-family:'Playfair Display',Georgia,serif;font-weight:400;font-size:28px;line-height:1.3;color:#1a1a4b;letter-spacing:-0.3px;">
                Tu ${bagName}<br />ha llegado
              </h1>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:12px 0 20px 0;">
              <div style="width:40px;height:2px;background-color:#c9a96e;margin:0 auto;"></div>
            </td>
          </tr>
        </table>

        <!-- ========================================== -->
        <!-- 4. CUERPO DEL EMAIL                       -->
        <!-- ========================================== -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:0 20px 0 20px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:440px;border-collapse:collapse;">
                <tr>
                  <td style="color:#1a1a4b;font-size:16px;line-height:1.8;padding:0;">

                    <p style="margin:0 0 20px 0;">Hola ${firstName},</p>
                    <p style="margin:0 0 20px 0;">Tu <strong>${bagName}</strong> acaba de ser entregado.</p>
                    <p style="margin:0 0 20px 0;">Esperamos que la experiencia de recibirlo haya estado a la altura — el embalaje, el detalle, la primera vez que lo sostienes.</p>
                    <p style="margin:0 0 20px 0;">Antes de estrenarlo, tres cosas rápidas:</p>

                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- ========================================== -->
        <!-- 5. BLOQUE ROSA — CONSEJOS DE CUIDADO      -->
        <!-- ========================================== -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background-color:#fff0f3;">
          <tr>
            <td align="center" style="padding:28px 30px;">
              <ul style="margin:0;padding-left:0;list-style-type:none;text-align:left;color:#1a1a4b;font-size:15px;line-height:1.8;">
                <li style="margin:0 0 10px 0;">• Guárdalo en su funda cuando no lo uses.</li>
                <li style="margin:0 0 10px 0;">• Evita superficies húmedas y luz directa prolongada.</li>
                <li style="margin:0;">• Si tienes cualquier duda sobre su cuidado, escríbenos directamente — respondemos por WhatsApp.</li>
              </ul>
              <div style="width:30px;height:1px;background-color:#c9a96e;margin:20px auto 0 auto;"></div>
            </td>
          </tr>
        </table>

        <!-- ========================================== -->
        <!-- 6. BLOQUE "¿TODO EN ORDEN?"               -->
        <!-- ========================================== -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:28px 20px 0 20px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:440px;border-collapse:collapse;">
                <tr>
                  <td style="color:#1a1a4b;font-size:16px;line-height:1.8;padding:0;">
                    <p style="margin:0 0 16px 0;font-family:'Playfair Display',Georgia,serif;font-size:20px;font-weight:500;color:#1a1a4b;text-align:center;">
                      ¿Todo en orden con tu pedido?
                    </p>
                    <p style="margin:0 0 20px 0;text-align:center;color:#3a3a5c;">Si algo no es como esperabas — el estado de la pieza, el embalaje, cualquier detalle — escríbenos en las próximas 24 horas y lo resolvemos sin preguntas.</p>
                    <p style="margin:0 0 0 0;text-align:center;">
                      <a href="mailto:info@semzoprive.com" style="display:inline-block;color:#1a1a4b;font-size:15px;font-family:'Playfair Display',Georgia,serif;font-style:italic;text-decoration:underline;text-underline-offset:3px;padding:6px 0;">
                        Contactar al equipo → info@semzoprive.com
                      </a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- ========================================== -->
        <!-- 7. BLOQUE DE IMPACTO                      -->
        <!-- ========================================== -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:32px 20px 20px 20px;">
              <div style="width:60px;height:1px;background-color:#c9a96e;margin:0 auto 24px auto;"></div>
              <p style="margin:0;font-family:'Playfair Display',Georgia,serif;font-size:28px;line-height:1.35;font-weight:500;color:#1a1a4b;letter-spacing:-0.4px;text-align:center;">
                Tu periodo de disfrute<br />comienza hoy.
              </p>
              <div style="width:60px;height:1px;background-color:#c9a96e;margin:24px auto 0 auto;"></div>
            </td>
          </tr>
        </table>

        <!-- ========================================== -->
        <!-- 8. BLOQUE "CUANDO ESTÉS LISTA"            -->
        <!-- ========================================== -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:0 20px 0 20px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:440px;border-collapse:collapse;">
                <tr>
                  <td style="color:#1a1a4b;font-size:16px;line-height:1.8;padding:0;">
                    <p style="margin:0 0 16px 0;font-family:'Playfair Display',Georgia,serif;font-size:20px;font-weight:500;color:#1a1a4b;text-align:center;">
                      Cuando estés lista para el siguiente
                    </p>
                    <p style="margin:0 0 24px 0;text-align:center;color:#3a3a5c;">No hay prisa. Pero cuando quieras cambiarlo, la colección te está esperando.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- ========================================== -->
        <!-- 9. CTA PRINCIPAL                          -->
        <!-- ========================================== -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:0 20px 36px 20px;">
              <a href="${CATALOG_URL}" style="display:inline-block;background-color:#1a1a4b;color:#ffffff;font-size:16px;font-weight:500;text-decoration:none;padding:18px 64px;letter-spacing:2px;text-transform:uppercase;border:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;min-width:220px;text-align:center;box-shadow:0 4px 12px rgba(26,26,75,0.2);">
                Ver la colección
              </a>
            </td>
          </tr>
        </table>

        <!-- ========================================== -->
        <!-- 10. BLOQUE FINAL EDITORIAL                -->
        <!-- ========================================== -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;padding-top:10px;">
          <tr>
            <td align="center" style="padding:0 20px 30px 20px;">

              <!-- Firma manuscrita -->
              <p style="margin:0 0 0 0;font-family:'Great Vibes',cursive;font-size:42px;color:#1a1a4b;text-align:center;letter-spacing:1px;line-height:1.2;">
                Erika
              </p>
              <p style="margin:4px 0 0 0;font-size:14px;color:#7a7a94;letter-spacing:0.5px;text-align:center;">
                Fundadora de SEMZO PRIVÉ
              </p>

              <!-- Línea decorativa dorada -->
              <div style="width:30px;height:1px;background-color:#c9a96e;margin:20px auto 18px auto;"></div>

              <!-- Frase de marca -->
              <p style="margin:0 0 0 0;font-family:'Playfair Display',Georgia,serif;font-size:18px;line-height:1.5;font-style:italic;color:#1a1a4b;text-align:center;letter-spacing:-0.2px;">
                "El verdadero lujo no consiste en tener más.<br />Consiste en elegir mejor."
              </p>

              <!-- Línea divisoria dorada -->
              <div style="width:40px;height:1px;background-color:#c9a96e;margin:24px auto 20px auto;"></div>

              <!-- Nombre de marca + eslogan -->
              <p style="margin:0 0 2px 0;font-family:'Playfair Display',Georgia,serif;font-size:20px;font-weight:600;color:#1a1a4b;letter-spacing:0.5px;text-align:center;">
                SEMZO PRIVÉ
              </p>
              <p style="margin:0 0 0 0;font-family:'Playfair Display',Georgia,serif;font-size:14px;font-style:italic;color:#7a7a94;text-align:center;letter-spacing:0.3px;">
                Tu puerta de acceso al armario de tus sueños
              </p>

              <!-- Separación antes de redes -->
              <div style="height:18px;"></div>

              <!-- REDES SOCIALES -->
              <table border="0" cellpadding="0" cellspacing="0" style="margin:0 auto;border-collapse:collapse;">
                <tr>
                  <td align="center" style="padding:0 12px;">
                    <a href="https://instagram.com/semzoprive" target="_blank" style="display:inline-block;text-decoration:none;background-color:#f6c1c8;border-radius:50%;padding:10px;">
                      <img src="https://cdn.simpleicons.org/instagram/1e1b4b" width="24" height="24" alt="Instagram" style="display:block;border:0;" />
                    </a>
                  </td>
                  <td align="center" style="padding:0 12px;">
                    <a href="https://pinterest.com/semzoprive" target="_blank" style="display:inline-block;text-decoration:none;background-color:#f6c1c8;border-radius:50%;padding:10px;">
                      <img src="https://cdn.simpleicons.org/pinterest/1e1b4b" width="24" height="24" alt="Pinterest" style="display:block;border:0;" />
                    </a>
                  </td>
                  <td align="center" style="padding:0 12px;">
                    <a href="https://tiktok.com/@semzoprive" target="_blank" style="display:inline-block;text-decoration:none;background-color:#f6c1c8;border-radius:50%;padding:10px;">
                      <img src="https://cdn.simpleicons.org/tiktok/1e1b4b" width="24" height="24" alt="TikTok" style="display:block;border:0;" />
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-size:10px;color:#7a7a94;letter-spacing:0.5px;padding-top:4px;">Instagram</td>
                  <td align="center" style="font-size:10px;color:#7a7a94;letter-spacing:0.5px;padding-top:4px;">Pinterest</td>
                  <td align="center" style="font-size:10px;color:#7a7a94;letter-spacing:0.5px;padding-top:4px;">TikTok</td>
                </tr>
              </table>

            </td>
          </tr>
        </table>

        <!-- ========================================== -->
        <!-- 11. COPYRIGHT (muy pequeño)               -->
        <!-- ========================================== -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:0 20px 14px 20px;font-size:9px;color:#d0d0d0;letter-spacing:0.3px;">
              <span>© 2026 SEMZO PRIVÉ</span>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>`

    return await this.sendWithResend({
      to: data.userEmail,
      subject: "Tu bolso ha llegado - Semzo Privé",
      html,
    })
  }

  async sendReturnReceivedEmail(data: { userEmail: string; userName: string; bagName: string }): Promise<boolean> {
    // Plantilla de Erika (lib/service-emails/payment-family.ts)
    const built = buildReturnReceivedEmail({ fullName: data.userName, bagName: data.bagName })
    return await this.sendWithResend({ to: data.userEmail, subject: built.subject, html: built.html })
  }

  async sendPaymentFailedEmail(data: {
    userEmail: string
    userName: string
    amount?: string
    reason?: string
    membershipType?: string
    bagName?: string
  }): Promise<boolean> {
    const built = buildPaymentFailedEmail(1, { fullName: data.userName, membershipType: data.membershipType })
    const userEmailData: EmailData = {
      to: data.userEmail,
      subject: built.subject,
      html: built.html,
    }

    const adminEmailData: EmailData = {
      to: this.adminEmail,
      subject: `Pago fallido: ${data.userName}`,
      html: renderAdminEmail({
        title: "Pago fallido",
        rows: [
          { label: "Cliente", value: `${data.userName} (${data.userEmail})` },
          ...(data.amount ? [{ label: "Monto", value: `€${data.amount}` }] : []),
          ...(data.reason ? [{ label: "Motivo", value: data.reason }] : []),
        ],
        accent: "danger",
      }),
    }

    const userSent = await this.sendWithResend(userEmailData)
    const adminSent = await this.sendWithResend(adminEmailData)

    // Registrar el E1 en email_logs para que aparezca en el panel de
    // Historial de Emails del admin (antes solo se enviaba, sin registrar).
    await logEmail({
      recipientEmail: data.userEmail,
      recipientName: data.userName,
      subject: userEmailData.subject,
      emailType: "dunning_e1",
      status: userSent ? "sent" : "failed",
      metadata: {
        amount: data.amount,
        reason: data.reason,
        membershipType: data.membershipType,
      },
    })

    return userSent && adminSent
  }

  async sendBagPassPurchaseEmail(data: {
    userEmail: string
    userName: string
    passTier: string
    quantity: number
    totalPrice: number
    paymentMethod: string
  }): Promise<boolean> {
    const tierLabel =
      data.passTier === "lessentiel" || data.passTier === "essentiel"
        ? "L'Essentiel"
        : data.passTier.charAt(0).toUpperCase() + data.passTier.slice(1)
    const paymentLabel = data.paymentMethod === "gift_card" ? "Gift Card" : "Tarjeta"

    const built = buildBagPassPurchaseUserEmail(data)
    const userEmailData: EmailData = {
      to: data.userEmail,
      subject: built.subject,
      html: built.html,
    }

    const adminEmailData: EmailData = {
      to: this.adminEmail,
      subject: `Compra de Pase Bolso: ${data.userName} (${tierLabel})`,
      html: renderAdminEmail({
        title: "Nueva compra de Pase Bolso",
        rows: [
          { label: "Socia", value: `${data.userName} (${data.userEmail})` },
          { label: "Pase", value: tierLabel },
          { label: "Cantidad", value: String(data.quantity) },
          { label: "Total", value: `€${data.totalPrice.toFixed(2)}` },
          { label: "Método de pago", value: paymentLabel },
        ],
        accent: "success",
      }),
    }

    const userSent = await this.sendWithResend(userEmailData)
    const adminSent = await this.sendWithResend(adminEmailData)
    return userSent && adminSent
  }
}

export function useEmailServiceProduction() {
  return EmailServiceProduction.getInstance()
}

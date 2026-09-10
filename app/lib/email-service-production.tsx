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
}

import { render } from "@react-email/components"
import { emailQueue } from "./email-queue"
import { renderBrandEmail, renderAdminEmail, emailInfoBox, emailDetailList, BRAND } from "./email-layout"
import WelcomeEmail from "@/emails/templates/welcome"
import DunningEmail from "@/emails/templates/dunning"
import ReturnReminderEmail from "@/emails/templates/return-reminder"
import { getMessages } from "@/emails/messages"

// Descarta valores placeholder/inválidos (p.ej. "re_xxxxx") y devuelve la primera clave de Resend
// realmente utilizable entre las variables de entorno disponibles.
function isValidResendKey(key: string | undefined): key is string {
  if (!key) return false
  const trimmed = key.trim()
  if (!trimmed.startsWith("re_")) return false
  if (/^re_x+$/i.test(trimmed)) return false // placeholder tipo "re_xxxxx"
  if (trimmed.length < 20) return false
  return true
}

function resolveResendApiKey(): string {
  const candidates = [process.env.RESEND_API_KEY, process.env.EMAIL_API_KEY]
  for (const candidate of candidates) {
    if (isValidResendKey(candidate)) return candidate
  }
  return ""
}

const DASHBOARD_URL = `${BRAND.site}/dashboard`
const CATALOG_URL = `${BRAND.site}/catalog`

function esDate(value: string): string {
  const d = new Date(value)
  return isNaN(d.getTime()) ? value : d.toLocaleDateString("es-ES")
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
            headers: {
              "List-Unsubscribe": `<${unsubscribeUrl}>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
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

  private async sendWithSMTP(data: EmailData): Promise<boolean> {
    return this.sendWithResend(data)
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
    const t = getMessages(locale)
    const emailData: EmailData = {
      to: email,
      subject: t.welcome.subject,
      html: await render(<WelcomeEmail name={customerName} confirmationUrl={confirmationUrl} locale={locale} />),
      text: this.generateWelcomeText(customerName, confirmationUrl),
      customerName,
      confirmationUrl,
    }

    return await this.sendWithResend(emailData)
  }

  async sendContactEmail(
    name: string,
    email: string,
    subject: string,
    message: string,
    priority: string,
  ): Promise<boolean> {
    const adminEmailData: EmailData = {
      to: this.adminEmail,
      subject: `Nueva consulta: ${subject}`,
      html: this.generateContactAdminHTML(name, email, subject, message, priority),
      text: `Nueva consulta de ${name} (${email}): ${message}`,
    }

    const userEmailData: EmailData = {
      to: email,
      subject: "Hemos recibido tu consulta - Semzo Privé",
      html: this.generateContactUserHTML(name, subject),
      text: `Hola ${name}, hemos recibido tu consulta sobre "${subject}". Te responderemos en 24 horas.`,
    }

    const adminSent = await this.sendWithResend(adminEmailData)
    const userSent = await this.sendWithResend(userEmailData)

    return adminSent && userSent
  }

  async sendNewsletterConfirmation(email: string): Promise<boolean> {
    const emailData: EmailData = {
      to: email,
      subject: "¡Bienvenida a nuestro newsletter! - Semzo Privé",
      html: this.generateNewsletterHTML(email),
      text: `¡Gracias por suscribirte a nuestro newsletter! Recibirás las últimas novedades de Semzo Privé.`,
    }

    return await this.sendWithResend(emailData)
  }

  async sendNewsletterEmail(email: string, name: string): Promise<{ success: boolean }> {
    const data = { email, name, phone: undefined, preferences: undefined }

    const adminEmailData: EmailData = {
      to: this.adminEmail,
      subject: `Nueva suscripción al newsletter: ${name}`,
      html: this.generateNewsletterAdminHTML(data),
      text: `Nueva suscripción de ${name} (${email}) al newsletter.`,
    }

    const userEmailData: EmailData = {
      to: email,
      subject: "¡Bienvenida a nuestro newsletter! - Semzo Privé",
      html: this.generateNewsletterHTML(email),
      text: `¡Gracias por suscribirte a nuestro newsletter! Recibirás las últimas novedades de Semzo Privé.`,
    }

    const adminSent = await this.sendWithResend(adminEmailData)
    const userSent = await this.sendWithResend(userEmailData)

    return { success: adminSent && userSent }
  }

  async sendReservationNotification(data: {
    userEmail: string
    userName: string
    bagName: string
    reservationDate: string
    reservationId?: string
  }): Promise<boolean> {
    const adminEmailData: EmailData = {
      to: this.adminEmail,
      subject: `Nueva reserva: ${data.bagName}`,
      html: this.generateReservationAdminHTML(data),
      text: `Nueva reserva de ${data.userName} para ${data.bagName}`,
    }

    const userEmailData: EmailData = {
      to: data.userEmail,
      subject: `Reserva confirmada: ${data.bagName} - Semzo Privé`,
      html: this.generateReservationUserHTML(data),
      text: `Tu reserva para ${data.bagName} ha sido confirmada.`,
    }

    const adminSent = await this.sendWithResend(adminEmailData)
    const userSent = await this.sendWithResend(userEmailData)

    return adminSent && userSent
  }

  async sendCancellationNotification(data: {
    userEmail: string
    userName: string
    bagName: string
    reservationId: string
    cancellationDate: string
  }): Promise<boolean> {
    const adminEmailData: EmailData = {
      to: this.adminEmail,
      subject: `Reserva cancelada: ${data.bagName}`,
      html: this.generateCancellationAdminHTML(data),
      text: `${data.userName} ha cancelado su reserva de ${data.bagName}`,
    }

    const userEmailData: EmailData = {
      to: data.userEmail,
      subject: `Reserva cancelada: ${data.bagName} - Semzo Privé`,
      html: this.generateCancellationUserHTML(data),
      text: `Tu reserva para ${data.bagName} ha sido cancelada.`,
    }

    const adminSent = await this.sendWithResend(adminEmailData)
    const userSent = await this.sendWithResend(userEmailData)
    console.log("[v0] User cancellation email result:", userSent ? "SUCCESS" : "FAILED")

    const bothSent = adminSent && userSent
    console.log("[v0] Overall cancellation email result:", bothSent ? "SUCCESS" : "PARTIAL/FAILED")

    return bothSent
  }

  async sendPaymentConfirmation(data: {
    userEmail: string
    userName: string
    amount: string
    paymentId: string
    bagName?: string
  }): Promise<boolean> {
    const adminEmailData: EmailData = {
      to: this.adminEmail,
      subject: `Pago recibido: €${data.amount}`,
      html: this.generatePaymentAdminHTML(data),
      text: `Pago de €${data.amount} recibido de ${data.userName}`,
    }

    const userEmailData: EmailData = {
      to: data.userEmail,
      subject: `Pago confirmado: €${data.amount} - Semzo Privé`,
      html: this.generatePaymentUserHTML(data),
      text: `Tu pago de €${data.amount} ha sido procesado exitosamente.`,
    }

    const adminSent = await this.sendWithResend(adminEmailData)
    const userSent = await this.sendWithResend(userEmailData)

    return adminSent && userSent
  }

  async sendMembershipCreatedEmail(data: {
    userName: string
    userEmail: string
    membershipType: string
    startDate: string
    endDate: string
    benefits: string[]
  }) {
    try {
      await this.sendEmail({
        to: data.userEmail,
        subject: `¡Bienvenida a ${data.membershipType}! - Semzo Privé`,
        html: this.generateMembershipCreatedHTML(data),
      })

      await this.sendEmail({
        to: this.adminEmail,
        subject: `Nueva membresía activada: ${data.membershipType}`,
        html: this.generateMembershipCreatedAdminHTML(data),
      })
    } catch (error) {
      console.error("Error sending membership created email:", error)
    }
  }

  async sendMembershipExpiringEmail(data: {
    userName: string
    userEmail: string
    membershipType: string
    endDate: string
    daysRemaining: number
  }) {
    try {
      await this.sendEmail({
        to: data.userEmail,
        subject: `Tu membresía ${data.membershipType} expira pronto - Semzo Privé`,
        html: this.generateMembershipExpiringHTML(data),
      })
    } catch (error) {
      console.error("Error sending membership expiring email:", error)
    }
  }

  async sendMembershipCancelledEmail(data: {
    userName: string
    userEmail: string
    membershipType: string
    endDate: string
  }) {
    try {
      await this.sendEmail({
        to: data.userEmail,
        subject: `Confirmación de cancelación - Semzo Privé`,
        html: this.generateMembershipCancelledHTML(data),
      })

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

  private generateContactAdminHTML(
    name: string,
    email: string,
    subject: string,
    message: string,
    priority: string,
  ): string {
    return renderAdminEmail({
      title: "Nueva consulta de contacto",
      intro: `Prioridad: <strong>${priority}</strong>`,
      rows: [
        { label: "Nombre", value: name },
        { label: "Email", value: email },
        { label: "Asunto", value: subject },
        { label: "Mensaje", value: message },
        { label: "Fecha", value: new Date().toLocaleString("es-ES") },
      ],
    })
  }

  private generateContactUserHTML(name: string, subject: string): string {
    return renderBrandEmail({
      preheader: "Hemos recibido tu consulta y te responderemos en 24 horas.",
      eyebrow: "Consulta recibida",
      heading: `Gracias por escribirnos, ${name?.split(" ")[0] || ""}`,
      bodyHtml: `
        <p style="margin:0 0 8px 0;">Hemos recibido tu consulta sobre <strong>"${subject}"</strong> y nuestro equipo la revisará en breve.</p>
        ${emailInfoBox(
          `<strong style="color:${BRAND.navy};">Tiempo de respuesta:</strong> en un plazo de 24 horas.<br>
           Te responderemos a tu correo registrado.`,
        )}
        <p style="margin:0;">Si tu consulta es urgente, también puedes escribirnos a <a href="mailto:${BRAND.supportEmail}" style="color:${BRAND.navy};">${BRAND.supportEmail}</a>.</p>
      `,
    })
  }

  private generateNewsletterHTML(email: string): string {
    return renderBrandEmail({
      preheader: "Gracias por suscribirte a las novedades de Semzo Privé.",
      eyebrow: "Newsletter",
      heading: "Gracias por suscribirte",
      bodyHtml: `
        <p style="margin:0 0 8px 0;">A partir de ahora recibirás nuestras novedades: nuevas piezas de la colección, ofertas exclusivas y tendencias seleccionadas.</p>
        ${emailInfoBox(`<strong style="color:${BRAND.navy};">Suscripción:</strong> ${email}<br><strong style="color:${BRAND.navy};">Frecuencia:</strong> semanal`)}
        <p style="margin:0;">Mantente atenta a tu bandeja de entrada para no perderte nada.</p>
      `,
    })
  }

  private generateNewsletterAdminHTML(data: { email: string; name: string; phone?: string; preferences?: any }): string {
    const rows = [
      { label: "Nombre", value: data.name },
      { label: "Email", value: data.email },
    ]
    if (data.phone) rows.push({ label: "Teléfono", value: data.phone })
    rows.push({ label: "Fecha", value: new Date().toLocaleDateString("es-ES") })
    if (data.preferences) rows.push({ label: "Preferencias", value: JSON.stringify(data.preferences) })
    return renderAdminEmail({ title: "Nueva suscripción al newsletter", rows })
  }

  private generateReservationAdminHTML(data: {
    userEmail: string
    userName: string
    bagName: string
    reservationDate: string
    reservationId?: string
  }): string {
    const rows = [
      { label: "Cliente", value: data.userName },
      { label: "Email", value: data.userEmail },
      { label: "Bolso", value: data.bagName },
      { label: "Fecha de reserva", value: data.reservationDate },
    ]
    if (data.reservationId) rows.push({ label: "ID Reserva", value: data.reservationId })
    return renderAdminEmail({ title: "Nueva reserva recibida", rows, accent: "success" })
  }

  private generateReservationUserHTML(data: {
    userEmail: string
    userName: string
    bagName: string
    reservationDate: string
    reservationId?: string
  }): string {
    return renderBrandEmail({
      preheader: `Tu reserva de ${data.bagName} está confirmada.`,
      eyebrow: "Reserva confirmada",
      heading: `Todo listo, ${data.userName?.split(" ")[0] || ""}`,
      bodyHtml: `
        <p style="margin:0 0 8px 0;">Tu reserva ha sido confirmada correctamente.</p>
        ${emailDetailList(
          [
            { label: "Bolso", value: data.bagName },
            { label: "Fecha", value: data.reservationDate },
            ...(data.reservationId ? [{ label: "ID de reserva", value: data.reservationId }] : []),
          ],
        )}
        <p style="margin:0;">Prepararemos tu pedido y te avisaremos en cuanto salga hacia ti. El periodo de disfrute comienza el día que recibas el bolso.</p>
      `,
      cta: { label: "Ver mi cuenta", url: DASHBOARD_URL },
    })
  }

  private generatePaymentAdminHTML(data: {
    userEmail: string
    userName: string
    amount: string
    paymentId: string
    bagName?: string
  }): string {
    const rows = [
      { label: "Monto", value: `€${data.amount}` },
      { label: "Cliente", value: data.userName },
      { label: "Email", value: data.userEmail },
      { label: "ID de pago", value: data.paymentId },
    ]
    if (data.bagName) rows.push({ label: "Bolso", value: data.bagName })
    rows.push({ label: "Fecha", value: new Date().toLocaleDateString("es-ES") })
    return renderAdminEmail({ title: "Pago recibido", rows, accent: "success" })
  }

  private generatePaymentUserHTML(data: {
    userEmail: string
    userName: string
    amount: string
    paymentId: string
    bagName?: string
  }): string {
    return renderBrandEmail({
      preheader: `Tu pago de €${data.amount} se ha procesado correctamente.`,
      eyebrow: "Pago confirmado",
      heading: "Hemos recibido tu pago",
      bodyHtml: `
        <p style="margin:0 0 8px 0;">Hola ${data.userName?.split(" ")[0] || ""}, tu pago se ha procesado exitosamente.</p>
        ${emailDetailList(
          [
            { label: "Monto", value: `€${data.amount}` },
            { label: "ID de pago", value: data.paymentId },
            ...(data.bagName ? [{ label: "Bolso", value: data.bagName }] : []),
          ],
        )}
        <p style="margin:0;">Recibirás un recibo detallado por separado. Si tienes cualquier duda, estamos a tu disposición.</p>
      `,
    })
  }

  private generateCancellationAdminHTML(data: {
    userName: string
    bagName: string
    reservationId: string
    cancellationDate: string
  }): string {
    return renderAdminEmail({
      title: "Reserva cancelada",
      intro: `<strong>${data.userName}</strong> ha cancelado su reserva. El bolso vuelve a estar disponible en el catálogo.`,
      rows: [
        { label: "Bolso", value: data.bagName },
        { label: "ID de reserva", value: data.reservationId },
        { label: "Fecha de cancelación", value: new Date(data.cancellationDate).toLocaleString("es-ES") },
      ],
      accent: "danger",
    })
  }

  private generateCancellationUserHTML(data: { userName: string; bagName: string; reservationId: string }): string {
    return renderBrandEmail({
      preheader: `Tu reserva de ${data.bagName} ha sido cancelada.`,
      eyebrow: "Reserva cancelada",
      heading: `Hola ${data.userName?.split(" ")[0] || ""}`,
      bodyHtml: `
        <p style="margin:0 0 8px 0;">Tu reserva ha sido cancelada correctamente.</p>
        ${emailDetailList([
          { label: "Bolso cancelado", value: data.bagName },
          { label: "ID de reserva", value: data.reservationId },
        ])}
        <p style="margin:0;">Esperamos verte pronto de nuevo. Nuestro catálogo exclusivo sigue disponible para ti.</p>
      `,
      cta: { label: "Explorar catálogo", url: CATALOG_URL },
    })
  }

  private generateMembershipCreatedHTML(data: {
    userName: string
    membershipType: string
    startDate: string
    endDate: string
    benefits: string[]
  }): string {
    const benefits = data.benefits?.length
      ? `<ul style="margin:12px 0 0 0;padding-left:18px;">${data.benefits.map((b) => `<li>${b}</li>`).join("")}</ul>`
      : ""
    return renderBrandEmail({
      preheader: `Tu membresía ${data.membershipType} está activa.`,
      eyebrow: "Membresía activada",
      heading: `Bienvenida a ${data.membershipType}`,
      bodyHtml: `
        <p style="margin:0 0 8px 0;">Hola ${data.userName?.split(" ")[0] || ""}, tu membresía <strong>${data.membershipType}</strong> ha sido activada exitosamente.</p>
        ${emailDetailList([
          { label: "Fecha de inicio", value: esDate(data.startDate) },
          { label: "Válida hasta", value: esDate(data.endDate) },
        ])}
        ${benefits ? emailInfoBox(`<strong style="color:${BRAND.navy};">Tus beneficios</strong>${benefits}`, "gold") : ""}
        <p style="margin:0;">Ya puedes comenzar a reservar bolsos desde tu panel de socia.</p>
      `,
      cta: { label: "Ir a mi cuenta", url: DASHBOARD_URL, accent: "gold" },
    })
  }

  private generateMembershipCreatedAdminHTML(data: {
    userName: string
    userEmail: string
    membershipType: string
    startDate: string
    endDate: string
  }): string {
    return renderAdminEmail({
      title: "Nueva membresía activada",
      rows: [
        { label: "Cliente", value: data.userName },
        { label: "Email", value: data.userEmail },
        { label: "Tipo", value: data.membershipType },
        { label: "Inicio", value: esDate(data.startDate) },
        { label: "Fin", value: esDate(data.endDate) },
      ],
      accent: "success",
    })
  }

  private generateMembershipExpiringHTML(data: {
    userName: string
    membershipType: string
    endDate: string
    daysRemaining: number
  }): string {
    return renderBrandEmail({
      preheader: `Tu membresía ${data.membershipType} expira en ${data.daysRemaining} días.`,
      eyebrow: "Renovación",
      heading: "Tu membresía expira pronto",
      bodyHtml: `
        <p style="margin:0 0 8px 0;">Hola ${data.userName?.split(" ")[0] || ""}, tu membresía <strong>${data.membershipType}</strong> expirará en ${data.daysRemaining} días.</p>
        ${emailInfoBox(`<strong style="color:${BRAND.navy};">Fecha de expiración:</strong> ${esDate(data.endDate)}`, "warning")}
        <p style="margin:0;">Renueva ahora para seguir disfrutando de nuestra colección exclusiva sin interrupciones.</p>
      `,
      cta: { label: "Renovar membresía", url: `${BRAND.site}/membresias`, accent: "gold" },
    })
  }

  private generateMembershipCancelledHTML(data: { userName: string; membershipType: string; endDate: string }): string {
    return renderBrandEmail({
      preheader: "Confirmación de cancelación de tu membresía.",
      eyebrow: "Cancelación",
      heading: `Hola ${data.userName?.split(" ")[0] || ""}`,
      bodyHtml: `
        <p style="margin:0 0 8px 0;">Tu membresía <strong>${data.membershipType}</strong> ha sido cancelada según tu solicitud.</p>
        ${emailInfoBox(`<strong style="color:${BRAND.navy};">Tendrás acceso hasta:</strong> ${esDate(data.endDate)}`)}
        <p style="margin:0;">Después de esa fecha no podrás reservar bolsos. Si cambias de opinión, puedes reactivar tu membresía en cualquier momento.</p>
      `,
      cta: { label: "Reactivar membresía", url: `${BRAND.site}/membresias` },
    })
  }

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

  async sendShipmentCreatedEmail(data: {
    userEmail: string
    userName: string
    trackingNumber: string
    carrier: string
    estimatedDelivery?: string
    bagName?: string
  }): Promise<boolean> {
    const trackingUrl =
      data.carrier === "Correos"
        ? `https://www.correos.es/es/es/herramientas/localizador/envios/${data.trackingNumber}`
        : "#"

    const userEmailData: EmailData = {
      to: data.userEmail,
      subject: "Tu pedido ha sido enviado - Semzo Privé",
      html: renderBrandEmail({
        preheader: "Tu pedido de Semzo Privé está en camino.",
        eyebrow: "Envío en camino",
        heading: "Tu pedido está en camino",
        bodyHtml: `
          <p style="margin:0 0 8px 0;">Hola ${data.userName?.split(" ")[0] || ""}, tu pedido${data.bagName ? ` (<strong>${data.bagName}</strong>)` : ""} ha sido enviado.</p>
          ${emailDetailList([
            { label: "Transportista", value: data.carrier },
            { label: "Nº de seguimiento", value: data.trackingNumber },
            ...(data.estimatedDelivery ? [{ label: "Entrega estimada", value: data.estimatedDelivery }] : []),
          ])}
          <p style="margin:0;">Recibirás tu pedido en 1-2 días laborables. Recuerda: tu periodo de disfrute empieza el día de la entrega.</p>
        `,
        cta: { label: "Seguir mi envío", url: trackingUrl, accent: "gold" },
      }),
    }

    const adminEmailData: EmailData = {
      to: this.adminEmail,
      subject: `Envío creado: ${data.trackingNumber}`,
      html: renderAdminEmail({
        title: "Nuevo envío creado",
        rows: [
          { label: "Cliente", value: `${data.userName} (${data.userEmail})` },
          { label: "Tracking", value: data.trackingNumber },
          { label: "Transportista", value: data.carrier },
          ...(data.bagName ? [{ label: "Producto", value: data.bagName }] : []),
        ],
      }),
    }

    const userSent = await this.sendWithResend(userEmailData)
    const adminSent = await this.sendWithResend(adminEmailData)
    return userSent && adminSent
  }

  // Email de marca completo (documento HTML propio, no usa renderBrandEmail)
  // que se dispara en la PRIMERA transicion pending -> in_transit detectada
  // por el cron /api/cron/track-shipments al consultar la API de Correos.
  // nombreBolso viene del objeto shipment -> reservation -> bag de la
  // reserva activa de la socia, resuelto en el propio cron.
  async sendShipmentInTransitEmail(data: {
    userEmail: string
    userName: string
    bagName?: string
  }): Promise<boolean> {
    const firstName = data.userName?.split(" ")[0] || ""
    const bagName = data.bagName || "tu bolso"

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SEMZO PRIVÉ · Ya está en camino algo especial</title>
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

  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background-color:#ffffff;margin:0 auto;border-collapse:collapse;">
    <tr>
      <td style="padding:0;background-color:#ffffff;">

        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:12px 20px 6px 20px;">
              <img src="https://semzoprive.com/images/logo-semzo-prive.png" alt="" width="200" style="display:block;height:auto;max-width:200px;border:0;" />
            </td>
          </tr>
        </table>

        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0 0 0;">
              <img src="https://h0ayghjex33jktep.public.blob.vercel-storage.com/blog-images/1786287651083-chanel_iconicos-OiAwAyUwtCsQjKXbt822YJkrIphdT3.jpg" alt="" width="600" style="display:block;width:100%;height:auto;border:0;" />
            </td>
          </tr>
        </table>

        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:32px 30px 8px 30px;">
              <h1 style="margin:0;font-family:'Playfair Display',Georgia,serif;font-weight:400;font-size:28px;line-height:1.3;color:#1a1a4b;letter-spacing:-0.3px;">
                Ya está en camino<br />algo especial
              </h1>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:12px 0 20px 0;">
              <div style="width:40px;height:2px;background-color:#c9a96e;margin:0 auto;"></div>
            </td>
          </tr>
        </table>

        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:0 20px 0 20px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:440px;border-collapse:collapse;">
                <tr>
                  <td style="color:#1a1a4b;font-size:16px;line-height:1.8;padding:0;">
                    <p style="margin:0 0 20px 0;">Hola ${firstName},</p>
                    <p style="margin:0 0 20px 0;">Tu <strong>${bagName}</strong> acaba de salir hacia ti.</p>
                    <p style="margin:0 0 20px 0;">Llegará en 24-48 horas. Pero antes de que llegue, quiero contarte algo sobre la pieza que elegiste — porque cada bolso de nuestra colección tiene una historia y merece que la conozcas.</p>
                    <p style="margin:0 0 20px 0;"><strong>${bagName}</strong> es una de esas piezas que no pasan desapercibidas. Diseñado para durar décadas, construido con materiales que mejoran con el uso. Cuando lo tengas en las manos, notarás el peso — no como carga, sino como presencia.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background-color:#fff0f3;margin-top:20px;">
          <tr>
            <td align="center" style="padding:28px 30px;">
              <p style="margin:0 0 16px 0;font-family:'Playfair Display',Georgia,serif;font-size:19px;font-weight:500;color:#1a1a4b;text-align:center;">
                Cómo cuidarlo mientras está contigo
              </p>
              <ul style="margin:0;padding-left:0;list-style-type:none;text-align:left;color:#1a1a4b;font-size:15px;line-height:1.8;">
                <li style="margin:0 0 10px 0;">• Guárdalo siempre en su funda cuando no lo uses — el cuero necesita respirar pero no le gusta el polvo.</li>
                <li style="margin:0 0 10px 0;">• Evita el contacto con superficies húmedas y aléjalo de la luz directa prolongada.</li>
                <li style="margin:0 0 10px 0;">• Si se moja, sécalo con un paño suave sin frotarlo.</li>
                <li style="margin:0;">• Y lo más importante — <strong>úsalo</strong>. Los bolsos de cuero se tensionan y pierden forma cuando no se usan. Llévalo. Es para eso.</li>
              </ul>
              <div style="width:30px;height:1px;background-color:#c9a96e;margin:20px auto 0 auto;"></div>
            </td>
          </tr>
        </table>

        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:28px 20px 0 20px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:440px;border-collapse:collapse;">
                <tr>
                  <td style="color:#1a1a4b;font-size:16px;line-height:1.8;padding:0;">
                    <p style="margin:0 0 20px 0;">Tu sobre de devolución prepagado viene dentro del paquete. Cuando quieras cambiarlo, avísanos con 24 horas de antelación y coordinamos la recogida.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:20px 20px 20px 20px;">
              <div style="width:60px;height:1px;background-color:#c9a96e;margin:0 auto 24px auto;"></div>
              <p style="margin:0;font-family:'Playfair Display',Georgia,serif;font-size:28px;line-height:1.35;font-weight:500;color:#1a1a4b;letter-spacing:-0.4px;text-align:center;">
                Espero que te acompañe<br />en algo memorable.
              </p>
              <div style="width:60px;height:1px;background-color:#c9a96e;margin:24px auto 0 auto;"></div>
            </td>
          </tr>
        </table>

        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:0 20px 10px 20px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:440px;border-collapse:collapse;">
                <tr>
                  <td style="color:#1a1a4b;font-size:17px;line-height:1.7;padding:0;text-align:center;font-family:'Playfair Display',Georgia,serif;font-style:italic;">
                    <p style="margin:0;">Mientras esperas, puedes ir pensando<br />en cuál será el siguiente.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:10px 20px 12px 20px;">
              <a href="https://semzoprive.com/catalog" style="display:inline-block;background-color:#1a1a4b;color:#ffffff;font-size:16px;font-weight:500;text-decoration:none;padding:18px 64px;letter-spacing:2px;text-transform:uppercase;border:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;min-width:220px;text-align:center;box-shadow:0 4px 12px rgba(26,26,75,0.2);">
                Ver la colección
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 20px 36px 20px;">
              <a href="https://semzoprive.com/proceso" style="display:inline-block;color:#1a1a4b;font-size:14px;font-family:'Playfair Display',Georgia,serif;font-style:italic;text-decoration:underline;text-underline-offset:3px;padding:10px 0;">
                Cómo funciona el cambio de bolso
              </a>
            </td>
          </tr>
        </table>

        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;padding-top:10px;">
          <tr>
            <td align="center" style="padding:0 20px 30px 20px;">
              <p style="margin:0 0 0 0;font-family:'Great Vibes',cursive;font-size:42px;color:#1a1a4b;text-align:center;letter-spacing:1px;line-height:1.2;">Erika</p>
              <p style="margin:4px 0 0 0;font-size:14px;color:#7a7a94;letter-spacing:0.5px;text-align:center;">Fundadora de SEMZO PRIVÉ</p>
              <div style="width:30px;height:1px;background-color:#c9a96e;margin:20px auto 18px auto;"></div>
              <p style="margin:0 0 0 0;font-family:'Playfair Display',Georgia,serif;font-size:18px;line-height:1.5;font-style:italic;color:#1a1a4b;text-align:center;letter-spacing:-0.2px;">"El verdadero lujo no consiste en tener más.<br />Consiste en elegir mejor."</p>
              <div style="width:40px;height:1px;background-color:#c9a96e;margin:24px auto 20px auto;"></div>
              <p style="margin:0 0 2px 0;font-family:'Playfair Display',Georgia,serif;font-size:20px;font-weight:600;color:#1a1a4b;letter-spacing:0.5px;text-align:center;">SEMZO PRIVÉ</p>
              <p style="margin:0 0 0 0;font-family:'Playfair Display',Georgia,serif;font-size:14px;font-style:italic;color:#7a7a94;text-align:center;letter-spacing:0.3px;">Tu puerta de acceso al armario de tus sueños</p>
              <div style="height:18px;"></div>
              <table border="0" cellpadding="0" cellspacing="0" style="margin:0 auto;border-collapse:collapse;">
                <tr>
                  <td align="center" style="padding:0 12px;"><a href="https://instagram.com/semzoprive" target="_blank" style="display:inline-block;text-decoration:none;background-color:#f6c1c8;border-radius:50%;padding:10px;"><img src="https://cdn.simpleicons.org/instagram/1e1b4b" width="24" height="24" alt="Instagram" style="display:block;border:0;" /></a></td>
                  <td align="center" style="padding:0 12px;"><a href="https://pinterest.com/semzoprive" target="_blank" style="display:inline-block;text-decoration:none;background-color:#f6c1c8;border-radius:50%;padding:10px;"><img src="https://cdn.simpleicons.org/pinterest/1e1b4b" width="24" height="24" alt="Pinterest" style="display:block;border:0;" /></a></td>
                  <td align="center" style="padding:0 12px;"><a href="https://tiktok.com/@semzoprive" target="_blank" style="display:inline-block;text-decoration:none;background-color:#f6c1c8;border-radius:50%;padding:10px;"><img src="https://cdn.simpleicons.org/tiktok/1e1b4b" width="24" height="24" alt="TikTok" style="display:block;border:0;" /></a></td>
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

        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:0 20px 14px 20px;font-size:9px;color:#d0d0d0;letter-spacing:0.3px;">
              <span>© 2026 SEMZO PRIVÉ · </span><a href="#" style="color:#d0d0d0;text-decoration:none;">Darse de baja</a>
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
      subject: "Ya está en camino algo especial - Semzo Privé",
      html,
    })
  }

  async sendShipmentDeliveredEmail(data: {
    userEmail: string
    userName: string
    bagName?: string
    membershipEndDate?: string
  }): Promise<boolean> {
    const userEmailData: EmailData = {
      to: data.userEmail,
      subject: "Tu bolso ha sido entregado - Semzo Privé",
      html: renderBrandEmail({
        preheader: "Tu bolso ha sido entregado. ¡Disfrútalo!",
        eyebrow: "Entrega confirmada",
        heading: "¡Disfruta tu bolso!",
        bodyHtml: `
          <p style="margin:0 0 8px 0;">Hola ${data.userName?.split(" ")[0] || ""}, tu bolso${data.bagName ? ` <strong>${data.bagName}</strong>` : ""} ha sido entregado correctamente.</p>
          ${emailInfoBox(
            `<strong style="color:${BRAND.navy};">Tu periodo de disfrute comienza hoy.</strong>${
              data.membershipEndDate
                ? `<br>Fecha de devolución prevista: <strong>${esDate(data.membershipEndDate)}</strong>`
                : ""
            }`,
            "gold",
          )}
          <p style="margin:0;">¡Que disfrutes de tu experiencia Semzo Privé!</p>
        `,
        cta: { label: "Ir a mi cuenta", url: DASHBOARD_URL, accent: "gold" },
      }),
    }

    return await this.sendWithResend(userEmailData)
  }

  async sendReturnReminderEmail(data: {
    userEmail: string
    userName: string
    bagName: string
    bagBrand?: string
    bagImageUrl?: string | null
    returnDate: string
    daysRemaining: number
  }): Promise<boolean> {
    const userEmailData: EmailData = {
      to: data.userEmail,
      subject: `Recordatorio: devolución de ${data.bagName} en ${data.daysRemaining} días`,
      html: await render(
        <ReturnReminderEmail
          name={data.userName}
          bagBrand={data.bagBrand || ""}
          bagName={data.bagName}
          bagImageUrl={data.bagImageUrl}
          returnByDate={esDate(data.returnDate)}
          isPetite={false}
          dashboardUrl={`${BRAND.site}/dashboard/mis-reservas`}
        />,
      ),
    }

    return await this.sendWithResend(userEmailData)
  }

  async sendReturnInitiatedEmail(data: {
    userEmail: string
    userName: string
    bagName: string
    trackingNumber?: string
    returnLabel?: string
  }): Promise<boolean> {
    const steps = ["Empaca el bolso en su caja original o similar", "Imprime la etiqueta de envío", "Pega la etiqueta en el paquete", "Déjalo en cualquier oficina de Correos"]
      .map(
        (s, i) =>
          `<tr>
             <td style="width:26px;vertical-align:top;padding:6px 0;">
               <span style="display:inline-block;width:22px;height:22px;line-height:22px;text-align:center;border-radius:50%;background:${BRAND.navy};color:#fff;font-family:${BRAND.sans};font-size:12px;">${i + 1}</span>
             </td>
             <td style="padding:6px 0 6px 10px;font-family:${BRAND.sans};font-size:15px;color:${BRAND.ink};">${s}</td>
           </tr>`,
      )
      .join("")

    const userEmailData: EmailData = {
      to: data.userEmail,
      subject: `Etiqueta de devolución - ${data.bagName}`,
      html: renderBrandEmail({
        preheader: `Instrucciones para devolver ${data.bagName}.`,
        eyebrow: "Devolución",
        heading: "Cómo devolver tu bolso",
        bodyHtml: `
          <p style="margin:0 0 8px 0;">Hola ${data.userName?.split(" ")[0] || ""}, aquí tienes las instrucciones para devolver tu bolso <strong>${data.bagName}</strong>.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">${steps}</table>
          ${data.trackingNumber ? emailInfoBox(`<strong style="color:${BRAND.navy};">Nº de seguimiento:</strong> ${data.trackingNumber}`) : ""}
        `,
        cta: data.returnLabel ? { label: "Descargar etiqueta", url: data.returnLabel, accent: "gold" } : undefined,
      }),
    }

    const adminEmailData: EmailData = {
      to: this.adminEmail,
      subject: `Devolución iniciada: ${data.bagName}`,
      html: renderAdminEmail({
        title: "Devolución iniciada",
        rows: [
          { label: "Cliente", value: `${data.userName} (${data.userEmail})` },
          { label: "Bolso", value: data.bagName },
          ...(data.trackingNumber ? [{ label: "Tracking", value: data.trackingNumber }] : []),
        ],
      }),
    }

    const userSent = await this.sendWithResend(userEmailData)
    const adminSent = await this.sendWithResend(adminEmailData)
    return userSent && adminSent
  }

  async sendReturnReceivedEmail(data: { userEmail: string; userName: string; bagName: string }): Promise<boolean> {
    const userEmailData: EmailData = {
      to: data.userEmail,
      subject: `Devolución recibida - ${data.bagName}`,
      html: renderBrandEmail({
        preheader: `Hemos recibido tu bolso ${data.bagName}.`,
        eyebrow: "Devolución recibida",
        heading: "¡Devolución recibida!",
        bodyHtml: `
          <p style="margin:0 0 8px 0;">Hola ${data.userName?.split(" ")[0] || ""},</p>
          ${emailInfoBox(
            `Hemos recibido tu bolso <strong>${data.bagName}</strong> en perfectas condiciones. ¡Gracias por cuidarlo!`,
            "success",
          )}
          <p style="margin:0;">Ya puedes reservar un nuevo bolso de nuestra colección.</p>
        `,
        cta: { label: "Explorar catálogo", url: CATALOG_URL, accent: "gold" },
      }),
    }

    return await this.sendWithResend(userEmailData)
  }

  async sendPaymentFailedEmail(data: {
    userEmail: string
    userName: string
    amount?: string
    reason?: string
    membershipType?: string
    bagName?: string
  }): Promise<boolean> {
    const t = getMessages("es")
    const userEmailData: EmailData = {
      to: data.userEmail,
      subject: t.dunning.e1.subject,
      html: await render(
        <DunningEmail
          step={1}
          name={data.userName}
          membershipLabel={data.membershipType || "Semzo Privé"}
          bagName={data.bagName}
          updatePaymentUrl={`${BRAND.site}/dashboard/membresia`}
        />,
      ),
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

    const userEmailData: EmailData = {
      to: data.userEmail,
      subject: `Tu Pase Bolso ${tierLabel} está listo - Semzo Privé`,
      html: renderBrandEmail({
        preheader: "Tu Pase Bolso está listo. Ya puedes reservar.",
        eyebrow: "Pase Bolso",
        heading: "Tu Pase Bolso está listo",
        bodyHtml: `
          <p style="margin:0 0 8px 0;">Hola ${data.userName?.split(" ")[0] || ""}, tu compra se ha procesado correctamente. Ya puedes reservar tu bolso.</p>
          ${emailDetailList([
            { label: "Pase", value: tierLabel },
            { label: "Cantidad", value: String(data.quantity) },
            { label: "Total", value: `€${data.totalPrice.toFixed(2)}` },
            { label: "Método de pago", value: paymentLabel },
          ])}
          <p style="margin:0;">Recuerda: cada pase te permite disfrutar de un bolso durante 1 semana.</p>
        `,
        cta: { label: "Reservar mi bolso", url: `${BRAND.site}/catalogo`, accent: "gold" },
      }),
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

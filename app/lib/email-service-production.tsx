"use client"

import { EMAIL_CONFIG } from "../config/email-config"

interface EmailData {
  to: string
  customerName: string
  bagName?: string
  bagBrand?: string
  membershipType?: "essentiel" | "signature" | "prive"
  availableDate?: Date
  reservationId?: string
  waitingListPosition?: number
  totalWaiting?: number
}

export class ProductionEmailService {
  private static instance: ProductionEmailService

  static getInstance(): ProductionEmailService {
    if (!ProductionEmailService.instance) {
      ProductionEmailService.instance = new ProductionEmailService()
    }
    return ProductionEmailService.instance
  }

  // 🚀 MÉTODO PRINCIPAL PARA ENVIAR EMAILS
  async sendEmail(type: string, data: EmailData): Promise<boolean> {
    try {
      // En desarrollo, solo simular
      if (EMAIL_CONFIG.isDevelopment) {
        console.log(`📧 [DESARROLLO] Email tipo: ${type} para ${data.customerName}`)
        return true
      }

      // En producción, enviar email real
      const template = this.getEmailTemplate(type, data)
      const success = await this.sendRealEmail(data.to, template.subject, template.html)

      if (success) {
        console.log(`✅ Email enviado: ${type} a ${data.customerName}`)
      } else {
        console.error(`❌ Error enviando email: ${type} a ${data.customerName}`)
      }

      return success
    } catch (error) {
      console.error("Error en servicio de email:", error)
      return false
    }
  }

  // 📧 ENVÍO REAL SEGÚN EL PROVEEDOR
  private async sendRealEmail(to: string, subject: string, html: string): Promise<boolean> {
    const provider = EMAIL_CONFIG.provider

    try {
      switch (provider) {
        case "resend":
          return await this.sendWithResend(to, subject, html)
        case "sendgrid":
          return await this.sendWithSendGrid(to, subject, html)
        case "mailgun":
          return await this.sendWithMailgun(to, subject, html)
        default:
          throw new Error(`Proveedor no soportado: ${provider}`)
      }
    } catch (error) {
      console.error(`Error con proveedor ${provider}:`, error)
      return false
    }
  }

  // 🔥 RESEND (RECOMENDADO - MÁS FÁCIL)
  private async sendWithResend(to: string, subject: string, html: string): Promise<boolean> {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: EMAIL_CONFIG.providers.resend.headers,
      body: JSON.stringify({
        from: `${EMAIL_CONFIG.fromName} <${EMAIL_CONFIG.fromEmail}>`,
        to: [to],
        subject: subject,
        html: html,
        reply_to: EMAIL_CONFIG.replyTo,
      }),
    })

    return response.ok
  }

  // 📮 SENDGRID
  private async sendWithSendGrid(to: string, subject: string, html: string): Promise<boolean> {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: EMAIL_CONFIG.providers.sendgrid.headers,
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: EMAIL_CONFIG.fromEmail, name: EMAIL_CONFIG.fromName },
        subject: subject,
        content: [{ type: "text/html", value: html }],
        reply_to: { email: EMAIL_CONFIG.replyTo },
      }),
    })

    return response.ok
  }

  // 📬 MAILGUN
  private async sendWithMailgun(to: string, subject: string, html: string): Promise<boolean> {
    const formData = new FormData()
    formData.append("from", `${EMAIL_CONFIG.fromName} <${EMAIL_CONFIG.fromEmail}>`)
    formData.append("to", to)
    formData.append("subject", subject)
    formData.append("html", html)

    const response = await fetch(
      `${EMAIL_CONFIG.providers.mailgun.baseUrl}/${EMAIL_CONFIG.providers.mailgun.domain}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`api:${EMAIL_CONFIG.apiKey}`)}`,
        },
        body: formData,
      },
    )

    return response.ok
  }

  // 📄 TEMPLATES DE EMAIL (los mismos que ya teníamos)
  private getEmailTemplate(type: string, data: EmailData) {
    // ... (usar los mismos templates que ya creamos)
    const baseStyles = `
      <style>
        .email-container { max-width: 600px; margin: 0 auto; font-family: 'Georgia', serif; background: #ffffff; }
        .header { background: linear-gradient(135deg, #1a1a4b 0%, #2d2d7a 100%); padding: 40px 20px; text-align: center; }
        .logo { color: #ffffff; font-size: 32px; font-weight: bold; letter-spacing: 2px; }
        .content { padding: 40px 30px; line-height: 1.6; color: #333333; }
        .button { display: inline-block; background: linear-gradient(135deg, #1a1a4b 0%, #2d2d7a 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666666; font-size: 14px; }
      </style>
    `

    // Retornar template básico (puedes usar los completos que ya creamos)
    return {
      subject: `Notificación de Semzo Privé - ${type}`,
      html: `${baseStyles}<div class="email-container"><div class="header"><div class="logo">SEMZO PRIVÉ</div></div><div class="content"><h2>Hola ${data.customerName}!</h2><p>Notificación del tipo: ${type}</p></div></div>`,
    }
  }

  // 🎯 MÉTODOS PÚBLICOS FÁCILES DE USAR
  async sendWaitingListConfirmation(data: EmailData) {
    return this.sendEmail("waiting_list_confirmation", data)
  }

  async sendBagAvailableNotification(data: EmailData) {
    return this.sendEmail("bag_available", data)
  }

  async sendReservationConfirmation(data: EmailData) {
    return this.sendEmail("reservation_confirmed", data)
  }

  async sendReturnReminder(data: EmailData) {
    return this.sendEmail("return_reminder", data)
  }

  async sendWelcomeMembership(data: EmailData) {
    return this.sendEmail("welcome_membership", data)
  }
}

// 🎯 HOOK FÁCIL DE USAR
export function useProductionEmailService() {
  return ProductionEmailService.getInstance()
}

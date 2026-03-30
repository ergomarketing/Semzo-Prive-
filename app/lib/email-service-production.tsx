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

import { emailQueue } from "./email-queue"

export class EmailServiceProduction {
  private static instance: EmailServiceProduction
  private config: EmailConfig
  private adminEmail = "mailbox@semzoprive.com" // Added admin email

  constructor() {
    const hasResend = !!(process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY)
    const hasSmtp = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)

    this.config = {
      provider: hasResend ? "resend" : hasSmtp ? "smtp" : "resend",
      apiKey: process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY || "",
      fromEmail: process.env.SMTP_USER || "noreply@semzoprive.com", // Use SMTP user if available, otherwise default
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
        const apiKey = process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY || ""

        if (!apiKey) {
          console.error("❌ No hay API key de Resend disponible")
          return false
        }

        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Semzo Privé <noreply@semzoprive.com>",
            to: [data.to],
            subject: data.subject,
            html: data.html,
            text: data.text || data.subject,
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

  async sendWelcomeEmail(email: string, customerName: string, confirmationUrl: string): Promise<boolean> {
    const emailData: EmailData = {
      to: email,
      subject: "¡Bienvenida a Semzo Privé! Confirma tu cuenta",
      html: this.generateWelcomeHTML(customerName, confirmationUrl),
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
    // Send notification to admin
    const adminEmailData: EmailData = {
      to: this.adminEmail,
      subject: `Nueva consulta: ${subject}`,
      html: this.generateContactAdminHTML(name, email, subject, message, priority),
      text: `Nueva consulta de ${name} (${email}): ${message}`,
    }

    // Send confirmation to user
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

    // Send notification to admin
    const adminEmailData: EmailData = {
      to: this.adminEmail,
      subject: `Nueva suscripción al newsletter: ${name}`,
      html: this.generateNewsletterAdminHTML(data),
      text: `Nueva suscripción de ${name} (${email}) al newsletter.`,
    }

    // Send confirmation to user
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


    // Send notification to admin
    const adminEmailData: EmailData = {
      to: this.adminEmail,
      subject: `Reserva cancelada: ${data.bagName}`,
      html: this.generateCancellationAdminHTML(data),
      text: `${data.userName} ha cancelado su reserva de ${data.bagName}`,
    }

    // Send confirmation to user
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
    // Send notification to admin
    const adminEmailData: EmailData = {
      to: this.adminEmail,
      subject: `Pago recibido: €${data.amount}`,
      html: this.generatePaymentAdminHTML(data),
      text: `Pago de €${data.amount} recibido de ${data.userName}`,
    }

    // Send confirmation to user
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
      const html = this.generateMembershipCreatedHTML(data)
      await this.sendEmail({
        to: data.userEmail,
        subject: `¡Bienvenida a ${data.membershipType}! - Semzo Privé`,
        html,
      })

      const adminHtml = this.generateMembershipCreatedAdminHTML(data)
      await this.sendEmail({
        to: this.adminEmail,
        subject: `Nueva membresía activada: ${data.membershipType}`,
        html: adminHtml,
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
      const html = this.generateMembershipExpiringHTML(data)
      await this.sendEmail({
        to: data.userEmail,
        subject: `Tu membresía ${data.membershipType} expira pronto - Semzo Privé`,
        html,
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
      const html = this.generateMembershipCancelledHTML(data)
      await this.sendEmail({
        to: data.userEmail,
        subject: `Confirmación de cancelación - Semzo Privé`,
        html,
      })

      const adminHtml = this.generateMembershipCancelledAdminHTML(data)
      await this.sendEmail({
        to: this.adminEmail,
        subject: `Membresía cancelada: ${data.membershipType}`,
        html: adminHtml,
      })
    } catch (error) {
      console.error("Error sending membership cancelled email:", error)
    }
  }

  private generateWelcomeHTML(customerName: string, confirmationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bienvenida a Semzo Privé</title>
          <style>
              body { 
                  font-family: Arial, sans-serif; 
                  line-height: 1.6; 
                  color: #333; 
                  margin: 0; 
                  padding: 0; 
                  background-color: #f5f5f5;
              }
              .container { 
                  max-width: 600px; 
                  margin: 0 auto; 
                  background: white; 
                  border-radius: 12px; 
                  overflow: hidden; 
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .header { 
                  background: #2B2D6B; 
                  color: white; 
                  padding: 40px 20px; 
                  text-align: center; 
              }
              .header h1 { 
                  margin: 0; 
                  font-size: 32px; 
                  font-weight: normal; 
                  letter-spacing: 2px; 
              }
              .header p { 
                  margin: 8px 0 0 0; 
                  opacity: 0.9; 
                  font-size: 14px; 
                  letter-spacing: 1px;
              }
              .content { 
                  padding: 40px 30px; 
                  text-align: center;
              }
              .content h2 { 
                  color: #2B2D6B; 
                  margin: 0 0 20px 0; 
                  font-size: 24px; 
                  font-weight: normal;
              }
              .content h3 { 
                  color: #333; 
                  margin: 30px 0 20px 0; 
                  font-size: 20px; 
                  font-weight: bold;
              }
              .content p { 
                  margin-bottom: 20px; 
                  font-size: 16px; 
                  line-height: 1.6; 
                  color: #666;
                  text-align: center;
              }
              .button { 
                  display: inline-block; 
                  background: #E8B4CB; 
                  color: #2B2D6B; 
                  padding: 15px 35px; 
                  text-decoration: none; 
                  border-radius: 25px; 
                  font-weight: bold; 
                  margin: 30px 0; 
                  font-size: 16px;
                  letter-spacing: 0.5px;
              }
              .benefits { 
                  background: #f8f9fa; 
                  padding: 25px; 
                  margin: 30px 0; 
                  border-left: 4px solid #E8B4CB; 
                  text-align: left;
              }
              .benefits h4 {
                  color: #333;
                  margin: 0 0 15px 0;
                  font-size: 16px;
                  font-weight: bold;
              }
              .benefits p {
                  margin: 0 0 15px 0;
                  font-size: 14px;
                  color: #666;
                  text-align: left;
              }
              .benefits ul {
                  list-style: none;
                  padding: 0;
                  margin: 0;
              }
              .benefits li {
                  padding: 4px 0;
                  color: #666;
                  font-size: 14px;
              }
              .benefits li:before {
                  content: "• ";
                  color: #333;
                  font-weight: bold;
                  margin-right: 8px;
              }
              .footer { 
                  background: #2B2D6B; 
                  color: white; 
                  padding: 30px; 
                  text-align: center; 
                  font-size: 14px; 
              }
              .footer p {
                  margin: 5px 0;
                  opacity: 0.9;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>Semzo Privé</h1>
                  <p>Acceso Exclusivo al Lujo</p>
              </div>
              
              <div class="content">
                  <h2>Semzo Privé</h2>
                  
                  <h3>¡Bienvenida a la experiencia exclusiva!</h3>
                  
                  <p>Estamos encantados de darte la bienvenida a nuestra comunidad exclusiva. En Semzo Privé, encontrarás una selección cuidadosamente curada de los bolsos de lujo más exclusivos de diseñadores.</p>
                  
                  <p>Para comenzar tu experiencia premium, por favor confirma tu dirección de email haciendo clic en el botón a continuación:</p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                      <a href="${confirmationUrl}" class="button">
                          Confirmar mi cuenta
                      </a>
                  </div>
                  
                  <div class="benefits">
                      <h4>¿Por qué confirmar tu cuenta?</h4>
                      <p>La confirmación de tu email nos ayuda a garantizar la seguridad de tu cuenta y te da acceso completo a todas las funciones exclusivas de Semzo Privé, incluyendo:</p>
                      <ul>
                          <li>Acceso a colecciones privadas</li>
                          <li>Ofertas exclusivas para miembros</li>
                          <li>Eventos VIP y lanzamientos anticipados</li>
                          <li>Asesoramiento personalizado de nuestros expertos</li>
                      </ul>
                  </div>
                  
                  <p style="margin-top: 30px; font-size: 14px; color: #999;">Si no creaste esta cuenta, puedes ignorar este email de forma segura.</p>
              </div>
              
              <div class="footer">
                  <p>© 2025 Semzo Privé. Todos los derechos reservados.</p>
                  <p>Soporte: <a href="mailto:contacto@semzoprive.com" style="color: white; text-decoration: underline;">contacto@semzoprive.com</a></p>
              </div>
          </div>
      </body>
      </html>
    `
  }

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
      
      Si tienes alguna pregunta, contactanos en: contacto@semzoprive.com
      
      ¡Gracias por unirte a Semzo Privé!
      
      El equipo de Semzo Privé
      Avenida Ricardo Soriano s.n, Marbella, España
    `
  }

  private generateContactAdminHTML(
    name: string,
    email: string,
    subject: string,
    message: string,
    priority: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Nueva Consulta - Semzo Privé</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .header { background: #1a1a4b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { padding: 30px; }
              .field { margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px; }
              .field strong { color: #1a1a4b; }
              .priority-high { border-left: 4px solid #dc3545; }
              .priority-medium { border-left: 4px solid #ffc107; }
              .priority-low { border-left: 4px solid #28a745; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>Nueva Consulta Recibida</h1>
                  <p>Centro de Soporte - Semzo Privé</p>
              </div>
              <div class="content">
                  <div class="field priority-${priority.toLowerCase()}">
                      <strong>Prioridad:</strong> ${priority}
                  </div>
                  <div class="field">
                      <strong>Nombre:</strong> ${name}
                  </div>
                  <div class="field">
                      <strong>Email:</strong> ${email}
                  </div>
                  <div class="field">
                      <strong>Asunto:</strong> ${subject}
                  </div>
                  <div class="field">
                      <strong>Mensaje:</strong><br>
                      ${message.replace(/\n/g, "<br>")}
                  </div>
                  <p style="color: #666; font-size: 14px; margin-top: 30px;">
                      Responde directamente a ${email} para atender esta consulta.
                  </p>
              </div>
          </div>
      </body>
      </html>
    `
  }

  private generateContactUserHTML(name: string, subject: string): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Consulta Recibida - Semzo Privé</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
              .content { padding: 30px; }
              .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>SEMZO PRIVÉ</h1>
                  <p>Hemos recibido tu consulta</p>
              </div>
              <div class="content">
                  <h2>¡Hola ${name}!</h2>
                  <p>Gracias por contactarnos. Hemos recibido tu consulta sobre "<strong>${subject}</strong>" y nuestro equipo la revisará pronto.</p>
                  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                      <p><strong>⏰ Tiempo de respuesta:</strong> 24 horas</p>
                      <p><strong>📧 Te responderemos a tu email registrado</strong></p>
                  </div>
                  <p>Si tu consulta es urgente, también puedes contactarnos por:</p>
                  <ul>
                      <li>📞 Teléfono: +34 911 234 567</li>
                      <li>💬 Chat en vivo (disponible de 9:00 a 18:00)</li>
                  </ul>
              </div>
              <div class="footer">
                  <p><strong>SEMZO PRIVÉ</strong></p>
                  <p>Avenida Ricardo Soriano s.n, Marbella, España</p>
              </div>
          </div>
      </body>
      </html>
    `
  }

  private generateNewsletterHTML(email: string): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Newsletter - Semzo Privé</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
              .content { padding: 30px; }
              .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>SEMZO PRIVÉ</h1>
                  <p>¡Bienvenida a nuestro newsletter!</p>
              </div>
              <div class="content">
                  <h2>¡Gracias por suscribirte!</h2>
                  <p>Ahora recibirás las últimas novedades sobre nuestra colección de bolsos de lujo, ofertas exclusivas y tendencias de moda.</p>
                  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <p><strong>📧 Suscrito:</strong> ${email}</p>
                      <p><strong>📅 Frecuencia:</strong> Semanal</p>
                  </div>
                  <p>¡Mantente atenta a tu bandeja de entrada para no perderte nada!</p>
              </div>
              <div class="footer">
                  <p><strong>SEMZO PRIVÉ</strong></p>
                  <p>Avenida Ricardo Soriano s.n, Marbella, España</p>
              </div>
          </div>
      </body>
      </html>
    `
  }

  private generateNewsletterAdminHTML(data: {
    email: string
    name: string
    phone?: string
    preferences?: any
  }): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Nueva Suscripción Newsletter - Semzo Privé</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .header { background: #1a1a4b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { padding: 30px; }
              .field { margin-bottom: 15px; padding: 15px; background: #f8f9fa; border-radius: 5px; }
              .field strong { color: #1a1a4b; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>Nueva Suscripción Newsletter</h1>
                  <p>Semzo Privé</p>
              </div>
              <div class="content">
                  <div class="field">
                      <strong>Nombre:</strong> ${data.name}
                  </div>
                  <div class="field">
                      <strong>Email:</strong> ${data.email}
                  </div>
                  ${data.phone ? `<div class="field"><strong>Teléfono:</strong> ${data.phone}</div>` : ""}
                  <div class="field">
                      <strong>Fecha:</strong> ${new Date().toLocaleDateString("es-ES")}
                  </div>
                  ${data.preferences ? `<div class="field"><strong>Preferencias:</strong> ${JSON.stringify(data.preferences, null, 2)}</div>` : ""}
              </div>
          </div>
      </body>
      </html>
    `
  }

  private generateReservationAdminHTML(data: {
    userEmail: string
    userName: string
    bagName: string
    reservationDate: string
    reservationId?: string
  }): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Nueva Reserva - Semzo Privé</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { padding: 30px; }
              .field { margin-bottom: 15px; padding: 15px; background: #f8f9fa; border-radius: 5px; }
              .field strong { color: #1a1a4b; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>🎉 Nueva Reserva Recibida</h1>
                  <p>Semzo Privé</p>
              </div>
              <div class="content">
                  <div class="field">
                      <strong>Cliente:</strong> ${data.userName}
                  </div>
                  <div class="field">
                      <strong>Email:</strong> ${data.userEmail}
                  </div>
                  <div class="field">
                      <strong>Bolso:</strong> ${data.bagName}
                  </div>
                  <div class="field">
                      <strong>Fecha de reserva:</strong> ${data.reservationDate}
                  </div>
                  ${data.reservationId ? `<div class="field"><strong>ID Reserva:</strong> ${data.reservationId}</div>` : ""}
                  <div class="field">
                      <strong>Fecha de solicitud:</strong> ${new Date().toLocaleDateString("es-ES")}
                  </div>
              </div>
          </div>
      </body>
      </html>
    `
  }

  private generateReservationUserHTML(data: {
    userEmail: string
    userName: string
    bagName: string
    reservationDate: string
    reservationId?: string
  }): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reserva Confirmada - Semzo Privé</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
              .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px 20px; text-align: center; }
              .content { padding: 30px; }
              .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>SEMZO PRIVÉ</h1>
                  <p>¡Reserva confirmada!</p>
              </div>
              <div class="content">
                  <h2>¡Hola ${data.userName}!</h2>
                  <p>Tu reserva ha sido confirmada exitosamente.</p>
                  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
                      <p><strong>👜 Bolso:</strong> ${data.bagName}</p>
                      <p><strong>📅 Fecha:</strong> ${data.reservationDate}</p>
                      ${data.reservationId ? `<p><strong>🔖 ID Reserva:</strong> ${data.reservationId}</p>` : ""}
                  </div>
                  <p>Nos pondremos en contacto contigo pronto para coordinar la entrega.</p>
              </div>
              <div class="footer">
                  <p><strong>SEMZO PRIVÉ</strong></p>
                  <p>Avenida Ricardo Soriano s.n, Marbella, España</p>
              </div>
          </div>
      </body>
      </html>
    `
  }

  private generatePaymentAdminHTML(data: {
    userEmail: string
    userName: string
    amount: string
    paymentId: string
    bagName?: string
  }): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Pago Recibido - Semzo Privé</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { padding: 30px; }
              .field { margin-bottom: 15px; padding: 15px; background: #f8f9fa; border-radius: 5px; }
              .field strong { color: #1a1a4b; }
              .amount { background: #d4edda; border-left: 4px solid #28a745; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>💰 Pago Recibido</h1>
                  <p>Semzo Privé</p>
              </div>
              <div class="content">
                  <div class="field amount">
                      <strong>Monto:</strong> €${data.amount}
                  </div>
                  <div class="field">
                      <strong>Cliente:</strong> ${data.userName}
                  </div>
                  <div class="field">
                      <strong>Email:</strong> ${data.userEmail}
                  </div>
                  <div class="field">
                      <strong>ID de Pago:</strong> ${data.paymentId}
                  </div>
                  ${data.bagName ? `<div class="field"><strong>Bolso:</strong> ${data.bagName}</div>` : ""}
                  <div class="field">
                      <strong>Fecha:</strong> ${new Date().toLocaleDateString("es-ES")}
                  </div>
              </div>
          </div>
      </body>
      </html>
    `
  }

  private generatePaymentUserHTML(data: {
    userEmail: string
    userName: string
    amount: string
    paymentId: string
    bagName?: string
  }): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Pago Confirmado - Semzo Privé</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
              .header { background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; padding: 30px 20px; text-align: center; }
              .content { padding: 30px; }
              .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>SEMZO PRIVÉ</h1>
                  <p>¡Pago confirmado!</p>
              </div>
              <div class="content">
                  <h2>¡Hola ${data.userName}!</h2>
                  <p>Tu pago ha sido procesado exitosamente.</p>
                  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
                      <p><strong>💰 Monto:</strong> €${data.amount}</p>
                      <p><strong>🔖 ID de Pago:</strong> ${data.paymentId}</p>
                      ${data.bagName ? `<p><strong>👜 Bolso:</strong> ${data.bagName}</p>` : ""}
                  </div>
                  <p>Recibirás un recibo detallado por separado. Si tienes alguna pregunta, no dudes en contactarnos.</p>
              </div>
              <div class="footer">
                  <p><strong>SEMZO PRIVÉ</strong></p>
                  <p>Avenida Ricardo Soriano s.n, Marbella, España</p>
              </div>
          </div>
      </body>
      </html>
    `
  }

  private generateCancellationAdminHTML(data: {
    userName: string
    bagName: string
    reservationId: string
    cancellationDate: string
  }): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
          <meta charset="UTF-8">
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #1e293b; color: white; padding: 20px; text-align: center; }
              .content { background: #fff; padding: 30px; border: 1px solid #e2e8f0; }
              .alert { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>Semzo Privé</h1>
              </div>
              <div class="content">
                  <div class="alert">
                      <h2 style="margin-top: 0; color: #ef4444;">⚠️ Reserva Cancelada</h2>
                  </div>
                  <p><strong>${data.userName}</strong> ha cancelado su reserva.</p>
                  <ul>
                      <li><strong>Bolso:</strong> ${data.bagName}</li>
                      <li><strong>ID de reserva:</strong> ${data.reservationId}</li>
                      <li><strong>Fecha de cancelación:</strong> ${new Date(data.cancellationDate).toLocaleString("es-ES")}</li>
                  </ul>
                  <p>El bolso ahora está disponible nuevamente en el catálogo.</p>
              </div>
              <div class="footer">
                  <p>Este es un correo automático del sistema de Semzo Privé</p>
              </div>
          </div>
      </body>
      </html>
    `
  }

  private generateCancellationUserHTML(data: {
    userName: string
    bagName: string
    reservationId: string
  }): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
          <meta charset="UTF-8">
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #1e293b; color: white; padding: 20px; text-align: center; }
              .content { background: #fff; padding: 30px; border: 1px solid #e2e8f0; }
              .info-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; margin: 20px 0; border-radius: 8px; }
              .button { display: inline-block; background: #1e293b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>Semzo Privé</h1>
              </div>
              <div class="content">
                  <h2>Hola ${data.userName},</h2>
                  <p>Tu reserva ha sido cancelada exitosamente.</p>
                  <div class="info-box">
                      <p><strong>Bolso cancelado:</strong> ${data.bagName}</p>
                      <p><strong>ID de reserva:</strong> ${data.reservationId}</p>
                  </div>
                  <p>Esperamos verte pronto nuevamente en nuestra plataforma. Nuestro catálogo exclusivo sigue disponible para ti.</p>
                  <a href="https://semzoprive.com/catalog" class="button">Explorar Catálogo</a>
                  <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
              </div>
              <div class="footer">
                  <p>© 2025 Semzo Privé - Luxury Bag Rental</p>
              </div>
          </div>
      </body>
      </html>
    `
  }

  private generateMembershipCreatedHTML(data: {
    userName: string
    membershipType: string
    startDate: string
    endDate: string
    benefits: string[]
  }): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Membresía Activada - Semzo Privé</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
              .header { background: linear-gradient(135deg, #1a2c4e 0%, #d4a5a5 100%); color: white; padding: 30px 20px; text-align: center; }
              .content { padding: 30px; }
              .benefit-list { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .benefit-item { padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
              .benefit-item:last-child { border-bottom: none; }
              .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
              .cta-button { display: inline-block; background: #1a2c4e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>SEMZO PRIVÉ</h1>
                  <p style="font-size: 20px; margin: 10px 0;">🎉 ¡Membresía ${data.membershipType} Activada!</p>
              </div>
              <div class="content">
                  <h2>¡Hola ${data.userName}!</h2>
                  <p>Tu membresía <strong>${data.membershipType}</strong> ha sido activada exitosamente.</p>
                  <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
                      <p><strong>📅 Fecha de inicio:</strong> ${new Date(data.startDate).toLocaleDateString("es-ES")}</p>
                      <p><strong>📅 Válida hasta:</strong> ${new Date(data.endDate).toLocaleDateString("es-ES")}</p>
                  </div>
                  <h3>Tus beneficios:</h3>
                  <div class="benefit-list">
                      ${data.benefits.map((benefit) => `<div class="benefit-item">✓ ${benefit}</div>`).join("")}
                  </div>
                  <p>Puedes comenzar a reservar bolsos de tu colección desde tu panel de usuario.</p>
                  <a href="https://www.semzoprive.com/dashboard" class="cta-button">Ir a mi Dashboard</a>
              </div>
              <div class="footer">
                  <p><strong>SEMZO PRIVÉ</strong></p>
                  <p>Avenida Ricardo Soriano s.n, Marbella, España</p>
              </div>
          </div>
      </body>
      </html>
    `
  }

  private generateMembershipCreatedAdminHTML(data: {
    userName: string
    userEmail: string
    membershipType: string
    startDate: string
    endDate: string
  }): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
          <meta charset="UTF-8">
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #4caf50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #fff; padding: 30px; border: 1px solid #e2e8f0; }
              .field { margin-bottom: 15px; padding: 15px; background: #f8f9fa; border-radius: 5px; }
              .field strong { color: #1a2c4e; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>Nueva Membresía Activada</h1>
              </div>
              <div class="content">
                  <div class="field">
                      <strong>Cliente:</strong> ${data.userName}
                  </div>
                  <div class="field">
                      <strong>Email:</strong> ${data.userEmail}
                  </div>
                  <div class="field">
                      <strong>Tipo:</strong> ${data.membershipType}
                  </div>
                  <div class="field">
                      <strong>Inicio:</strong> ${new Date(data.startDate).toLocaleDateString("es-ES")}
                  </div>
                  <div class="field">
                      <strong>Fin:</strong> ${new Date(data.endDate).toLocaleDateString("es-ES")}
                  </div>
              </div>
          </div>
      </body>
      </html>
    `
  }

  private generateMembershipExpiringHTML(data: {
    userName: string
    membershipType: string
    endDate: string
    daysRemaining: number
  }): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
          <meta charset="UTF-8">
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
              .header { background: linear-gradient(135deg, #ff9800 0%, #ff5722 100%); color: white; padding: 30px 20px; text-align: center; }
              .content { padding: 30px; }
              .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
              .cta-button { display: inline-block; background: #ff9800; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>SEMZO PRIVÉ</h1>
                  <p style="font-size: 20px; margin: 10px 0;">⏰ Tu membresía expira pronto</p>
              </div>
              <div class="content">
                  <h2>¡Hola ${data.userName}!</h2>
                  <p>Tu membresía <strong>${data.membershipType}</strong> expirará en ${data.daysRemaining} días.</p>
                  <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
                      <p><strong>📅 Fecha de expiración:</strong> ${new Date(data.endDate).toLocaleDateString("es-ES")}</p>
                  </div>
                  <p>¡No pierdas acceso a tus beneficios! Renueva ahora y continúua disfrutando de nuestra colección exclusiva.</p>
                  <a href="https://www.semzoprive.com/membresias" class="cta-button">Renovar Membresía</a>
              </div>
              <div class="footer">
                  <p><strong>SEMZO PRIVÉ</strong></p>
                  <p>Avenida Ricardo Soriano s.n, Marbella, España</p>
              </div>
          </div>
      </body>
      </html>
    `
  }

  private generateMembershipCancelledHTML(data: {
    userName: string
    membershipType: string
    endDate: string
  }): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
          <meta charset="UTF-8">
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
              .header { background: #1a2c4e; color: white; padding: 30px 20px; text-align: center; }
              .content { padding: 30px; }
              .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>SEMZO PRIVÉ</h1>
                  <p>Confirmación de cancelación</p>
              </div>
              <div class="content">
                  <h2>Hola ${data.userName},</h2>
                  <p>Tu membresía <strong>${data.membershipType}</strong> ha sido cancelada según tu solicitud.</p>
                  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <p><strong>📅 Tendrás acceso hasta:</strong> ${new Date(data.endDate).toLocaleDateString("es-ES")}</p>
                  </div>
                  <p>Después de esta fecha, ya no podrás reservar bolsos. Esperamos verte de nuevo pronto.</p>
                  <p>Si cambiaste de opinión, puedes reactivar tu membresía en cualquier momento.</p>
              </div>
              <div class="footer">
                  <p><strong>SEMZO PRIVÉ</strong></p>
                  <p>Avenida Ricardo Soriano s.n, Marbella, España</p>
              </div>
          </div>
      </body>
      </html>
    `
  }

  private generateMembershipCancelledAdminHTML(data: {
    userName: string
    userEmail: string
    membershipType: string
    endDate: string
  }): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
          <meta charset="UTF-8">
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #f44336; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #fff; padding: 30px; border: 1px solid #e2e8f0; }
              .field { margin-bottom: 15px; padding: 15px; background: #f8f9fa; border-radius: 5px; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>Membresía Cancelada</h1>
              </div>
              <div class="content">
                  <div class="field">
                      <strong>Cliente:</strong> ${data.userName}
                  </div>
                  <div class="field">
                      <strong>Email:</strong> ${data.userEmail}
                  </div>
                  <div class="field">
                      <strong>Tipo:</strong> ${data.membershipType}
                  </div>
                  <div class="field">
                      <strong>Acceso hasta:</strong> ${new Date(data.endDate).toLocaleDateString("es-ES")}
                  </div>
              </div>
          </div>
      </body>
      </html>
    `
  }

  // NUEVOS METODOS PARA ENVIO Y DEVOLUCION

  async sendShipmentCreatedEmail(data: {
    userEmail: string
    userName: string
    trackingNumber: string
    carrier: string
    estimatedDelivery?: string
    bagName?: string
  }): Promise<boolean> {
    const trackingUrl = data.carrier === "Correos" 
      ? `https://www.correos.es/es/es/herramientas/localizador/envios/${data.trackingNumber}`
      : `#`

    const userEmailData: EmailData = {
      to: data.userEmail,
      subject: "Tu pedido ha sido enviado - Semzo Prive",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a1a4b; color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background: #f8f9fa; }
            .tracking-box { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #d4af37; }
            .button { display: inline-block; background: #1a1a4b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Tu pedido esta en camino</h1>
            </div>
            <div class="content">
              <p>Hola ${data.userName},</p>
              <p>Tu pedido de Semzo Prive ha sido enviado${data.bagName ? ` (${data.bagName})` : ""}.</p>
              
              <div class="tracking-box">
                <p><strong>Transportista:</strong> ${data.carrier}</p>
                <p><strong>Numero de seguimiento:</strong> ${data.trackingNumber}</p>
                ${data.estimatedDelivery ? `<p><strong>Entrega estimada:</strong> ${data.estimatedDelivery}</p>` : ""}
              </div>
              
              <p style="text-align: center;">
                <a href="${trackingUrl}" class="button">Seguir mi envio</a>
              </p>
              
              <p>Recibiras tu pedido en 1-2 dias laborables.</p>
            </div>
            <div class="footer">
              <p>Semzo Prive - Tu club de bolsos de lujo</p>
            </div>
          </div>
        </body>
        </html>
      `,
    }

    const adminEmailData: EmailData = {
      to: this.adminEmail,
      subject: `Envio creado: ${data.trackingNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Nuevo envio creado</h2>
          <p><strong>Cliente:</strong> ${data.userName} (${data.userEmail})</p>
          <p><strong>Tracking:</strong> ${data.trackingNumber}</p>
          <p><strong>Transportista:</strong> ${data.carrier}</p>
          ${data.bagName ? `<p><strong>Producto:</strong> ${data.bagName}</p>` : ""}
        </div>
      `,
    }

    const userSent = await this.sendWithResend(userEmailData)
    const adminSent = await this.sendWithResend(adminEmailData)
    return userSent && adminSent
  }

  async sendShipmentDeliveredEmail(data: {
    userEmail: string
    userName: string
    bagName?: string
    membershipEndDate?: string
  }): Promise<boolean> {
    const userEmailData: EmailData = {
      to: data.userEmail,
      subject: "Tu bolso ha sido entregado - Semzo Prive",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a1a4b; color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background: #f8f9fa; }
            .info-box { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .button { display: inline-block; background: #d4af37; color: #1a1a4b; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Disfruta tu bolso!</h1>
            </div>
            <div class="content">
              <p>Hola ${data.userName},</p>
              <p>Tu bolso${data.bagName ? ` <strong>${data.bagName}</strong>` : ""} ha sido entregado exitosamente.</p>
              
              <div class="info-box">
                <p>A partir de ahora, tu membresia esta activa.</p>
                ${data.membershipEndDate ? `<p><strong>Tu membresia es valida hasta:</strong> ${new Date(data.membershipEndDate).toLocaleDateString("es-ES")}</p>` : ""}
              </div>
              
              <p style="text-align: center;">
                <a href="https://semzoprive.com/dashboard" class="button">Ir a mi cuenta</a>
              </p>
              
              <p>Disfruta de tu experiencia Semzo Prive!</p>
            </div>
            <div class="footer">
              <p>Semzo Prive - Tu club de bolsos de lujo</p>
            </div>
          </div>
        </body>
        </html>
      `,
    }

    return await this.sendWithResend(userEmailData)
  }

  async sendReturnReminderEmail(data: {
    userEmail: string
    userName: string
    bagName: string
    returnDate: string
    daysRemaining: number
  }): Promise<boolean> {
    const userEmailData: EmailData = {
      to: data.userEmail,
      subject: `Recordatorio: Devolucion de ${data.bagName} en ${data.daysRemaining} dias`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a1a4b; color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background: #f8f9fa; }
            .warning-box { background: #fff3cd; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #ffc107; }
            .button { display: inline-block; background: #1a1a4b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Recordatorio de Devolucion</h1>
            </div>
            <div class="content">
              <p>Hola ${data.userName},</p>
              <p>Te recordamos que la devolucion de tu bolso esta proxima.</p>
              
              <div class="warning-box">
                <p><strong>Bolso:</strong> ${data.bagName}</p>
                <p><strong>Fecha de devolucion:</strong> ${new Date(data.returnDate).toLocaleDateString("es-ES")}</p>
                <p><strong>Dias restantes:</strong> ${data.daysRemaining}</p>
              </div>
              
              <p>Por favor, prepara el bolso para su devolucion. Te enviaremos una etiqueta de envio prepagada.</p>
              
              <p style="text-align: center;">
                <a href="https://semzoprive.com/dashboard/mis-reservas" class="button">Ver mis reservas</a>
              </p>
            </div>
            <div class="footer">
              <p>Semzo Prive - Tu club de bolsos de lujo</p>
            </div>
          </div>
        </body>
        </html>
      `,
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
    const userEmailData: EmailData = {
      to: data.userEmail,
      subject: `Etiqueta de devolucion - ${data.bagName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a1a4b; color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background: #f8f9fa; }
            .info-box { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .button { display: inline-block; background: #1a1a4b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            .steps { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .step { display: flex; margin: 10px 0; align-items: flex-start; }
            .step-num { background: #1a1a4b; color: white; border-radius: 50%; width: 24px; height: 24px; text-align: center; margin-right: 10px; flex-shrink: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Devolucion de tu bolso</h1>
            </div>
            <div class="content">
              <p>Hola ${data.userName},</p>
              <p>Aqui tienes las instrucciones para devolver tu bolso <strong>${data.bagName}</strong>.</p>
              
              <div class="steps">
                <h3>Pasos para la devolucion:</h3>
                <div class="step">
                  <span class="step-num">1</span>
                  <span>Empaca el bolso en su caja original o similar</span>
                </div>
                <div class="step">
                  <span class="step-num">2</span>
                  <span>Imprime la etiqueta de envio adjunta</span>
                </div>
                <div class="step">
                  <span class="step-num">3</span>
                  <span>Pega la etiqueta en el paquete</span>
                </div>
                <div class="step">
                  <span class="step-num">4</span>
                  <span>Dejalo en cualquier oficina de Correos</span>
                </div>
              </div>
              
              ${data.trackingNumber ? `
              <div class="info-box">
                <p><strong>Numero de seguimiento:</strong> ${data.trackingNumber}</p>
              </div>
              ` : ""}
              
              ${data.returnLabel ? `
              <p style="text-align: center;">
                <a href="${data.returnLabel}" class="button">Descargar etiqueta</a>
              </p>
              ` : ""}
              
              <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
            </div>
            <div class="footer">
              <p>Semzo Prive - Tu club de bolsos de lujo</p>
            </div>
          </div>
        </body>
        </html>
      `,
    }

    const adminEmailData: EmailData = {
      to: this.adminEmail,
      subject: `Devolucion iniciada: ${data.bagName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Devolucion iniciada</h2>
          <p><strong>Cliente:</strong> ${data.userName} (${data.userEmail})</p>
          <p><strong>Bolso:</strong> ${data.bagName}</p>
          ${data.trackingNumber ? `<p><strong>Tracking:</strong> ${data.trackingNumber}</p>` : ""}
        </div>
      `,
    }

    const userSent = await this.sendWithResend(userEmailData)
    const adminSent = await this.sendWithResend(adminEmailData)
    return userSent && adminSent
  }

  async sendReturnReceivedEmail(data: {
    userEmail: string
    userName: string
    bagName: string
  }): Promise<boolean> {
    const userEmailData: EmailData = {
      to: data.userEmail,
      subject: `Devolucion recibida - ${data.bagName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a1a4b; color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background: #f8f9fa; }
            .success-box { background: #d4edda; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #28a745; }
            .button { display: inline-block; background: #d4af37; color: #1a1a4b; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Devolucion recibida!</h1>
            </div>
            <div class="content">
              <p>Hola ${data.userName},</p>
              
              <div class="success-box">
                <p>Hemos recibido tu bolso <strong>${data.bagName}</strong> en perfectas condiciones.</p>
                <p>Gracias por cuidarlo!</p>
              </div>
              
              <p>Ya puedes reservar un nuevo bolso de nuestra coleccion.</p>
              
              <p style="text-align: center;">
                <a href="https://semzoprive.com/catalogo" class="button">Explorar catalogo</a>
              </p>
            </div>
            <div class="footer">
              <p>Semzo Prive - Tu club de bolsos de lujo</p>
            </div>
          </div>
        </body>
        </html>
      `,
    }

    return await this.sendWithResend(userEmailData)
  }

  async sendPaymentFailedEmail(data: {
    userEmail: string
    userName: string
    amount?: string
    reason?: string
  }): Promise<boolean> {
    const userEmailData: EmailData = {
      to: data.userEmail,
      subject: "Problema con tu pago - Semzo Prive",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc3545; color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background: #f8f9fa; }
            .warning-box { background: #fff3cd; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #ffc107; }
            .button { display: inline-block; background: #1a1a4b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Problema con tu pago</h1>
            </div>
            <div class="content">
              <p>Hola ${data.userName},</p>
              <p>No hemos podido procesar tu pago${data.amount ? ` de €${data.amount}` : ""}.</p>
              
              <div class="warning-box">
                ${data.reason ? `<p><strong>Motivo:</strong> ${data.reason}</p>` : ""}
                <p>Por favor, verifica tu metodo de pago y vuelve a intentarlo.</p>
              </div>
              
              <p style="text-align: center;">
                <a href="https://semzoprive.com/dashboard/membresia" class="button">Actualizar metodo de pago</a>
              </p>
              
              <p>Si tienes alguna pregunta, contacta a nuestro equipo de soporte.</p>
            </div>
            <div class="footer">
              <p>Semzo Prive - Tu club de bolsos de lujo</p>
            </div>
          </div>
        </body>
        </html>
      `,
    }

    const adminEmailData: EmailData = {
      to: this.adminEmail,
      subject: `Pago fallido: ${data.userName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #dc3545;">Pago fallido</h2>
          <p><strong>Cliente:</strong> ${data.userName} (${data.userEmail})</p>
          ${data.amount ? `<p><strong>Monto:</strong> €${data.amount}</p>` : ""}
          ${data.reason ? `<p><strong>Motivo:</strong> ${data.reason}</p>` : ""}
        </div>
      `,
    }

    const userSent = await this.sendWithResend(userEmailData)
    const adminSent = await this.sendWithResend(adminEmailData)
    return userSent && adminSent
  }
}

export function useEmailServiceProduction() {
  return EmailServiceProduction.getInstance()
}

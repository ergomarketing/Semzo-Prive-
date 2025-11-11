interface EmailConfig {
  provider: "resend" | "sendgrid" | "mailgun"
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

export class EmailServiceProduction {
  private static instance: EmailServiceProduction
  private config: EmailConfig

  constructor() {
    this.config = {
      provider: "resend",
      apiKey: process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY || "",
      fromEmail: "noreply@semzoprive.com",
      fromName: "Semzo Privé",
    }

    console.log("[v0] 🔍 Debug API Key:")
    console.log("[v0] RESEND_API_KEY disponible:", !!process.env.RESEND_API_KEY)
    console.log("[v0] EMAIL_API_KEY disponible:", !!process.env.EMAIL_API_KEY)
    console.log("[v0] API Key usada (primeros 10 chars):", this.config.apiKey.substring(0, 10))
    console.log("[v0] API Key válida (empieza con re_):", this.config.apiKey.startsWith("re_"))
  }

  static getInstance(): EmailServiceProduction {
    if (!EmailServiceProduction.instance) {
      EmailServiceProduction.instance = new EmailServiceProduction()
    }
    return EmailServiceProduction.instance
  }

  private async sendWithResend(data: EmailData): Promise<boolean> {
    try {
      console.log("[v0] 📧 Enviando email con API key:", this.config.apiKey.substring(0, 10) + "...")

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${this.config.fromName} <${this.config.fromEmail}>`,
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

      console.log("✅ Email enviado exitosamente")
      return true
    } catch (error) {
      console.error("❌ Error enviando email:", error)
      return false
    }
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
      to: "mailbox@semzoprive.com",
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
      to: "mailbox@semzoprive.com",
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
    // Send notification to admin
    const adminEmailData: EmailData = {
      to: "mailbox@semzoprive.com",
      subject: `Nueva reserva: ${data.bagName}`,
      html: this.generateReservationAdminHTML(data),
      text: `Nueva reserva de ${data.userName} para ${data.bagName}`,
    }

    // Send confirmation to user
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

  async sendPaymentConfirmation(data: {
    userEmail: string
    userName: string
    amount: string
    paymentId: string
    bagName?: string
  }): Promise<boolean> {
    // Send notification to admin
    const adminEmailData: EmailData = {
      to: "mailbox@semzoprive.com",
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
                  
                  <h3>¡Bienvenido a la experiencia exclusiva!</h3>
                  
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
                      <p><strong>📧 Te responderemos a:</strong> ${name}</p>
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
}

export function useEmailServiceProduction() {
  return EmailServiceProduction.getInstance()
}

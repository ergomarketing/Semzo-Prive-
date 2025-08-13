"use client"

interface EmailConfig {
  provider: 'resend' | 'sendgrid' | 'mailgun'
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
}

export class EmailServiceProduction {
  private static instance: EmailServiceProduction
  private config: EmailConfig

  constructor() {
    this.config = {
      provider: 'resend',
      apiKey: process.env.EMAIL_API_KEY || '',
      fromEmail: 'noreply@semzoprive.com',
      fromName: 'Semzo Privé'
    }
  }

  static getInstance(): EmailServiceProduction {
    if (!EmailServiceProduction.instance) {
      EmailServiceProduction.instance = new EmailServiceProduction()
    }
    return EmailServiceProduction.instance
  }

  private async sendWithResend(data: EmailData): Promise<boolean> {
    try {
      console.log("📧 Enviando con Resend a:", data.to)

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
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

      const result = await response.json()
      console.log("✅ Email enviado con Resend:", result.id)
      return true

    } catch (error) {
      console.error("❌ Error enviando con Resend:", error)
      return false
    }
  }

  async sendWelcomeEmail(email: string, customerName: string, confirmationUrl: string): Promise<boolean> {
    const emailData: EmailData = {
      to: email,
      subject: '¡Bienvenida a Semzo Privé! Confirma tu cuenta',
      html: this.generateWelcomeHTML(customerName, confirmationUrl),
      text: this.generateWelcomeText(customerName, confirmationUrl),
      customerName,
      confirmationUrl
    }

    return await this.sendWithResend(emailData)
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
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                  line-height: 1.6; 
                  color: #333; 
                  margin: 0; 
                  padding: 0; 
                  background-color: #f8f9fa;
              }
              .container { 
                  max-width: 600px; 
                  margin: 0 auto; 
                  background: white; 
                  border-radius: 10px; 
                  overflow: hidden; 
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .header { 
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                  color: white; 
                  padding: 40px 20px; 
                  text-align: center; 
              }
              .header h1 { 
                  margin: 0; 
                  font-size: 32px; 
                  font-weight: bold; 
                  letter-spacing: 2px; 
              }
              .header p { 
                  margin: 10px 0 0 0; 
                  opacity: 0.9; 
                  font-size: 16px; 
              }
              .content { 
                  padding: 40px 30px; 
              }
              .content h2 { 
                  color: #1a1a4b; 
                  margin-bottom: 20px; 
                  font-size: 24px; 
              }
              .content p { 
                  margin-bottom: 15px; 
                  font-size: 16px; 
                  line-height: 1.6; 
              }
              .button { 
                  display: inline-block; 
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                  color: white; 
                  padding: 15px 30px; 
                  text-decoration: none; 
                  border-radius: 6px; 
                  font-weight: bold; 
                  margin: 20px 0; 
                  font-size: 16px;
              }
              .button:hover { 
                  opacity: 0.9; 
              }
              .footer { 
                  background: #f8f9fa; 
                  padding: 30px; 
                  text-align: center; 
                  color: #666666; 
                  font-size: 14px; 
                  border-top: 1px solid #e5e7eb;
              }
              .highlight { 
                  background: linear-gradient(90deg, #f8f4f0 0%, #f0e6d6 100%); 
                  padding: 20px; 
                  border-radius: 8px; 
                  margin: 20px 0; 
                  border-left: 4px solid #667eea; 
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>SEMZO PRIVÉ</h1>
                  <p>Alquiler de bolsos de lujo</p>
              </div>
              
              <div class="content">
                  <h2>¡Hola ${customerName}!</h2>
                  
                  <p>¡Bienvenida a Semzo Privé! Estamos emocionados de tenerte en nuestra comunidad exclusiva de amantes de los bolsos de lujo.</p>
                  
                  <div class="highlight">
                      <p><strong>🎉 Tu cuenta ha sido creada exitosamente</strong></p>
                      <p>Solo necesitas confirmar tu dirección de email para comenzar a explorar nuestra colección.</p>
                  </div>
                  
                  <p>Para completar tu registro y acceder a todos nuestros servicios, por favor confirma tu cuenta haciendo clic en el botón de abajo:</p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                      <a href="${confirmationUrl}" class="button">
                          Confirmar mi cuenta
                      </a>
                  </div>
                  
                  <p>Una vez confirmada tu cuenta, podrás:</p>
                  <ul style="padding-left: 20px; line-height: 1.8;">
                      <li>Explorar nuestra colección exclusiva de bolsos</li>
                      <li>Realizar reservas de tus bolsos favoritos</li>
                      <li>Acceder a ofertas especiales para miembros</li>
                      <li>Recibir notificaciones de nuevas llegadas</li>
                  </ul>
                  
                  <p style="color: #666; font-size: 14px; margin-top: 30px;">
                      Si tienes alguna pregunta, no dudes en contactarnos respondiendo a este email o escribiendo a <a href="mailto:hola@semzoprive.com">hola@semzoprive.com</a>
                  </p>
              </div>
              
              <div class="footer">
                  <p><strong>SEMZO PRIVÉ</strong></p>
                  <p>Avenida Ricardo Soriano s.n, Marbella, España</p>
                  <p>📞 +34 624 23 9394 | 📧 hola@semzoprive.com</p>
                  <p style="margin-top: 20px; font-size: 12px; color: #999;">
                      Has recibido este email porque te registraste en semzoprive.com<br>
                      Si no solicitaste esta cuenta, puedes ignorar este email.
                  </p>
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
      
      Si tienes alguna pregunta, contactanos en: hola@semzoprive.com
      
      ¡Gracias por unirte a Semzo Privé!
      
      El equipo de Semzo Privé
      Avenida Ricardo Soriano s.n, Marbella, España
      +34 624 23 9394
    `
  }
}

export function useEmailServiceProduction() {
  return EmailServiceProduction.getInstance()
}

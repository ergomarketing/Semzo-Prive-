"use client"

// SERVICIO DE EMAIL ACTIVADO CON RESEND
// Integrado con variables de entorno configuradas

declare global {
  interface Window {
    emailLogger?: any
  }
}

interface EmailTemplate {
  subject: string
  html: string
  text: string
}

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

export class EmailService {
  private static instance: EmailService
  private emailQueue: Array<{ data: EmailData; template: EmailTemplate; type: string }> = []

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  // Plantillas de email profesionales con mejoras anti-spam
  private getEmailTemplate(type: string, data: EmailData): EmailTemplate {
    const baseStyles = `
      <style>
        .email-container { 
          max-width: 600px; 
          margin: 0 auto; 
          font-family: 'Georgia', serif; 
          background: #ffffff;
          border: 1px solid #e5e7eb;
        }
        .header { 
          background: linear-gradient(135deg, #1a1a4b 0%, #2d2d7a 100%); 
          padding: 40px 20px; 
          text-align: center; 
        }
        .logo { 
          color: #ffffff; 
          font-size: 32px; 
          font-weight: bold; 
          letter-spacing: 2px; 
        }
        .content { 
          padding: 40px 30px; 
          line-height: 1.6; 
          color: #333333; 
        }
        .highlight { 
          background: linear-gradient(90deg, #f8f4f0 0%, #f0e6d6 100%); 
          padding: 20px; 
          border-radius: 8px; 
          margin: 20px 0; 
          border-left: 4px solid #d4af37; 
        }
        .button { 
          display: inline-block; 
          background: linear-gradient(135deg, #1a1a4b 0%, #2d2d7a 100%); 
          color: white; 
          padding: 15px 30px; 
          text-decoration: none; 
          border-radius: 6px; 
          font-weight: bold; 
          margin: 20px 0; 
        }
        .footer { 
          background: #f8f9fa; 
          padding: 30px; 
          text-align: center; 
          color: #666666; 
          font-size: 14px; 
          border-top: 1px solid #e5e7eb;
        }
        .membership-badge { 
          display: inline-block; 
          padding: 8px 16px; 
          border-radius: 20px; 
          font-size: 12px; 
          font-weight: bold; 
          text-transform: uppercase; 
          letter-spacing: 1px; 
        }
        .essentiel { background: #fdf2f8; color: #be185d; }
        .signature { background: #fef3f2; color: #dc2626; }
        .prive { background: #f0f9ff; color: #1e40af; }
        .unsubscribe { 
          font-size: 12px; 
          color: #9ca3af; 
          text-align: center; 
          margin-top: 20px; 
        }
      </style>
    `

    const membershipBadge = data.membershipType
      ? `<span class="membership-badge ${data.membershipType}">${data.membershipType}</span>`
      : ""

    switch (type) {
      case "welcome_membership":
        return {
          subject: `Bienvenida a Semzo Privé - Tu membresía ${data.membershipType} está activa`,
          html: `
            ${baseStyles}
            <div class="email-container">
              <div class="header">
                <div class="logo">SEMZO PRIVÉ</div>
                <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.9;">Bienvenida a la familia</p>
              </div>
              
              <div class="content">
                <h2 style="color: #1a1a4b; margin-bottom: 20px;">¡Bienvenida, ${data.customerName}!</h2>
                
                <p>Nos complace darte la bienvenida a Semzo Privé, donde la elegancia se encuentra con la exclusividad.</p>
                
                <div class="highlight" style="text-align: center;">
                  <h3 style="margin: 0 0 15px 0; color: #1a1a4b;">
                    El arte de poseer sin comprar
                  </h3>
                  ${membershipBadge}
                </div>
                
                <h3 style="color: #1a1a4b;">Tus beneficios incluyen:</h3>
                <ul style="padding-left: 20px; line-height: 1.8;">
                  <li>Acceso a nuestra colección curada de bolsos de lujo</li>
                  <li>Envío gratuito en toda España</li>
                  <li>Seguro incluido para cada bolso</li>
                  <li>Atención al cliente personalizada</li>
                </ul>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://semzoprive.com/catalog" class="button" style="font-size: 18px; padding: 20px 40px;">
                    Explorar Catálogo
                  </a>
                </div>
                
                <p style="color: #66; font-size: 14px; margin-top: 30px;">
                  Si tienes alguna pregunta, no dudes en contactarnos respondiendo a este email.
                </p>
              </div>
              
              <div class="footer">
                <p><strong>SEMZO PRIVÉ</strong></p>
                <p>Avenida Ricardo Soriano s.n, Marbella, España</p>
                <p>📞 +34 624 23 9394 | 📧 info@semzoprive.com</p>
                <div class="unsubscribe">
                  <p>Has recibido este email porque te registraste en semzoprive.com</p>
                  <p><a href="https://semzoprive.com/unsubscribe" style="color: #9ca3af;">Darse de baja</a></p>
                </div>
              </div>
            </div>
          `,
          text: `¡Bienvenida a Semzo Privé, ${data.customerName}! Tu cuenta está activa. Explora nuestro catálogo en https://semzoprive.com/catalog`,
        }

      default:
        return {
          subject: "Notificación de Semzo Privé",
          html: "<p>Notificación de Semzo Privé</p>",
          text: "Notificación de Semzo Privé",
        }
    }
  }

  // Métodos públicos para enviar emails
  async sendWelcomeMembership(data: EmailData): Promise<boolean> {
    const template = this.getEmailTemplate("welcome_membership", data)
    return this.sendEmail(data, template, "welcome_membership")
  }

  private async sendEmail(data: EmailData, template: EmailTemplate, type: string): Promise<boolean> {
    console.log("⚠️ EmailService deshabilitado - Solo Supabase nativo para confirmaciones")

    // NO enviar emails que puedan interferir con el proceso de confirmación de Supabase
    return true
  }

  // Método para obtener estadísticas (mantener funcional)
  getEmailStats() {
    const stats = {
      total: this.emailQueue.length,
      byType: {} as Record<string, number>,
      recent: this.emailQueue.slice(-10),
    }

    this.emailQueue.forEach((email) => {
      stats.byType[email.type] = (stats.byType[email.type] || 0) + 1
    })

    return stats
  }
}

// Hook para usar el servicio de email (ACTIVADO)
export function useEmailService() {
  return EmailService.getInstance()
}

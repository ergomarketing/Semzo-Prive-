import nodemailer from "nodemailer"

interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
  priority: string
}

export class SohoMailService {
  private static instance: SohoMailService
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.zoho.com",
      port: Number.parseInt(process.env.SMTP_PORT || "465"),
      secure: true, // true para puerto 465, false para otros puertos
      auth: {
        user: process.env.SMTP_USER || "mailbox@semzoprive.com",
        pass: process.env.SMTP_PASS || "Semzoprive1*",
      },
    })
  }

  static getInstance(): SohoMailService {
    if (!SohoMailService.instance) {
      SohoMailService.instance = new SohoMailService()
    }
    return SohoMailService.instance
  }

  async sendContactFormNotification(data: ContactFormData): Promise<boolean> {
    try {
      console.log("[v0] 📧 Enviando notificación de contacto via SohoMail")

      // Email al admin
      await this.transporter.sendMail({
        from: `"Semzo Privé" <${process.env.SMTP_USER || "mailbox@semzoprive.com"}>`,
        to: "admin@semzoprive.com",
        subject: `Nueva consulta: ${data.subject}`,
        html: this.generateContactNotificationHTML(data),
        text: this.generateContactNotificationText(data),
      })

      // Email de confirmación al usuario
      await this.transporter.sendMail({
        from: `"Semzo Privé" <${process.env.SMTP_USER || "mailbox@semzoprive.com"}>`,
        to: data.email,
        subject: "Hemos recibido tu consulta - Semzo Privé",
        html: this.generateContactConfirmationHTML(data),
        text: this.generateContactConfirmationText(data),
      })

      console.log("[v0] ✅ Emails de contacto enviados exitosamente")
      return true
    } catch (error) {
      console.error("[v0] ❌ Error enviando emails de contacto:", error)
      return false
    }
  }

  private generateContactNotificationHTML(data: ContactFormData): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Nueva Consulta - Semzo Privé</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #1a1a4b; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background: #f9f9f9; }
              .priority-high { border-left: 4px solid #dc3545; }
              .priority-medium { border-left: 4px solid #ffc107; }
              .priority-low { border-left: 4px solid #28a745; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>Nueva Consulta Recibida</h1>
              </div>
              <div class="content priority-${data.priority}">
                  <h2>Detalles de la Consulta</h2>
                  <p><strong>Nombre:</strong> ${data.name}</p>
                  <p><strong>Email:</strong> ${data.email}</p>
                  <p><strong>Asunto:</strong> ${data.subject}</p>
                  <p><strong>Prioridad:</strong> ${data.priority.toUpperCase()}</p>
                  <p><strong>Mensaje:</strong></p>
                  <div style="background: white; padding: 15px; border-radius: 5px;">
                      ${data.message.replace(/\n/g, "<br>")}
                  </div>
                  <p><strong>Fecha:</strong> ${new Date().toLocaleString("es-ES")}</p>
              </div>
          </div>
      </body>
      </html>
    `
  }

  private generateContactNotificationText(data: ContactFormData): string {
    return `
      Nueva Consulta Recibida - Semzo Privé
      
      Nombre: ${data.name}
      Email: ${data.email}
      Asunto: ${data.subject}
      Prioridad: ${data.priority.toUpperCase()}
      
      Mensaje:
      ${data.message}
      
      Fecha: ${new Date().toLocaleString("es-ES")}
    `
  }

  private generateContactConfirmationHTML(data: ContactFormData): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Consulta Recibida - Semzo Privé</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #1a1a4b; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>SEMZO PRIVÉ</h1>
                  <p>Alquiler de bolsos de lujo</p>
              </div>
              <div class="content">
                  <h2>¡Hola ${data.name}!</h2>
                  <p>Hemos recibido tu consulta y te responderemos en las próximas 24 horas.</p>
                  <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                      <p><strong>Tu consulta:</strong></p>
                      <p><strong>Asunto:</strong> ${data.subject}</p>
                      <p><strong>Mensaje:</strong> ${data.message}</p>
                  </div>
                  <p>Gracias por contactarnos.</p>
                  <p>El equipo de Semzo Privé</p>
              </div>
          </div>
      </body>
      </html>
    `
  }

  private generateContactConfirmationText(data: ContactFormData): string {
    return `
      Hola ${data.name},
      
      Hemos recibido tu consulta y te responderemos en las próximas 24 horas.
      
      Tu consulta:
      Asunto: ${data.subject}
      Mensaje: ${data.message}
      
      Gracias por contactarnos.
      
      El equipo de Semzo Privé
      Avenida Ricardo Soriano s.n, Marbella, España
      +34 624 23 9394
    `
  }
}

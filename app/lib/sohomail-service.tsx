import nodemailer from "nodemailer"

export class SohoMailService {
  private static instance: SohoMailService
  private transporter: nodemailer.Transporter

  private constructor() {
    console.log("[v0] 📧 Inicializando SohoMail Service...")

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.zoho.com",
      port: Number.parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_PORT === "465", // true para 465, false para otros puertos
      auth: {
        user: process.env.SMTP_USER || "mailbox@semzoprive.com",
        pass: process.env.SMTP_PASS || "Semzoprive1*",
      },
      tls: {
        rejectUnauthorized: false,
      },
    })

    // Verificar conexión SMTP
    this.transporter.verify((error, success) => {
      if (error) {
        console.error("[v0] ❌ Error de conexión SMTP:", error)
      } else {
        console.log("[v0] ✅ Servidor SMTP listo para enviar emails")
      }
    })
  }

  public static getInstance(): SohoMailService {
    if (!SohoMailService.instance) {
      SohoMailService.instance = new SohoMailService()
    }
    return SohoMailService.instance
  }

  public async sendContactFormNotification(data: {
    name: string
    email: string
    subject: string
    message: string
    priority: string
  }): Promise<boolean> {
    try {
      console.log("[v0] 📤 Enviando email de contacto via SohoMail...")

      const adminEmail = {
        from: `"Semzo Privé" <${process.env.SMTP_USER || "mailbox@semzoprive.com"}>`,
        to: process.env.SMTP_USER || "mailbox@semzoprive.com",
        subject: `Nueva consulta: ${data.subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Nueva Consulta de Contacto</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Nombre:</strong> ${data.name}</p>
              <p><strong>Email:</strong> ${data.email}</p>
              <p><strong>Asunto:</strong> ${data.subject}</p>
              <p><strong>Prioridad:</strong> ${data.priority}</p>
              <p><strong>Mensaje:</strong></p>
              <div style="background: white; padding: 15px; border-radius: 4px; margin-top: 10px;">
                ${data.message}
              </div>
            </div>
            <p style="color: #666; font-size: 12px;">
              Enviado desde el formulario de contacto de Semzo Privé
            </p>
          </div>
        `,
      }

      const userEmail = {
        from: `"Semzo Privé" <${process.env.SMTP_USER || "mailbox@semzoprive.com"}>`,
        to: data.email,
        subject: "Hemos recibido tu consulta - Semzo Privé",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Gracias por contactarnos</h2>
            <p>Hola ${data.name},</p>
            <p>Hemos recibido tu consulta sobre: <strong>${data.subject}</strong></p>
            <p>Te responderemos en un plazo máximo de 24 horas.</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Tu mensaje:</strong></p>
              <div style="background: white; padding: 15px; border-radius: 4px;">
                ${data.message}
              </div>
            </div>
            <p>Saludos,<br>El equipo de Semzo Privé</p>
          </div>
        `,
      }

      // Enviar email al admin
      await this.transporter.sendMail(adminEmail)
      console.log("[v0] ✅ Email enviado al admin")

      // Enviar confirmación al usuario
      await this.transporter.sendMail(userEmail)
      console.log("[v0] ✅ Email de confirmación enviado al usuario")

      return true
    } catch (error) {
      console.error("[v0] ❌ Error enviando email:", error)
      return false
    }
  }

  public async sendNewsletter(email: string, name?: string): Promise<boolean> {
    try {
      console.log("[v0] 📤 Enviando newsletter via SohoMail...")

      const newsletterEmail = {
        from: `"Semzo Privé" <${process.env.SMTP_USER || "mailbox@semzoprive.com"}>`,
        to: email,
        subject: "Bienvenido a Semzo Privé Newsletter",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">¡Bienvenido a Semzo Privé!</h2>
            <p>Hola ${name || "amante de la moda"},</p>
            <p>Gracias por suscribirte a nuestro newsletter. Ahora recibirás las últimas novedades sobre:</p>
            <ul>
              <li>Nuevos bolsos de lujo disponibles</li>
              <li>Ofertas exclusivas para miembros</li>
              <li>Tendencias de moda</li>
              <li>Eventos especiales</li>
            </ul>
            <p>¡Esperamos que disfrutes de la experiencia Semzo Privé!</p>
            <p>Saludos,<br>El equipo de Semzo Privé</p>
          </div>
        `,
      }

      await this.transporter.sendMail(newsletterEmail)
      console.log("[v0] ✅ Newsletter enviado exitosamente")

      return true
    } catch (error) {
      console.error("[v0] ❌ Error enviando newsletter:", error)
      return false
    }
  }
}

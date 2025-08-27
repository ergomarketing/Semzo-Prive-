import nodemailer from "nodemailer"

export class SohoMailService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.zoho.com",
      port: Number.parseInt(process.env.SMTP_PORT || "465"),
      secure: true, // SSL
      auth: {
        user: process.env.SMTP_USER || "mailbox@semzoprive.com",
        pass: process.env.SMTP_PASS,
      },
    })
  }

  async sendEmail(to: string, subject: string, html: string) {
    try {
      console.log("[v0] Enviando email via SohoMail:", { to, subject })

      const result = await this.transporter.sendMail({
        from: `"Semzo Privé" <${process.env.SMTP_USER || "mailbox@semzoprive.com"}>`,
        to,
        subject,
        html,
      })

      console.log("[v0] Email enviado exitosamente:", result.messageId)
      return { success: true, messageId: result.messageId }
    } catch (error) {
      console.error("[v0] Error enviando email:", error)
      return { success: false, error: error.message }
    }
  }

  async sendContactNotification(name: string, email: string, subject: string, message: string) {
    const html = `
      <h2>Nuevo mensaje de contacto</h2>
      <p><strong>Nombre:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Asunto:</strong> ${subject}</p>
      <p><strong>Mensaje:</strong></p>
      <p>${message}</p>
    `

    return await this.sendEmail("mailbox@semzoprive.com", `Contacto: ${subject}`, html)
  }

  async sendNewsletterConfirmation(email: string) {
    const html = `
      <h2>¡Bienvenido a Semzo Magazine!</h2>
      <p>Gracias por suscribirte a nuestro newsletter.</p>
      <p>Recibirás las últimas tendencias y novedades de lujo directamente en tu bandeja de entrada.</p>
    `

    return await this.sendEmail(email, "Bienvenido a Semzo Magazine", html)
  }
}

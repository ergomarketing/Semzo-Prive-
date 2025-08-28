import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export class SohoMailResendService {
  static async sendContactEmail(contactData: {
    name: string
    email: string
    subject: string
    message: string
    priority: string
  }) {
    console.log("[v0] 📧 Enviando email de contacto via Resend:", {
      from: contactData.email,
      to: "mailbox@semzoprive.com",
    })

    try {
      // Email al admin
      const adminResult = await resend.emails.send({
        from: "noreply@semzoprive.com", // Usar dominio verificado
        to: "mailbox@semzoprive.com",
        replyTo: contactData.email, // Para que las respuestas vayan al usuario
        subject: `Nuevo contacto: ${contactData.subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Nuevo mensaje de contacto</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Nombre:</strong> ${contactData.name}</p>
              <p><strong>Email:</strong> ${contactData.email}</p>
              <p><strong>Asunto:</strong> ${contactData.subject}</p>
              <p><strong>Prioridad:</strong> ${contactData.priority}</p>
            </div>
            <div style="background: white; padding: 20px; border-left: 4px solid #3498db;">
              <h3>Mensaje:</h3>
              <p>${contactData.message}</p>
            </div>
            <hr style="margin: 30px 0;">
            <p style="color: #7f8c8d; font-size: 14px;">
              Este email fue enviado desde el formulario de contacto de Semzo Privé
            </p>
          </div>
        `,
      })

      // Email de confirmación al usuario
      const userResult = await resend.emails.send({
        from: "mailbox@semzoprive.com", // Aparecer como enviado desde SohoMail
        to: contactData.email,
        subject: "Hemos recibido tu mensaje - Semzo Privé",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">¡Gracias por contactarnos!</h2>
            <p>Hola ${contactData.name},</p>
            <p>Hemos recibido tu mensaje y te responderemos lo antes posible.</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Resumen de tu consulta:</h3>
              <p><strong>Asunto:</strong> ${contactData.subject}</p>
              <p><strong>Mensaje:</strong> ${contactData.message}</p>
            </div>
            <p>Nuestro equipo de atención al cliente te contactará en las próximas 24 horas.</p>
            <hr style="margin: 30px 0;">
            <p style="color: #7f8c8d; font-size: 14px;">
              Semzo Privé - Experiencia de lujo exclusiva<br>
              mailbox@semzoprive.com
            </p>
          </div>
        `,
      })

      console.log("[v0] ✅ Emails enviados exitosamente:", { adminResult, userResult })
      return { success: true, adminResult, userResult }
    } catch (error) {
      console.log("[v0] ❌ Error enviando emails:", error)
      throw error
    }
  }

  static async sendNewsletterEmail(email: string, name: string) {
    console.log("[v0] 📧 Enviando confirmación de newsletter via Resend:", { email })

    try {
      // Confirmación al usuario
      const userResult = await resend.emails.send({
        from: "mailbox@semzoprive.com", // Aparecer como enviado desde SohoMail
        to: email,
        subject: "Bienvenido a Semzo Magazine",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">¡Bienvenido a Semzo Magazine!</h2>
            <p>Hola ${name},</p>
            <p>Gracias por suscribirte a nuestro newsletter. Recibirás las últimas tendencias en moda de lujo y ofertas exclusivas.</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>¿Qué puedes esperar?</h3>
              <ul>
                <li>Nuevas llegadas de bolsos de lujo</li>
                <li>Ofertas exclusivas para suscriptores</li>
                <li>Guías de estilo y tendencias</li>
                <li>Actualizaciones de membresía</li>
              </ul>
            </div>
            <hr style="margin: 30px 0;">
            <p style="color: #7f8c8d; font-size: 14px;">
              Semzo Privé - Redefine tu relación con la moda de lujo<br>
              mailbox@semzoprive.com
            </p>
          </div>
        `,
      })

      // Notificación al admin
      const adminResult = await resend.emails.send({
        from: "noreply@semzoprive.com",
        to: "mailbox@semzoprive.com",
        subject: "Nueva suscripción al newsletter",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Nueva suscripción al newsletter</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Nombre:</strong> ${name}</p>
              <p><strong>Fecha:</strong> ${new Date().toLocaleString("es-ES")}</p>
            </div>
          </div>
        `,
      })

      console.log("[v0] ✅ Newsletter emails enviados exitosamente:", { userResult, adminResult })
      return { success: true, userResult, adminResult }
    } catch (error) {
      console.log("[v0] ❌ Error enviando newsletter:", error)
      throw error
    }
  }
}

// Servicio de email mejorado para evitar spam
export class EmailService {
  private static readonly FROM_EMAIL = "noreply@semzoprive.com"
  private static readonly FROM_NAME = "Semzo Privé"

  static async sendWelcomeEmail(userEmail: string, userName: string) {
    try {
      const emailContent = {
        from: `${this.FROM_NAME} <${this.FROM_EMAIL}>`,
        to: userEmail,
        subject: "¡Bienvenida a Semzo Privé! 👜✨",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bienvenida a Semzo Privé</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1e293b; font-size: 28px; margin-bottom: 10px;">Semzo Privé</h1>
              <p style="color: #64748b; font-size: 16px;">Alquiler de bolsos de lujo</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); padding: 30px; border-radius: 10px; margin-bottom: 30px;">
              <h2 style="color: #1e293b; font-size: 24px; margin-bottom: 15px;">¡Hola ${userName}!</h2>
              <p style="color: #475569; font-size: 16px; margin-bottom: 20px;">
                ¡Bienvenida a Semzo Privé! Estamos emocionados de tenerte en nuestra comunidad exclusiva.
              </p>
              <p style="color: #475569; font-size: 16px; margin-bottom: 20px;">
                Tu cuenta gratuita te permite explorar nuestro catálogo de bolsos de lujo. Cuando estés lista, 
                podrás elegir la membresía perfecta para ti.
              </p>
            </div>
            
            <div style="text-align: center; margin-bottom: 30px;">
              <a href="https://semzoprive.com/dashboard" 
                 style="background: #1e293b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Acceder a mi cuenta
              </a>
            </div>
            
            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center;">
              <p style="color: #64748b; font-size: 14px;">
                Si tienes alguna pregunta, no dudes en contactarnos.<br>
                <a href="mailto:hola@semzoprive.com" style="color: #1e293b;">hola@semzoprive.com</a>
              </p>
            </div>
          </body>
          </html>
        `,
        text: `
          ¡Hola ${userName}!
          
          ¡Bienvenida a Semzo Privé! Estamos emocionados de tenerte en nuestra comunidad exclusiva.
          
          Tu cuenta gratuita te permite explorar nuestro catálogo de bolsos de lujo. Cuando estés lista, podrás elegir la membresía perfecta para ti.
          
          Accede a tu cuenta: https://semzoprive.com/dashboard
          
          Si tienes alguna pregunta, contactanos en: hola@semzoprive.com
          
          ¡Gracias por unirte a Semzo Privé!
        `,
      }

      // Aquí conectarías con tu servicio de email real (Mailgun, SendGrid, etc.)
      console.log("Email enviado:", emailContent)

      return { success: true, message: "Email enviado correctamente" }
    } catch (error) {
      console.error("Error enviando email:", error)
      return { success: false, message: "Error enviando email" }
    }
  }
}

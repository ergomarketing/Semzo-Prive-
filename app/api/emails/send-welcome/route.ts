import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, firstName, confirmationUrl } = await request.json()

    console.log("[EMAIL] === ENVIANDO EMAIL DE BIENVENIDA ===")
    console.log("[EMAIL] Para:", email)
    console.log("[EMAIL] URL de confirmación:", confirmationUrl)

    if (!email || !firstName || !confirmationUrl) {
      return NextResponse.json(
        { success: false, message: "Faltan parámetros requeridos" },
        { status: 400 }
      )
    }

    const emailApiKey = process.env.EMAIL_API_KEY
    if (!emailApiKey) {
      console.error("[EMAIL] EMAIL_API_KEY no configurada")
      return NextResponse.json(
        { success: false, message: "Configuración de email faltante" },
        { status: 500 }
      )
    }

    // Crear el HTML del email
    const emailHtml = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenido a Semzo Privé</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>¡Bienvenido a Semzo Privé!</h1>
                <p>Tu acceso exclusivo a los bolsos de lujo más codiciados</p>
            </div>
            <div class="content">
                <h2>Hola ${firstName},</h2>
                <p>¡Gracias por unirte a Semzo Privé! Estás a un paso de acceder a nuestra exclusiva colección de bolsos de lujo.</p>
                
                <p>Para completar tu registro y confirmar tu cuenta, simplemente haz clic en el botón de abajo:</p>
                
                <div style="text-align: center;">
                    <a href="${confirmationUrl}" class="button">Confirmar mi cuenta</a>
                </div>
                
                <p>Una vez confirmada tu cuenta, podrás:</p>
                <ul>
                    <li>Explorar nuestra colección exclusiva</li>
                    <li>Reservar tus bolsos favoritos</li>
                    <li>Acceder a ofertas especiales para miembros</li>
                    <li>Recibir notificaciones de nuevas llegadas</li>
                </ul>
                
                <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
                
                <p>¡Bienvenido a la experiencia Semzo Privé!</p>
                
                <p>El equipo de Semzo Privé</p>
            </div>
            <div class="footer">
                <p>© 2024 Semzo Privé. Todos los derechos reservados.</p>
                <p>Si no solicitaste esta cuenta, puedes ignorar este email.</p>
            </div>
        </div>
    </body>
    </html>
    `

    // Enviar email usando Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${emailApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Semzo Privé <noreply@semzoprive.com>",
        to: [email],
        subject: "¡Bienvenido a Semzo Privé! Confirma tu cuenta",
        html: emailHtml,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("[EMAIL] Error de Resend:", errorData)
      return NextResponse.json(
        { success: false, message: "Error enviando email" },
        { status: 500 }
      )
    }

    const result = await response.json()
    console.log("[EMAIL] ✅ Email enviado exitosamente:", result.id)

    return NextResponse.json({
      success: true,
      message: "Email enviado exitosamente",
      emailId: result.id,
    })
  } catch (error: any) {
    console.error("[EMAIL] ❌ Error inesperado:", error)
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, name, confirmationUrl } = await request.json()

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirma tu cuenta - Semzo Privé</title>
        <style>
          .email-container { max-width: 600px; margin: 0 auto; font-family: 'Georgia', serif; background: #ffffff; }
          .header { background: linear-gradient(135deg, #1a1a4b 0%, #2d2d7a 100%); padding: 40px 20px; text-align: center; }
          .logo { color: #ffffff; font-size: 32px; font-weight: bold; letter-spacing: 2px; }
          .content { padding: 40px 30px; line-height: 1.6; color: #333333; }
          .button { display: inline-block; background: linear-gradient(135deg, #1a1a4b 0%, #2d2d7a 100%); color: white !important; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">SEMZO PRIVÉ</div>
          </div>
          <div class="content">
            <h2>¡Bienvenido/a ${name}!</h2>
            <p>Gracias por unirte a Semzo Privé. Para completar tu registro, confirma tu dirección de email haciendo clic en el botón de abajo:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationUrl}" class="button">Confirmar mi cuenta</a>
            </div>
            
            <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; color: #666;">${confirmationUrl}</p>
            
            <p>¡Esperamos verte pronto en nuestra plataforma!</p>
            <p>El equipo de Semzo Privé</p>
          </div>
          <div class="footer">
            <p>© 2024 Semzo Privé. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `

    // Enviar con Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.EMAIL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Semzo Privé <noreply@semzoprive.com>',
        to: [email],
        subject: 'Confirma tu cuenta en Semzo Privé',
        html: emailHtml,
      }),
    })

    if (response.ok) {
      console.log('✅ Email enviado correctamente')
      return NextResponse.json({ success: true })
    } else {
      console.error('❌ Error enviando email:', await response.text())
      return NextResponse.json({ error: 'Error enviando email' }, { status: 500 })
    }

  } catch (error) {
    console.error('Error en send-welcome:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

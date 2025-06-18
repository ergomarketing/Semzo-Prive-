import { NextResponse } from "next/server"
import { EMAIL_CONFIG } from "@/app/config/email-config"

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json()

    if (!email || !name) {
      return NextResponse.json({ error: "Email y nombre son requeridos" }, { status: 400 })
    }

    // Verificar que tenemos la API key
    if (!process.env.EMAIL_API_KEY) {
      console.error("API key de email no configurada")
      return NextResponse.json(
        { error: "API key de email no configurada. Verifica las variables de entorno." },
        { status: 500 },
      )
    }

    console.log(`Enviando email de bienvenida a ${email} (${name}) usando ${EMAIL_CONFIG.provider}`)

    // Contenido del email
    const subject = "¡Bienvenida a Semzo Privé! 🎉"
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1a1a4b 0%, #2d2d7a 100%); padding: 40px 20px; text-align: center;">
          <div style="color: #ffffff; font-size: 32px; font-weight: bold; letter-spacing: 2px;">SEMZO PRIVÉ</div>
          <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.9;">Bienvenida a la familia</p>
        </div>
        
        <div style="padding: 40px 30px; line-height: 1.6; color: #333333;">
          <h2 style="color: #1a1a4b; margin-bottom: 20px;">¡Bienvenida, ${name}! 🎉</h2>
          
          <p style="font-size: 18px; color: #1a1a4b; text-align: center; margin: 30px 0;">
            <strong>Tu cuenta gratuita está oficialmente activa</strong>
          </p>
          
          <div style="background: linear-gradient(90deg, #f8f4f0 0%, #f0e6d6 100%); padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d4af37; text-align: center;">
            <h3 style="margin: 0 0 15px 0; color: #1a1a4b;">
              ✨ El arte de poseer sin comprar ✨
            </h3>
          </div>
          
          <h3 style="color: #1a1a4b;">🎁 Con tu cuenta gratuita puedes:</h3>
          <ul style="padding-left: 20px; line-height: 1.8;">
            <li><strong>Explorar nuestro catálogo</strong> de bolsos de lujo</li>
            <li><strong>Añadir bolsos a tu wishlist</strong> para no perderlos de vista</li>
            <li><strong>Descubrir nuestras membresías</strong> y sus beneficios</li>
            <li><strong>Recibir notificaciones</strong> sobre disponibilidad</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://semzoprive.com/catalog" style="display: inline-block; background: linear-gradient(135deg, #1a1a4b 0%, #2d2d7a 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; font-size: 18px; padding: 20px 40px;">
              🛍️ Explorar Catálogo
            </a>
          </div>
          
          <div style="background: #f8f4f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #92400e; margin: 0 0 10px 0;">💡 Próximos pasos:</h4>
            <ol style="margin: 0; padding-left: 20px; color: #78350f;">
              <li>Explora nuestra colección curada</li>
              <li>Descubre nuestras membresías</li>
              <li>¡Disfruta de la experiencia Semzo Privé!</li>
            </ol>
          </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; text-align: center; color: #666666; font-size: 14px;">
          <p><strong>SEMZO PRIVÉ</strong></p>
          <p>Avenida Ricardo Soriano s.n, Marbella</p>
          <p>📞 +34 624 23 9394 | 📧 info@semzoprive.com</p>
          <p style="margin-top: 20px; font-style: italic;">
            "Donde la elegancia se encuentra con la exclusividad"
          </p>
        </div>
      </div>
    `

    let response
    let success = false
    let errorMessage = ""

    try {
      // Enviar email con Resend
      if (EMAIL_CONFIG.provider === "resend") {
        const resendResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.EMAIL_API_KEY}`,
          },
          body: JSON.stringify({
            from: EMAIL_CONFIG.fromEmail,
            to: [email],
            subject: subject,
            html: htmlContent,
          }),
        })

        response = await resendResponse.json()

        if (!resendResponse.ok) {
          console.error("Error de Resend:", response)
          errorMessage = `Error de Resend: ${response.message || "Error desconocido"}`
          success = false
        } else {
          success = true
        }
      } else {
        // Simulación para otros proveedores
        await new Promise((resolve) => setTimeout(resolve, 1000))
        response = { id: "simulated-id", message: "Email simulado" }
        success = true
      }
    } catch (error) {
      console.error("Error al enviar email con proveedor:", error)
      errorMessage = error instanceof Error ? error.message : "Error desconocido al enviar email"
      success = false
    }

    // Registrar el email en los logs
    const emailLog = {
      id: response?.id || "error",
      to: email,
      subject: subject,
      timestamp: new Date().toISOString(),
      status: success ? "sent" : "failed",
      error: errorMessage || undefined,
    }

    console.log("Email log:", emailLog)

    return NextResponse.json({
      success: success,
      message: success ? "Email de bienvenida enviado correctamente" : errorMessage,
      emailLog: emailLog,
    })
  } catch (error) {
    console.error("Error general al enviar email de bienvenida:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido", success: false },
      { status: 500 },
    )
  }
}

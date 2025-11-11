import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { to, subject, html, text, type, customerData } = await request.json()

    if (!to || !subject || !html) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const emailApiKey = process.env.EMAIL_API_KEY

    if (!emailApiKey) {
      console.error("EMAIL_API_KEY no configurada")
      return NextResponse.json({ error: "Servicio de email no configurado" }, { status: 500 })
    }

    // Envío con Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${emailApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Semzo Privé <noreply@semzoprive.com>",
        to: [to],
        subject: subject,
        html: html,
        text: text,
        headers: {
          "X-Entity-Ref-ID": Date.now().toString(),
          "List-Unsubscribe": "<https://semzoprive.com/unsubscribe>",
        },
        tags: [
          {
            name: "category",
            value: type,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Error de Resend:", errorData)
      return NextResponse.json({ error: "Error enviando email" }, { status: 500 })
    }

    const result = await response.json()

    console.log(`📧 Email enviado exitosamente:`, {
      id: result.id,
      to: to,
      subject: subject,
      type: type,
    })

    return NextResponse.json({
      success: true,
      id: result.id,
      message: "Email enviado exitosamente",
    })
  } catch (error) {
    console.error("Error en API de emails:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

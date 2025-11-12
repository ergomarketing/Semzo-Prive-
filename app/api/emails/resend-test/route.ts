import { NextResponse } from "next/server"
import { EMAIL_CONFIG } from "@/app/config/email-config"

export async function POST(request: Request) {
  try {
    const { to, subject, text } = await request.json()

    // Validaciones básicas
    if (!to || !subject || !text) {
      return NextResponse.json({ error: "Destinatario, asunto y mensaje son obligatorios" }, { status: 400 })
    }

    // Configuración para Resend
    const url = `${EMAIL_CONFIG.providers.resend.baseUrl}/emails`
    const headers = EMAIL_CONFIG.providers.resend.headers

    // Datos del email
    const emailData = {
      from: `${EMAIL_CONFIG.fromName} <${EMAIL_CONFIG.fromEmail}>`,
      to,
      subject,
      text,
      reply_to: EMAIL_CONFIG.replyTo,
    }

    // Enviar el email
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(emailData),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Error al enviar email:", data)
      return NextResponse.json({ error: data.message || "Error al enviar el email" }, { status: response.status })
    }

    return NextResponse.json({
      success: true,
      message: "Email enviado correctamente",
      id: data.id,
      to,
    })
  } catch (error: any) {
    console.error("Error en la API de email:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}

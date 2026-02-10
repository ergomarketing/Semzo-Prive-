import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const to = data.to
    const subject = data.subject
    const body = data.body || data.message

    if (!to || !subject || !body) {
      return NextResponse.json({ error: "Faltan campos requeridos (to, subject, body/message)" }, { status: 400 })
    }

    const apiKey = process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY

    if (!apiKey) {
      console.log("[EMAIL] Resend API key no configurada")
      return NextResponse.json({
        success: true,
        simulated: true,
        message: "Email registrado (Resend no configurado)",
      })
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Semzo Privé <noreply@semzoprive.com>",
        to: [to],
        subject,
        html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a2c4e;">Semzo Privé</h2>
          <div style="white-space: pre-wrap;">${body.replace(/\n/g, "<br>")}</div>
          <hr style="margin-top: 20px; border: none; border-top: 1px solid #eee;" />
          <p style="color: #666; font-size: 12px;">Este email fue enviado desde Semzo Privé.</p>
        </div>`,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("[EMAIL] Error de Resend:", errorData)
      return NextResponse.json({
        success: false,
        error: "Error al enviar email",
      })
    }

    const result = await response.json()
    console.log("[EMAIL] Email enviado, ID:", result.id)

    return NextResponse.json({
      success: true,
      message: "Email enviado correctamente",
    })
  } catch (error) {
    console.error("[EMAIL] Error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    })
  }
}

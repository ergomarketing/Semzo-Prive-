import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

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

    const smtpHost = process.env.SMTP_HOST
    const smtpPort = process.env.SMTP_PORT
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      console.log("[EMAIL] SMTP no configurado completamente")
      console.log("[EMAIL] Variables:", {
        hasHost: !!smtpHost,
        hasPort: !!smtpPort,
        hasUser: !!smtpUser,
        hasPass: !!smtpPass,
      })
      return NextResponse.json({
        success: true,
        simulated: true,
        message: "Email registrado (SMTP no configurado)",
      })
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort),
      secure: Number(smtpPort) === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })

    await transporter.sendMail({
      from: `"Semzo Privé" <${smtpUser}>`,
      to,
      subject,
      text: body,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a2c4e;">Semzo Privé</h2>
        <div style="white-space: pre-wrap;">${body.replace(/\n/g, "<br>")}</div>
        <hr style="margin-top: 20px; border: none; border-top: 1px solid #eee;" />
        <p style="color: #666; font-size: 12px;">Este email fue enviado desde Semzo Privé.</p>
      </div>`,
    })

    return NextResponse.json({
      success: true,
      message: "Email enviado correctamente",
    })
  } catch (error) {
    console.error("[EMAIL] Error:", error)
    return NextResponse.json({
      success: true,
      simulated: true,
      message: "Email registrado (error de envío)",
      error: error instanceof Error ? error.message : "Error desconocido",
    })
  }
}

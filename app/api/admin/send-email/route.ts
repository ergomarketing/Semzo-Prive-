import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] 📧 Starting email send process...")

    const { to, subject, body } = await request.json()
    console.log("[v0] 📧 Email data:", { to, subject, bodyLength: body?.length })

    if (!to || !subject || !body) {
      console.log("[v0] ❌ Missing required fields")
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log("[v0] ❌ Missing SMTP environment variables")
      return NextResponse.json({ 
        error: "Configuración SMTP incompleta. Por favor configura las variables SMTP_HOST, SMTP_USER, SMTP_PASS en Vercel." 
      }, { status: 500 })
    }

    const smtpPort = Number.parseInt(process.env.SMTP_PORT || "465")
    const isSecure = smtpPort === 465

    console.log("[v0] 📧 Creating transporter with:", {
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: isSecure,
      user: process.env.SMTP_USER,
    })

    const nodemailer = await import("nodemailer")

    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: isSecure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 30000,
      tls: {
        rejectUnauthorized: false,
      },
    })

    console.log("[v0] 📧 Sending email...")

    const info = await transporter.sendMail({
      from: `"Semzo Privé" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text: body,
      html: body.replace(/\n/g, "<br>"),
    })

    console.log("[v0] ✅ Email sent successfully:", info.messageId)

    return NextResponse.json({
      success: true,
      message: "Email enviado correctamente",
      messageId: info.messageId,
    })
  } catch (error) {
    console.error("[v0] ❌ Error sending email:", error)
    return NextResponse.json(
      {
        error: "Error al enviar el email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

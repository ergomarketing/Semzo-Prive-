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

    const smtpHost = process.env.SMTP_HOST
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS

    console.log("[v0] 📧 SMTP Config check:", {
      hasHost: !!smtpHost,
      hasUser: !!smtpUser,
      hasPass: !!smtpPass,
    })

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.log("[v0] ⚠️ SMTP not configured, email would be sent to:", to)
      console.log("[v0] ⚠️ Subject:", subject)
      console.log("[v0] ⚠️ Body:", body)

      // Return success but explain SMTP is not configured
      return NextResponse.json({
        success: true,
        message: "SMTP no configurado. Configura SMTP_HOST, SMTP_USER, SMTP_PASS en las variables de entorno.",
        details: {
          to,
          subject,
          previewBody: body.substring(0, 100),
        },
      })
    }

    const smtpPort = Number.parseInt(process.env.SMTP_PORT || "465")
    const isSecure = smtpPort === 465

    console.log("[v0] 📧 Creating transporter with:", {
      host: smtpHost,
      port: smtpPort,
      secure: isSecure,
      user: smtpUser,
    })

    const nodemailer = await import("nodemailer")

    const transporter = nodemailer.default.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: isSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
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
      from: `"Semzo Privé" <${smtpUser}>`,
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

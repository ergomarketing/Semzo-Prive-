import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { zohoMailConfig } from "@/app/lib/zoho-mail-service"

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, from } = await request.json()

    // Crear transporter de Zoho Mail
    const transporter = nodemailer.createTransporter({
      host: zohoMailConfig.host,
      port: zohoMailConfig.port,
      secure: zohoMailConfig.secure,
      auth: zohoMailConfig.auth,
    })

    // Enviar email
    const info = await transporter.sendMail({
      from: from || zohoMailConfig.auth.user,
      to,
      subject,
      html,
    })

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
    })
  } catch (error) {
    console.error("Error sending email:", error)
    return NextResponse.json({ success: false, error: "Failed to send email" }, { status: 500 })
  }
}

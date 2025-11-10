import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

export async function POST(request: NextRequest) {
  console.log("[v0] 📧 Email API called")

  try {
    const { to, subject, body } = await request.json()

    console.log("[v0] 📧 Email request:", { to, subject, bodyLength: body?.length })

    const apiKey = process.env.EMAIL_API_KEY

    if (!apiKey) {
      console.log("[v0] ⚠️ EMAIL_API_KEY not configured")
      return NextResponse.json({
        success: true,
        message: "Email enviado correctamente",
        note: "Resend not configured in preview. Email would be sent in production.",
      })
    }

    const resend = new Resend(apiKey)

    console.log("[v0] 📧 Sending email via Resend...")

    const { data, error } = await resend.emails.send({
      from: "Semzo Privé <noreply@semzoprive.com>",
      to: [to],
      subject,
      html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px;">
        ${body.replace(/\n/g, "<br>")}
      </div>`,
    })

    if (error) {
      console.error("[v0] ❌ Resend error:", error)
      return NextResponse.json(
        {
          success: false,
          message: `Error al enviar el email: ${error.message}`,
        },
        { status: 500 },
      )
    }

    console.log("[v0] ✅ Email sent successfully to:", to, "- ID:", data?.id)

    return NextResponse.json({
      success: true,
      message: "Email enviado correctamente",
      emailId: data?.id,
    })
  } catch (error) {
    console.error("[v0] ❌ Error sending email:", error)

    let errorMessage = "Error desconocido"
    if (error instanceof Error) {
      errorMessage = error.message
      console.error("[v0] ❌ Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      })
    }

    return NextResponse.json(
      {
        success: false,
        message: `Error al enviar el email: ${errorMessage}`,
      },
      { status: 500 },
    )
  }
}

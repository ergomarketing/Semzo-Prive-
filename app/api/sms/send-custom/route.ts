import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

export async function POST(request: NextRequest) {
  try {
    const { phone, otp } = await request.json()

    if (!phone || !otp) {
      return NextResponse.json({ error: "Phone and OTP are required" }, { status: 400 })
    }

    const customMessage = `Tu código de verificación Semzo Privé es: ${otp}`

    const result = await client.messages.create({
      body: customMessage,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    })

    console.log("[v0] SMS personalizado enviado:", result.sid)

    return NextResponse.json({
      success: true,
      messageSid: result.sid,
    })
  } catch (error) {
    console.error("[v0] Error enviando SMS personalizado:", error)
    return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 })
  }
}

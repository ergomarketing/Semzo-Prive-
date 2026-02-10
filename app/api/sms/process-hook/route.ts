import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

export async function POST(request: NextRequest) {
  try {
    const { phone, message, otp } = await request.json()

    if (!phone || !message) {
      return NextResponse.json({ error: "Phone and message are required" }, { status: 400 })
    }

    // Enviar SMS con remitente personalizado
    const smsResponse = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID, // Opcional
      // Para cuentas gratuitas, el remitente será el número de Twilio
      // pero el mensaje será personalizado con "Semzo Privé"
    })

    console.log("[v0] SMS enviado exitosamente:", smsResponse.sid)

    return NextResponse.json({
      success: true,
      messageSid: smsResponse.sid,
      status: smsResponse.status,
    })
  } catch (error: any) {
    console.error("[v0] Error enviando SMS:", error)

    return NextResponse.json(
      {
        error: "Error sending SMS",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

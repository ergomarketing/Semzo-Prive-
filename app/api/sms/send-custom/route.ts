import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

/**
 * Este endpoint es llamado EXCLUSIVAMENTE por el SMS Hook de Supabase.
 * El hook intercepta el envío nativo de Supabase y lo reemplaza con este SMS personalizado.
 * IMPORTANTE: Supabase debe tener deshabilitado su proveedor SMS nativo para evitar duplicados.
 * Acepta { phone, message } (desde sms-hook-function.sql) o { phone, otp } (legacy).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, otp, message } = body

    if (!phone) {
      return NextResponse.json({ error: "Phone is required" }, { status: 400 })
    }

    if (!otp && !message) {
      return NextResponse.json({ error: "OTP or message is required" }, { status: 400 })
    }

    // Construir mensaje: prioriza el message ya formateado del hook, si no usa otp
    const smsBody = message || `Tu código de verificación Semzo Privé es: ${otp}`

    console.log("[SMS HOOK] Enviando SMS personalizado a:", phone)

    const result = await client.messages.create({
      body: smsBody,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    })

    console.log("[SMS HOOK] SMS enviado correctamente. SID:", result.sid)

    return NextResponse.json({
      success: true,
      messageSid: result.sid,
    })
  } catch (error) {
    console.error("[SMS HOOK] Error enviando SMS personalizado:", error)
    return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 })
  }
}

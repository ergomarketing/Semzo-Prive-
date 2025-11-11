import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServiceRole } from "@/lib/supabaseClient"

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json({ success: false, message: "Número de teléfono requerido" }, { status: 400 })
    }

    const twilio = require("twilio")(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

    // Generar código OTP de 6 dígitos
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Enviar SMS personalizado con "Semzo Privé"
    await twilio.messages.create({
      body: `Tu código de verificación Semzo Privé es: ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    })

    const supabaseAdmin = getSupabaseServiceRole()
    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, message: "Error de configuración" }, { status: 500 })
    }

    // Guardar el código en Supabase para verificación posterior
    const { error: insertError } = await supabaseAdmin.from("sms_verification_codes").insert({
      phone: phone,
      code: otp,
      expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutos
    })

    if (insertError) {
      console.error("Error guardando código:", insertError)
    }

    return NextResponse.json({
      success: true,
      message: "Código SMS enviado exitosamente",
    })
  } catch (error) {
    console.error("SMS API Error:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}

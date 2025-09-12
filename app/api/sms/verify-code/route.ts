import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/app/lib/supabase-unified"

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json()

    if (!phone || !code) {
      return NextResponse.json({ success: false, message: "Teléfono y código requeridos" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin.auth.verifyOtp({
      phone: phone,
      token: code,
      type: "sms",
    })

    if (error) {
      console.error("Verification Error:", error)
      return NextResponse.json({ success: false, message: "Código inválido o expirado" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Verificación exitosa",
      user: data.user,
    })
  } catch (error) {
    console.error("Verification API Error:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}

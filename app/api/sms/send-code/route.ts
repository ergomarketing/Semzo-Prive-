import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/app/lib/supabase-unified"

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json({ success: false, message: "Número de teléfono requerido" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin.auth.signInWithOtp({
      phone: phone,
    })

    if (error) {
      console.error("SMS Error:", error)
      return NextResponse.json({ success: false, message: "Error enviando SMS" }, { status: 500 })
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

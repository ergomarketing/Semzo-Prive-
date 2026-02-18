import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServiceRole } from "@/lib/supabase"

/**
 * Reenvía un código OTP al número de teléfono especificado
 * Los códigos OTP de Supabase expiran en 60 segundos
 */
export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json({ success: false, message: "El número de teléfono es requerido" }, { status: 400 })
    }

    console.log("[v0] Reenviando código OTP a:", phone)

    const supabaseAdmin = getSupabaseServiceRole()
    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, message: "Error de configuración del servidor" }, { status: 500 })
    }

    // Reenviar OTP usando Supabase Auth
    const { data, error } = await supabaseAdmin.auth.signInWithOtp({
      phone: phone,
    })

    if (error) {
      console.error("[v0] Error reenviando OTP:", error)
      return NextResponse.json({ success: false, message: "Error al enviar código: " + error.message }, { status: 400 })
    }

    console.log("[v0] Código OTP reenviado exitosamente")

    return NextResponse.json({
      success: true,
      message: "Código reenviado exitosamente. Válido por 60 segundos.",
      expiresIn: 60,
    })
  } catch (error: any) {
    console.error("[v0] Error inesperado en resend-code:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}

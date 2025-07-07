import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "../../../lib/supabase-direct"

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, phone } = await request.json()

    console.log("🟡 Iniciando registro para:", email)

    // 1. Registrar usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone,
        },
      },
    })

    // Log detallado de la respuesta de Auth
    console.log("✅ Auth signUp response:", { authData, authError })

    // 1.1. Si hubo error en el registro
    if (authError) {
      console.error("❌ Error al registrar usuario:", authError)
      return NextResponse.json(
        { success: false, message: authError.message },
        { status: authError.status || 400 }
      )
    }

    // 1.2. Si no se recibió usuario (caso inesperado)
    if (!authData?.user) {
      console.error("⛔ No se pudo crear el usuario: authData.user es null")
      return NextResponse.json(
        { success: false, message: "No se pudo crear el usuario." },
        { status: 500 }
      )
    }

    console.log("🆔 Usuario creado en Auth:", authData.user.id)

    return NextResponse.json(
      { success: true, message: "Usuario registrado exitosamente." },
      { status: 200 }
    )
  } catch (error) {
    console.error("💥 Error inesperado:", error)
    return NextResponse.json(
      { success: false, message: "Error interno del servidor", error },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    console.log("[LOGIN] === INICIO LOGIN ===")
    console.log("[LOGIN] Email:", email)

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email y contraseña son requeridos" },
        { status: 400 }
      )
    }

    // Crear cliente público de Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Intentar login
    console.log("[LOGIN] Intentando login...")
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (error) {
      console.error("[LOGIN] Error en login:", error)
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { success: false, message: "No se pudo autenticar el usuario" },
        { status: 400 }
      )
    }

    console.log("[LOGIN] ✅ Login exitoso:", data.user.id)

    return NextResponse.json({
      success: true,
      message: "Login exitoso",
      user: {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.user_metadata?.first_name || "",
        lastName: data.user.user_metadata?.last_name || "",
        phone: data.user.user_metadata?.phone || "",
        membershipStatus: "free",
      },
      session: data.session,
    })
  } catch (error: any) {
    console.error("[LOGIN] ❌ Error inesperado:", error)
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

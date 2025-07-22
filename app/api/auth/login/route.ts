import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        success: false,
        message: "Configuración de Supabase incompleta",
      })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // 1. Autenticar usuario
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password.trim(),
    })

    if (authError) {
      console.error("[API] Error de autenticación:", authError)
      return NextResponse.json({
        success: false,
        message: "Email o contraseña incorrectos",
      })
    }

    const userId = authData.user?.id
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: "Error en la autenticación",
      })
    }

    // 2. Verificar que el perfil existe en la tabla users
    const { data: userData, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

    if (userError || !userData) {
      console.error("[API] Usuario no encontrado en tabla users:", userError)
      return NextResponse.json({
        success: false,
        message: "Usuario no encontrado. Por favor regístrate primero.",
      })
    }

    return NextResponse.json({
      success: true,
      message: "Login exitoso",
      user: {
        id: userData.id,
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
        membershipStatus: userData.membership_status,
      },
    })
  } catch (err: any) {
    console.error("[API] Error general:", err)
    return NextResponse.json({
      success: false,
      message: `Error: ${err.message}`,
    })
  }
}

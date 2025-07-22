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
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password.trim(),
    })

    if (signInError) {
      console.error("[API] Error de autenticación:", signInError)
      return NextResponse.json({
        success: false,
        message: "Email o contraseña incorrectos",
      })
    }

    const { user, session } = signInData
    if (!user || !session?.access_token) {
      return NextResponse.json({
        success: false,
        message: "Error en la autenticación",
      })
    }

    // 2. Cliente autenticado para obtener perfil
    const authenticatedClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      },
    })

    // 3. Obtener perfil del usuario
    const { data: profile, error: profileError } = await authenticatedClient
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      console.error("[API] Error obteniendo perfil:", profileError)
      return NextResponse.json({
        success: false,
        message: "Usuario no encontrado. Por favor regístrate primero.",
      })
    }

    // 4. Actualizar last_login
    await authenticatedClient.from("users").update({ last_login: new Date().toISOString() }).eq("id", user.id)

    return NextResponse.json({
      success: true,
      message: "Login exitoso",
      user: {
        id: profile.id,
        email: profile.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        membershipStatus: profile.membership_status,
      },
    })
  } catch (error: any) {
    console.error("[API] Error general en login:", error)
    return NextResponse.json({
      success: false,
      message: `Error: ${error.message}`,
    })
  }
}

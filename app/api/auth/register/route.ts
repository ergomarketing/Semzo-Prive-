import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const { email, password, firstName, lastName, phone } = await request.json()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        success: false,
        message: "Variables de Supabase no configuradas",
      })
    }

    // Cliente público para crear cuenta
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // 1. Crear usuario en Auth
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: password.trim(),
    })

    if (signUpError) {
      console.error("[API] Error en signUp:", signUpError)
      return NextResponse.json({
        success: false,
        message: signUpError.message,
      })
    }

    const { user, session } = signUpData
    if (!user || !session?.access_token) {
      return NextResponse.json({
        success: false,
        message: "No se pudo crear la sesión",
      })
    }

    // 2. Cliente autenticado para insertar perfil
    const authenticatedClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      },
    })

    // 3. Insertar perfil en tabla users
    const { error: insertError } = await authenticatedClient.from("users").insert({
      id: user.id,
      email: user.email,
      first_name: firstName?.trim() || null,
      last_name: lastName?.trim() || null,
      phone: phone?.trim() || null,
      membership_status: "free",
    })

    if (insertError) {
      console.error("[API] Error insertando perfil:", insertError)
      // Limpiar usuario de auth si falla la inserción
      await supabase.auth.admin.deleteUser(user.id)
      return NextResponse.json({
        success: false,
        message: `Error guardando perfil: ${insertError.message}`,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Cuenta creada exitosamente",
    })
  } catch (error: any) {
    console.error("[API] Error general:", error)
    return NextResponse.json({
      success: false,
      message: `Error: ${error.message}`,
    })
  }
}

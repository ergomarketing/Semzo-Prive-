import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, phone } = body

    console.log("[REGISTER] === INICIO REGISTRO ===")
    console.log("[REGISTER] Email:", email)

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { success: false, message: "Email, contraseña, nombre y apellido son requeridos" },
        { status: 400 }
      )
    }

    // Crear cliente público de Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // VALIDACIÓN ROBUSTA: Verificar si el usuario ya existe
    console.log("[REGISTER] Verificando si el usuario ya existe...")
    const { data: existingUser, error: checkError } = await supabase.auth.admin.getUserByEmail(email)
    
    if (!checkError && existingUser) {
      console.log("[REGISTER] Usuario ya existe:", existingUser.email)
      return NextResponse.json(
        { success: false, message: "Ya existe un usuario registrado con este email" },
        { status: 400 }
      )
    }

    // Registrar usuario SOLO con signUp (sin emails adicionales)
    console.log("[REGISTER] Registrando usuario con signUp...")
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: `${firstName} ${lastName}`,
          first_name: firstName,
          last_name: lastName,
          phone: phone || "",
        },
        emailRedirectTo: `https://semzoprive.com/auth/callback`
      }
    })

    if (error) {
      console.error("[REGISTER] Error en signUp:", error)
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { success: false, message: "No se pudo crear el usuario" },
        { status: 400 }
      )
    }

    console.log("[REGISTER] ✅ Usuario registrado:", data.user.id)
    console.log("[REGISTER] ✅ Supabase enviará SOLO su email automático")

    return NextResponse.json({
      success: true,
      message: "Usuario registrado exitosamente. Revisa tu email para confirmar tu cuenta.",
      user: {
        id: data.user.id,
        email: email,
        firstName: firstName,
        lastName: lastName,
        phone: phone,
        membershipStatus: "free",
      },
    })
  } catch (error: any) {
    console.error("[REGISTER] ❌ Error inesperado:", error)
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

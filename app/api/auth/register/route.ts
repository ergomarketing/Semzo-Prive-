import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const { email, password, firstName, lastName, phone } = await request.json()

    // Validaciones básicas
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ success: false, message: "Faltan campos requeridos" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 },
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, message: "Formato de email inválido" }, { status: 400 })
    }

    // Variables de entorno
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, message: "Error de configuración del servidor" }, { status: 500 })
    }

    // Cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Registrar usuario
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: password,
      options: {
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone?.trim() || null,
        },
      },
    })

    if (error) {
      console.error("Error en signUp:", error)

      if (error.message.includes("already registered")) {
        return NextResponse.json({ success: false, message: "Este email ya está registrado" }, { status: 409 })
      }

      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    if (!data.user) {
      return NextResponse.json({ success: false, message: "Error creando usuario" }, { status: 500 })
    }

    console.log("Usuario registrado exitosamente:", data.user.id)

    return NextResponse.json({
      success: true,
      message: "Cuenta creada exitosamente. Revisa tu email para confirmar tu cuenta.",
      user: {
        id: data.user.id,
        email: data.user.email,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone?.trim() || null,
        membershipStatus: "free",
        emailConfirmed: false,
      },
    })
  } catch (error: any) {
    console.error("Error general en registro:", error)
    return NextResponse.json({ success: false, message: "Error del servidor" }, { status: 500 })
  }
}

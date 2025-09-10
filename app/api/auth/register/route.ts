import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/app/lib/supabase-unified"

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 === INICIANDO REGISTRO ===")

    const body = await request.json()
    const { email, password, firstName, lastName } = body

    console.log("📋 Datos recibidos:")
    console.log("- Email:", email)
    console.log("- First name:", firstName)
    console.log("- Last name:", lastName)

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email y contraseña son requeridos",
          error: "MISSING_FIELDS",
        },
        { status: 400 },
      )
    }

    console.log("🔄 Registrando usuario con Supabase Auth (templates automáticos)...")

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password: password,
      options: {
        data: {
          full_name: `${firstName} ${lastName}`,
          first_name: firstName,
          last_name: lastName,
        },
        emailRedirectTo: "https://www.semzoprive.com/auth/callback",
      },
    })

    console.log("📊 Respuesta de Supabase:")
    console.log("- User creado:", !!authData.user)
    console.log("- User ID:", authData.user?.id)
    console.log("- Session:", !!authData.session)
    console.log("- Error:", !!authError)

    if (authError) {
      console.error("❌ Error creando usuario:", authError)

      if (
        authError.message?.toLowerCase().includes("user already registered") ||
        authError.message?.toLowerCase().includes("email already registered") ||
        authError.message?.toLowerCase().includes("already been registered")
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Este email ya está registrado. Intenta iniciar sesión o usar la opción de recuperar contraseña.",
            error: "EMAIL_ALREADY_EXISTS",
          },
          { status: 400 },
        )
      }

      return NextResponse.json(
        {
          success: false,
          message: `Error al crear usuario: ${authError.message}`,
          error: authError.message,
        },
        { status: 400 },
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        {
          success: false,
          message: "No se pudo crear el usuario",
          error: "NO_USER_CREATED",
        },
        { status: 400 },
      )
    }

    console.log("✅ Usuario creado - Supabase enviará email con template configurado automáticamente")

    return NextResponse.json({
      success: true,
      message:
        "Registro exitoso. Por favor revisa tu email y haz clic en el enlace de confirmación para activar tu cuenta.",
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name: `${firstName} ${lastName}`,
      },
    })
  } catch (error) {
    console.error("❌ Error inesperado en registro:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

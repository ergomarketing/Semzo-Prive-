import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

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

    // Crear cliente de Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    console.log("🔧 Variables de entorno:")
    console.log("- Supabase URL:", !!supabaseUrl, supabaseUrl?.substring(0, 30) + "...")
    console.log("- Supabase Anon Key:", !!supabaseAnonKey, supabaseAnonKey?.substring(0, 10) + "...")

    console.log("🔄 Creando usuario en Supabase Auth...")

    const redirectUrl = "https://semzoprive.com/auth/callback"
    console.log("🔗 Redirect URL:", redirectUrl)

    const signUpData = {
      email: email.toLowerCase().trim(),
      password: password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: `${firstName} ${lastName}`,
          first_name: firstName,
          last_name: lastName,
        },
      },
    }

    console.log("📤 Enviando a Supabase:", {
      email: signUpData.email,
      emailRedirectTo: signUpData.options.emailRedirectTo,
      userData: signUpData.options.data,
    })

    const { data: authData, error: authError } = await supabase.auth.signUp(signUpData)

    console.log("📊 Respuesta de Supabase:")
    console.log("- User creado:", !!authData.user)
    console.log("- User ID:", authData.user?.id)
    console.log("- Email confirmado:", !!authData.user?.email_confirmed_at)
    console.log("- Session:", !!authData.session)
    console.log("- Error:", !!authError)

    if (authError) {
      console.error("❌ Error creando usuario:", authError)
      console.error("❌ Error completo:", JSON.stringify(authError, null, 2))
      return NextResponse.json(
        {
          success: false,
          message: "Error al crear usuario: " + authError.message,
          error: authError.message,
        },
        { status: 400 },
      )
    }

    if (!authData.user) {
      console.error("❌ No se creó el usuario")
      return NextResponse.json(
        {
          success: false,
          message: "No se pudo crear el usuario",
          error: "NO_USER_CREATED",
        },
        { status: 400 },
      )
    }

    console.log("✅ Usuario creado en auth.users:", authData.user.id)
    console.log("✅ Registro completado exitosamente")

    return NextResponse.json({
      success: true,
      message: "Usuario registrado exitosamente. Revisa tu email para confirmar tu cuenta.",
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name: `${firstName} ${lastName}`,
        first_name: firstName,
        last_name: lastName,
      },
      debug: {
        emailConfirmed: !!authData.user.email_confirmed_at,
        hasSession: !!authData.session,
        redirectUrl: redirectUrl,
      },
    })
  } catch (error) {
    console.error("❌ Error inesperado en registro:", error)
    console.error("❌ Stack trace:", error instanceof Error ? error.stack : "No stack")
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

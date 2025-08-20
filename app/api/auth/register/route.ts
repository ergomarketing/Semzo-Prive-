import { type NextRequest, NextResponse } from "next/server"
import { supabase, supabaseAdmin } from "@/app/lib/supabase"
import { env, validateServerEnv } from "@/app/lib/env"

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 === INICIANDO REGISTRO ===")

    const envValidation = validateServerEnv()
    if (!envValidation.isValid) {
      console.error("❌ Variables de entorno faltantes:", envValidation.errors)
      return NextResponse.json(
        {
          success: false,
          message: "Error de configuración del servidor: " + envValidation.errors.join(", "),
          error: "ENV_VALIDATION_FAILED",
        },
        { status: 500 },
      )
    }

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

    console.log("🔧 Variables de entorno:")
    console.log("- Supabase URL exists:", !!env.NEXT_PUBLIC_SUPABASE_URL)
    console.log("- Supabase Anon Key exists:", !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    console.log("- Supabase URL:", env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + "...")
    console.log("- Supabase Anon Key:", env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 10) + "...")

    console.log("🔄 Creando usuario en Supabase Auth...")

    // USAR URL EXACTA HARDCODEADA
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

    if (supabaseAdmin) {
      try {
        console.log("🔄 Creando perfil en tabla profiles...")

        const profileData = {
          id: authData.user.id,
          email: authData.user.email!,
          full_name: `${firstName} ${lastName}`,
          first_name: firstName,
          last_name: lastName,
          phone: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        console.log("📤 Creando perfil:", profileData)

        const { error: profileError } = await supabaseAdmin.from("profiles").insert(profileData)

        if (profileError) {
          console.error("❌ Error creando perfil:", profileError)
          console.error("❌ Error completo:", JSON.stringify(profileError, null, 2))
          // No fallar el registro por esto
        } else {
          console.log("✅ Perfil creado exitosamente")
        }
      } catch (profileError) {
        console.error("❌ Error creando perfil:", profileError)
        // No fallar el registro por esto
      }
    } else {
      console.warn("⚠️ No hay supabaseAdmin disponible para crear perfil")
    }

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

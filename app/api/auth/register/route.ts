import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseBrowser } from "@/lib/supabaseClient"

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 === INICIANDO REGISTRO ===")

    const body = await request.json()
    const { email, password, firstName, lastName, phone } = body

    console.log("📋 Datos recibidos:")
    console.log("- Email:", email)
    console.log("- First name:", firstName)
    console.log("- Last name:", lastName)
    console.log("- Phone:", phone)

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

    const supabase = getSupabaseBrowser()
    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          message: "Error de configuración de Supabase",
          error: "SUPABASE_CONFIG_ERROR",
        },
        { status: 500 },
      )
    }

    console.log("🔍 Verificando si el email ya existe en profiles...")
    const { data: existingEmailProfile, error: emailCheckError } = await supabase
      .from("profiles")
      .select("email")
      .eq("email", email.toLowerCase().trim())
      .limit(1)

    if (emailCheckError) {
      console.log("⚠️ Error al verificar email en profiles:", emailCheckError)
    } else if (existingEmailProfile && existingEmailProfile.length > 0) {
      console.log("❌ Email ya existe en la tabla profiles")
      return NextResponse.json(
        {
          success: false,
          message: "Este email ya está registrado. Intenta iniciar sesión o usar la opción de recuperar contraseña.",
          error: "EMAIL_ALREADY_EXISTS",
        },
        { status: 400 },
      )
    }

    if (phone && phone.trim()) {
      console.log("🔍 Verificando si el teléfono ya existe en profiles...")
      const { data: existingPhoneProfile, error: phoneCheckError } = await supabase
        .from("profiles")
        .select("phone")
        .eq("phone", phone.trim())
        .limit(1)

      if (phoneCheckError) {
        console.log("⚠️ Error al verificar teléfono en profiles:", phoneCheckError)
      } else if (existingPhoneProfile && existingPhoneProfile.length > 0) {
        console.log("❌ Teléfono ya existe en la tabla profiles")
        return NextResponse.json(
          {
            success: false,
            message: "Este número de teléfono ya está registrado. Si ya tienes una cuenta, intenta iniciar sesión.",
            error: "PHONE_ALREADY_EXISTS",
          },
          { status: 400 },
        )
      }
    }

    console.log("🔍 Verificando si el email ya existe en auth.users...")
    const { data: existingUsers, error: checkError } = await supabase
      .from("auth.users")
      .select("email")
      .eq("email", email.toLowerCase().trim())
      .limit(1)

    if (checkError) {
      console.log("⚠️ No se pudo verificar duplicados, continuando con registro...")
    } else if (existingUsers && existingUsers.length > 0) {
      console.log("❌ Email ya existe en la base de datos")
      return NextResponse.json(
        {
          success: false,
          message: "Este email ya está registrado. Intenta iniciar sesión o usar la opción de recuperar contraseña.",
          error: "EMAIL_ALREADY_EXISTS",
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
          phone: phone || null,
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

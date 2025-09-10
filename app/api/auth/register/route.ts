import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/app/lib/supabase-unified"
import { EmailServiceProduction } from "@/app/lib/email-service-production"

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
      const errorDetails = {
        email: !!email,
        password: !!password,
        emailValue: email,
        passwordLength: password?.length || 0,
      }
      console.log("❌ Campos faltantes - Detalles:", errorDetails)
      return NextResponse.json(
        {
          success: false,
          message: "Email y contraseña son requeridos",
          error: "MISSING_FIELDS",
          debug: errorDetails,
        },
        { status: 400 },
      )
    }

    console.log("🔍 Verificando configuración de Supabase...")
    console.log("- Cliente supabaseAdmin:", !!supabaseAdmin)

    if (!supabaseAdmin) {
      console.error("❌ Cliente admin de Supabase no configurado")
      return NextResponse.json(
        {
          success: false,
          message: "Error de configuración del servidor",
          error: "SUPABASE_ADMIN_NOT_CONFIGURED",
        },
        { status: 500 },
      )
    }

    console.log("🔍 Verificando si el email ya existe en auth.users...")

    try {
      // Verificar en auth.users usando admin client
      const { data: existingUsers, error: adminError } = await supabaseAdmin.auth.admin.listUsers()

      if (adminError) {
        console.error("❌ Error verificando usuarios existentes:", adminError)
      } else {
        const existingUser = existingUsers.users.find(
          (user) => user.email?.toLowerCase() === email.toLowerCase().trim(),
        )

        if (existingUser) {
          console.log("❌ Email ya registrado en auth.users:", email)
          return NextResponse.json(
            {
              success: false,
              message:
                "Este email ya está registrado. Intenta iniciar sesión o usar la opción de recuperar contraseña.",
              error: "EMAIL_ALREADY_EXISTS",
            },
            { status: 400 },
          )
        }
      }
    } catch (adminCheckError) {
      console.error("❌ Error en verificación admin:", adminCheckError)
      // Continuar con el registro si falla la verificación admin
    }

    console.log("🔄 Registrando usuario en Supabase Auth...")

    const userData = {
      email: email.toLowerCase().trim(),
      password: password,
      options: {
        data: {
          full_name: `${firstName} ${lastName}`,
          first_name: firstName,
          last_name: lastName,
        },
      },
    }

    console.log("📤 Registrando usuario con confirmación de email requerida:", {
      email: userData.email,
      userData: userData.options.data,
    })

    let authData, authError
    try {
      const result = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: false, // Requiere confirmación por email
        user_metadata: userData.options.data,
      })
      authData = result.data
      authError = result.error
      console.log("📊 Respuesta cruda de Supabase Admin:", result)
    } catch (supabaseException) {
      console.error("❌ Excepción en createUser:", supabaseException)
      return NextResponse.json(
        {
          success: false,
          message: "Error de conexión con Supabase",
          error: "SUPABASE_CONNECTION_ERROR",
          debug: {
            exception: supabaseException instanceof Error ? supabaseException.message : String(supabaseException),
          },
        },
        { status: 500 },
      )
    }

    console.log("📊 Respuesta de Supabase:")
    console.log("- User creado:", !!authData.user)
    console.log("- User ID:", authData.user?.id)
    console.log("- Session:", !!authData.session)
    console.log("- Error:", !!authError)

    if (authError) {
      console.error("❌ Error creando usuario:", authError)
      console.error("❌ Error details:", {
        message: authError.message,
        status: authError.status,
        name: authError.name,
      })

      if (
        authError.message?.toLowerCase().includes("user already registered") ||
        authError.message?.toLowerCase().includes("email already registered") ||
        authError.message?.toLowerCase().includes("already been registered") ||
        authError.message?.toLowerCase().includes("email address already registered") ||
        authError.message?.toLowerCase().includes("user with this email already exists") ||
        authError.message?.toLowerCase().includes("email already exists") ||
        authError.message?.toLowerCase().includes("duplicate") ||
        authError.message?.toLowerCase().includes("already exists") ||
        authError.status === 422 ||
        authError.status === 400
      ) {
        console.log("❌ Usuario ya registrado detectado por Supabase")
        return NextResponse.json(
          {
            success: false,
            message: "Este email ya está registrado. Intenta iniciar sesión o usar la opción de recuperar contraseña.",
            error: "EMAIL_ALREADY_EXISTS",
          },
          { status: 400 },
        )
      }

      if (
        authError.message?.toLowerCase().includes("email rate limit exceeded") ||
        authError.message?.toLowerCase().includes("rate limit") ||
        authError.status === 429
      ) {
        console.log("🚫 Rate limit detectado - proporcionando mensaje amigable")
        return NextResponse.json(
          {
            success: false,
            message:
              "Se han enviado demasiados emails de confirmación. Por favor espera 15-30 minutos antes de intentar nuevamente, o usa un email diferente.",
            error: "RATE_LIMIT_EXCEEDED",
            errorCode: 429,
            userGuidance: {
              waitTime: "15-30 minutos",
              alternatives: [
                "Usar un email diferente",
                "Intentar desde otra conexión de internet",
                "Contactar soporte si el problema persiste",
              ],
            },
            debug: {
              supabaseError: {
                message: authError.message,
                status: authError.status,
                name: authError.name,
              },
            },
          },
          { status: 429 },
        )
      }

      const errorMessage = authError.message?.toLowerCase().includes("user already registered")
        ? "Este email ya está registrado. Intenta iniciar sesión o usar la opción de recuperar contraseña."
        : `Error al crear usuario: ${authError.message}`

      return NextResponse.json(
        {
          success: false,
          message: errorMessage,
          error: authError.message,
          errorCode: authError.status,
          debug: {
            supabaseError: {
              message: authError.message,
              status: authError.status,
              name: authError.name,
            },
          },
        },
        { status: authError.status === 429 ? 429 : 400 },
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

    try {
      console.log("🔗 Generando enlace de confirmación de Supabase...")
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: "signup",
        email: userData.email,
        options: {
          redirectTo: "https://www.semzoprive.com/auth/callback",
        },
      })

      if (linkError) {
        console.error("❌ Error generando enlace:", linkError)
        throw new Error(`Error generando enlace: ${linkError.message}`)
      }

      const confirmationUrl = linkData.properties?.action_link
      console.log("✅ URL de confirmación generada:", confirmationUrl)

      console.log("📧 Enviando email de bienvenida con servicio personalizado...")
      const emailService = new EmailServiceProduction()
      const emailSent = await emailService.sendWelcomeEmail(userData.email, `${firstName} ${lastName}`, confirmationUrl)

      if (emailSent) {
        console.log("✅ Email de confirmación enviado exitosamente")
      } else {
        console.error("❌ Error enviando email de confirmación")
      }
    } catch (emailException) {
      console.error("❌ Excepción enviando email:", emailException)
    }

    console.log("✅ Registro completado - Email de confirmación enviado")

    return NextResponse.json({
      success: true,
      message:
        "Registro exitoso. Por favor revisa tu email y haz clic en el enlace de confirmación para activar tu cuenta.",
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name: `${firstName} ${lastName}`,
        first_name: firstName,
        last_name: lastName,
      },
      debug: {
        emailConfirmed: !!authData.user?.email_confirmed_at,
        confirmationRequired: true,
        profileCreated: true,
        timestamp: new Date().toISOString(),
        userId: authData.user.id,
      },
    })
  } catch (error) {
    console.error("❌ Error inesperado en registro:", error)
    console.error("❌ Stack trace:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Unknown error",
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        debug: {
          timestamp: new Date().toISOString(),
          stack: error instanceof Error ? error.stack : null,
        },
      },
      { status: 500 },
    )
  }
}

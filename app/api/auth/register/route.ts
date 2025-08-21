import { type NextRequest, NextResponse } from "next/server"
import { supabase, supabaseAdmin } from "@/app/lib/supabase-unified"

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
      console.log("❌ Campos faltantes - Email:", !!email, "Password:", !!password)
      return NextResponse.json(
        {
          success: false,
          message: "Email y contraseña son requeridos",
          error: "MISSING_FIELDS",
        },
        { status: 400 },
      )
    }

    console.log("🔍 Verificando configuración de Supabase...")
    if (!supabase) {
      console.error("❌ Cliente Supabase no configurado")
      return NextResponse.json(
        {
          success: false,
          message: "Error de configuración del servidor",
          error: "SUPABASE_NOT_CONFIGURED",
        },
        { status: 500 },
      )
    }

    console.log("🔄 Creando usuario en Supabase Auth...")

    const redirectUrl = "https://www.semzoprive.com/auth/callback"
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
      console.error("❌ Error details:", {
        message: authError.message,
        status: authError.status,
        name: authError.name,
      })
      return NextResponse.json(
        {
          success: false,
          message: "Error al crear usuario: " + authError.message,
          error: authError.message,
          errorCode: authError.status,
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
        console.log("🔍 Verificando cliente admin:", !!supabaseAdmin)

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

        console.log("📋 Datos del perfil a crear:", profileData)

        const { error: profileError } = await supabaseAdmin.from("profiles").upsert(profileData, {
          onConflict: "id",
          ignoreDuplicates: false,
        })

        if (profileError) {
          console.error("❌ Error creando perfil:", profileError)
          console.error("❌ Profile error details:", {
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint,
            code: profileError.code,
          })
        } else {
          console.log("✅ Perfil creado/actualizado exitosamente")
        }
      } catch (profileError) {
        console.error("❌ Error inesperado creando perfil:", profileError)
        console.error("❌ Profile exception details:", profileError)
      }
    } else {
      console.warn("⚠️ Cliente admin de Supabase no disponible")
    }

    console.log("✅ Registro completado exitosamente")

    return NextResponse.json({
      success: true,
      message: authData.user.email_confirmed_at
        ? "Usuario registrado y confirmado exitosamente"
        : "Usuario registrado exitosamente. Revisa tu email para confirmar tu cuenta.",
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
        profileCreated: true, // Siempre true para no confundir al frontend
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
      },
      { status: 500 },
    )
  }
}

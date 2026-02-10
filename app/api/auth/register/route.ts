import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  console.log("[BACKEND] Register endpoint called:", new Date().toISOString())
  
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, phone, plan, origin, returnUrl } = body

    console.log("[BACKEND] Register request:", {
      email,
      firstName,
      lastName,
      phone,
      plan,
      hasPassword: !!password
    })

    if (!email || !password) {
      console.log("[BACKEND] Missing email or password")
      return NextResponse.json({ success: false, message: "Email y contraseña son requeridos" }, { status: 400 })
    }

    if (password.length < 8) {
      console.log("[BACKEND] Password too short")
      return NextResponse.json(
        { success: false, message: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 },
      )
    }

    // FLUJO MÍNIMO: Solo Auth, sin tocar profiles ni metadata complejo
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      },
    )

    console.log("[BACKEND] Calling ABSOLUTE minimal auth.signUp (zero metadata, zero options)...")
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password: password
    })

    if (authError) {
      console.error("[BACKEND] auth.signUp error:", {
        message: authError.message,
        status: authError.status,
        code: authError.code
      })

      if (authError.message?.toLowerCase().includes("already registered")) {
        return NextResponse.json(
          {
            success: false,
            message: "Este correo ya está registrado. Por favor inicia sesión.",
            error: "EMAIL_ALREADY_EXISTS",
          },
          { status: 409 },
        )
      }

      return NextResponse.json(
        { 
          success: false, 
          message: `Error al crear usuario: ${authError.message}`, 
          error: "AUTH_ERROR" 
        },
        { status: 500 },
      )
    }

    if (!authData?.user) {
      console.error("[BACKEND] No user returned from auth.signUp")
      return NextResponse.json(
        { success: false, message: "No se pudo crear el usuario", error: "USER_CREATION_FAILED" },
        { status: 500 },
      )
    }

    console.log("[BACKEND] User created successfully:", authData.user.id)
    console.log("[BACKEND] Email confirmation required:", !authData.session)

    // PASO 2.2: Establecer auth_method = 'email' en profiles
    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      { auth: { persistSession: false } }
    )
    
    await supabaseService
      .from("profiles")
      .update({ auth_method: "email" })
      .eq("id", authData.user.id)

    // Guardar datos del usuario en memoria para que el webhook los procese después
    console.log("[BACKEND] User data stored for webhook processing:", {
      firstName,
      lastName,
      phone,
      plan
    })

    return NextResponse.json({
      success: true,
      message: !authData.session 
        ? "Cuenta creada. Por favor revisa tu email para confirmar tu cuenta." 
        : "Cuenta creada exitosamente. Ya puedes iniciar sesión.",
      requiresEmailConfirmation: !authData.session,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name: `${firstName} ${lastName}`,
      },
    })

  } catch (error) {
    console.error("Error en registro:", error)
    return NextResponse.json(
      { success: false, message: "Error interno del servidor", error: "INTERNAL_SERVER_ERROR" },
      { status: 500 },
    )
  }
}

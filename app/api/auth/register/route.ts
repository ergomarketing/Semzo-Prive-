import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, phone, plan, origin } = body

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email y contraseña son requeridos" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 },
      )
    }

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

    // Verificar si el email ya existe
    const { data: existingEmailProfile } = await supabase
      .from("profiles")
      .select("email")
      .eq("email", email.toLowerCase().trim())
      .limit(1)

    if (existingEmailProfile && existingEmailProfile.length > 0) {
      return NextResponse.json(
        { success: false, message: "Este correo ya está registrado", error: "EMAIL_ALREADY_EXISTS" },
        { status: 400 },
      )
    }

    // Verificar si el teléfono ya existe
    if (phone && phone.trim()) {
      const { data: existingPhoneProfile } = await supabase
        .from("profiles")
        .select("phone")
        .eq("phone", phone.trim())
        .limit(1)

      if (existingPhoneProfile && existingPhoneProfile.length > 0) {
        return NextResponse.json(
          { success: false, message: "Este número de teléfono ya está registrado", error: "PHONE_ALREADY_EXISTS" },
          { status: 400 },
        )
      }
    }

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
        emailRedirectTo: (() => {
          const baseUrl =
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
            `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.semzoprive.com"}/auth/callback`
          const params = new URLSearchParams()
          if (plan) params.set("plan", plan)
          if (origin) params.set("origin", origin)
          return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl
        })(),
      },
    })

    if (authError) {
      console.error("[v0] Error de Supabase Auth:", authError)

      if (authError.message?.toLowerCase().includes("user already registered")) {
        return NextResponse.json(
          {
            success: false,
            message: "Este correo ya está registrado. Por favor inicia sesión.",
            error: "EMAIL_ALREADY_EXISTS",
          },
          { status: 400 },
        )
      }

      return NextResponse.json(
        { success: false, message: `Error al crear usuario: ${authError.message}`, error: "SUPABASE_AUTH_ERROR" },
        { status: 400 },
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, message: "No se pudo crear el usuario", error: "USER_CREATION_FAILED" },
        { status: 400 },
      )
    }

    const requiresConfirmation = !authData.user.email_confirmed_at
    const message = requiresConfirmation
      ? "Registro exitoso. Por favor revisa tu email para confirmar tu cuenta."
      : "Registro exitoso. Ya puedes iniciar sesión."

    return NextResponse.json({
      success: true,
      message: message,
      requiresConfirmation: requiresConfirmation,
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

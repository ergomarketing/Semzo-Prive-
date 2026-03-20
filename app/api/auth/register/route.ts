import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, phone, plan, origin, returnUrl } = body

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email y contraseña son requeridos" }, { status: 400 })
    }

    if (password.length < 8) {

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

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password: password
    })

    if (authError) {
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

    // PASO 2: Upsert completo de profiles con todos los datos del registro
    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    const fullName = `${firstName || ""} ${lastName || ""}`.trim()

    // Upsert sin phone para evitar constraint profiles_phone_unique
    await supabaseService
      .from("profiles")
      .upsert({
        id: authData.user.id,
        email: email.toLowerCase().trim(),
        full_name: fullName || null,
        first_name: firstName || null,
        last_name: lastName || null,
        auth_method: "email",
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" })

    // Phone en paso separado solo si no pertenece a otro usuario
    if (phone) {
      const { data: phoneOwner } = await supabaseService
        .from("profiles")
        .select("id")
        .eq("phone", phone)
        .neq("id", authData.user.id)
        .maybeSingle()

      if (!phoneOwner) {
        await supabaseService
          .from("profiles")
          .update({ phone })
          .eq("id", authData.user.id)
      }
    }

    // Notificar al admin del nuevo registro
    try {
      const { adminNotifications } = await import("@/lib/admin-notifications")
      await adminNotifications.notifyNewUserRegistration({
        userName: fullName || email.toLowerCase().trim(),
        userEmail: email.toLowerCase().trim(),
      })
    } catch (notifError) {
      // No bloquear el registro si falla la notificación
    }

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

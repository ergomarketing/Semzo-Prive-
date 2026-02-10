import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, firstName, lastName } = body

    console.log("🔄 Registro gratuito para:", email)

    // Verificar variables de entorno
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ success: false, error: "Configuración de Supabase incompleta" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Verificar si el email ya existe en profiles
    const { data: existingUser, error: checkError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("email", email.toLowerCase().trim())
      .limit(1)
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: `Este email ya está registrado${existingUser.full_name ? ` a nombre de ${existingUser.full_name}` : ""}. Por favor inicia sesión.`,
        },
        { status: 400 }
      )
    }

    // Generar contraseña temporal
    const tempPassword = Math.random().toString(36).slice(-8)

    // Registrar usuario
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password: tempPassword,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`,
        },
      },
    })

    if (error) {
      console.error("❌ Error en registro gratuito:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    // PASO 2.2: Establecer auth_method = 'email' en profiles
    if (data.user?.id) {
      const supabaseService = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!,
        { auth: { persistSession: false } }
      )
      
      await supabaseService
        .from("profiles")
        .update({ auth_method: "email" })
        .eq("id", data.user.id)
    }

    try {
      const { adminNotifications } = await import("@/lib/admin-notifications")
      await adminNotifications.notifyNewUserRegistration({
        userName: `${firstName} ${lastName}`,
        userEmail: email.toLowerCase().trim(),
        membershipPlan: "Free",
      })
      console.log("[v0] Admin notified of new free user registration")
    } catch (notifError) {
      console.error("[v0] Error sending new user notification:", notifError)
    }

    // NO enviar emails manuales - Supabase lo hace automáticamente
    // await productionEmailService.getInstance().sendWelcomeMembership(...)

    return NextResponse.json({
      success: true,
      message: "Registro exitoso. Revisa tu email para confirmar tu cuenta.",
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
    })
  } catch (error) {
    console.error("❌ Error inesperado en registro gratuito:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

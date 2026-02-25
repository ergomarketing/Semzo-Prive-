import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseBrowser } from "@/lib/supabase"
import { loginLimiter } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const { success, remaining } = loginLimiter.check(ip, 5, 15 * 60 * 1000) // 5 intentos en 15 minutos

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          message: "Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.",
        },
        { status: 429 },
      )
    }

    console.log("[LOGIN] === INICIO LOGIN ===")
    console.log("[LOGIN] Email:", email)
    console.log("[LOGIN] Intentos restantes:", remaining)

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email y contraseña son requeridos" }, { status: 400 })
    }

    const supabase = getSupabaseBrowser()
    if (!supabase) {
      return NextResponse.json({ success: false, message: "Error de configuración de Supabase" }, { status: 500 })
    }

    console.log("[LOGIN] Intentando login...")
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password: password,
    })

    if (error) {
      console.error("[LOGIN] Error en login:", error)

      // Mensajes de error más específicos
      if (error.message.includes("Invalid login credentials")) {
        return NextResponse.json({ success: false, message: "Email o contraseña incorrectos" }, { status: 401 })
      } else if (error.message.includes("Email not confirmed")) {
        return NextResponse.json(
          { success: false, message: "Debes confirmar tu email antes de iniciar sesión" },
          { status: 401 },
        )
      } else {
        return NextResponse.json({ success: false, message: error.message }, { status: 401 })
      }
    }

    if (!data.user) {
      return NextResponse.json({ success: false, message: "No se pudo autenticar el usuario" }, { status: 401 })
    }

    console.log("[LOGIN] ✅ Login exitoso:", data.user.id)
    console.log("[LOGIN] ✅ Email confirmado:", !!data.user.email_confirmed_at)

    // Verificar si existe el perfil
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single()

    if (profileError || !profile) {
      console.warn("[LOGIN] ⚠️ Perfil no encontrado, creando...")

      // Crear perfil si no existe
      const { error: createProfileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.user_metadata?.full_name || "",
        first_name: data.user.user_metadata?.first_name || "",
        last_name: data.user.user_metadata?.last_name || "",
        phone: data.user.user_metadata?.phone || "",
        is_active: true,
        email_confirmed: true,
      })

      if (createProfileError) {
        console.error("[LOGIN] Error creando perfil:", createProfileError)
      } else {
        console.log("[LOGIN] ✅ Perfil creado durante login")
      }
    } else {
      console.log("[LOGIN] ✅ Perfil encontrado:", profile.email)
    }

    // Fuente única de verdad: user_memberships
    const { data: activeMembership } = await supabase
      .from("user_memberships")
      .select("membership_type, status")
      .eq("user_id", data.user.id)
      .eq("status", "active")
      .maybeSingle()

    loginLimiter.reset(ip)

    return NextResponse.json({
      success: true,
      message: "Login exitoso",
      user: {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.user_metadata?.first_name || "",
        lastName: data.user.user_metadata?.last_name || "",
        membershipStatus: activeMembership?.status || "free",
        membershipType: activeMembership?.membership_type || null,
      },
      session: data.session,
    })
  } catch (error: any) {
    console.error("[LOGIN] ❌ Error inesperado:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}

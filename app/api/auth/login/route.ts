import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseBrowser } from "@/lib/supabaseClient"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    console.log("[LOGIN] === INICIO LOGIN ===")
    console.log("[LOGIN] Email:", email)

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
        membership_status: "free",
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

    return NextResponse.json({
      success: true,
      message: "Login exitoso",
      user: {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.user_metadata?.first_name || "",
        lastName: data.user.user_metadata?.last_name || "",
        membershipStatus: profile?.membership_status || "free",
      },
      session: data.session,
    })
  } catch (error: any) {
    console.error("[LOGIN] ❌ Error inesperado:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

export async function POST(request: NextRequest) {
  try {
    console.log("[LOGIN] === INICIO LOGIN ===")

    const body = await request.json()
    console.log("[LOGIN] Datos recibidos:", { email: body.email })

    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 })
    }

    // Crear cliente normal de Supabase
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Intentar login
    console.log("[LOGIN] Intentando autenticación...")
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("[LOGIN] Error de autenticación:", error.message)

      // Mensajes de error más específicos
      if (error.message.includes("Invalid login credentials")) {
        return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 })
      }

      if (error.message.includes("Email not confirmed")) {
        return NextResponse.json(
          { error: "Debes confirmar tu email antes de iniciar sesión. Revisa tu bandeja de entrada." },
          { status: 401 },
        )
      }

      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    if (!data.user) {
      console.error("[LOGIN] No se obtuvo usuario después del login")
      return NextResponse.json({ error: "Error en el proceso de autenticación" }, { status: 500 })
    }

    console.log("[LOGIN] Usuario autenticado:", data.user.id)

    // Verificar que el usuario tenga perfil en public.users
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single()

    if (profileError && profileError.code !== "PGRST116") {
      console.error("[LOGIN] Error obteniendo perfil:", profileError)
      return NextResponse.json({ error: "Error obteniendo perfil de usuario" }, { status: 500 })
    }

    // Si no tiene perfil, crearlo
    if (!userProfile) {
      console.log("[LOGIN] Creando perfil faltante...")
      const { error: createProfileError } = await supabaseAdmin.from("users").insert({
        id: data.user.id,
        email: data.user.email!,
        first_name: data.user.user_metadata?.first_name || "",
        last_name: data.user.user_metadata?.last_name || "",
        phone: data.user.user_metadata?.phone || null,
        membership_status: "free",
        email_confirmed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (createProfileError) {
        console.error("[LOGIN] Error creando perfil:", createProfileError)
        return NextResponse.json({ error: "Error creando perfil de usuario" }, { status: 500 })
      }
      console.log("[LOGIN] ✓ Perfil creado exitosamente")
    }

    console.log("[LOGIN] === LOGIN EXITOSO ===")
    return NextResponse.json({
      message: "Login exitoso",
      user: {
        id: data.user.id,
        email: data.user.email,
        ...userProfile,
      },
      session: data.session,
    })
  } catch (error) {
    console.error("[LOGIN] Error inesperado:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

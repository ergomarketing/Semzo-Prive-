import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log("[Login API] Datos recibidos:", { email, password: "***" })

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Intentar login con Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("[Login API] Error de Supabase:", error)
      return NextResponse.json({ success: false, message: "Credenciales inválidas" }, { status: 400 })
    }

    if (!data.user) {
      return NextResponse.json({ success: false, message: "Usuario no encontrado" }, { status: 400 })
    }

    console.log("[Login API] Usuario autenticado:", data.user.email)

    // Obtener datos del perfil desde la tabla profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single()

    if (profileError) {
      console.error("[Login API] Error obteniendo perfil:", profileError)
      // Si no hay perfil, usar datos del user metadata
      return NextResponse.json({
        success: true,
        message: "Login exitoso",
        user: {
          id: data.user.id,
          email: data.user.email,
          firstName: data.user.user_metadata?.firstName || "",
          lastName: data.user.user_metadata?.lastName || "",
          phone: data.user.user_metadata?.phone || "",
          membershipStatus: "free",
        },
        session: data.session,
      })
    }

    console.log("[Login API] Perfil encontrado:", profile)

    return NextResponse.json({
      success: true,
      message: "Login exitoso",
      user: {
        id: data.user.id,
        email: data.user.email,
        firstName: profile.first_name || data.user.user_metadata?.firstName || "",
        lastName: profile.last_name || data.user.user_metadata?.lastName || "",
        phone: profile.phone || data.user.user_metadata?.phone || "",
        membershipStatus: profile.membership_status || "free",
      },
      session: data.session,
    })
  } catch (error: any) {
    console.error("[Login API] Error general:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}

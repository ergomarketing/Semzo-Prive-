import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log("[API Login] Intentando login para:", email)

    // Autenticar con Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      console.error("[API Login] Error de autenticación:", authError)
      return NextResponse.json({ success: false, message: "Credenciales inválidas" }, { status: 401 })
    }

    if (!authData.user) {
      return NextResponse.json({ success: false, message: "Usuario no encontrado" }, { status: 404 })
    }

    // Obtener datos del perfil
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single()

    if (profileError || !profile) {
      console.error("[API Login] Error obteniendo perfil:", profileError)
      return NextResponse.json({ success: false, message: "Perfil no encontrado" }, { status: 404 })
    }

    const user = {
      id: authData.user.id,
      email: authData.user.email!,
      firstName: profile.first_name,
      lastName: profile.last_name,
      phone: profile.phone,
      membershipStatus: profile.membership_status || "free",
    }

    console.log("[API Login] Login exitoso para:", user)

    return NextResponse.json({
      success: true,
      message: "Login exitoso",
      user,
      session: authData.session,
    })
  } catch (error) {
    console.error("[API Login] Error:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}

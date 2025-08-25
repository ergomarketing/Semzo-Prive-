import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log("[Login] Datos recibidos:", { email, password: "***" })

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Intentar login con Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("[Login] Error de Supabase:", error)
      return NextResponse.json(
        { success: false, message: "Credenciales inválidas o usuario no confirmado" },
        { status: 400 },
      )
    }

    if (!data.user) {
      return NextResponse.json({ success: false, message: "Usuario no encontrado" }, { status: 400 })
    }

    console.log("[Login] Login exitoso para:", data.user.email)

    // Obtener datos del perfil
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single()

    if (profileError) {
      console.log("[Login] Error obteniendo perfil:", profileError.message)
    }

    return NextResponse.json({
      success: true,
      message: "Login exitoso",
      user: {
        id: data.user.id,
        email: data.user.email,
        firstName: profile?.first_name || data.user.user_metadata?.firstName || "",
        lastName: profile?.last_name || data.user.user_metadata?.lastName || "",
        phone: profile?.phone || data.user.user_metadata?.phone || "",
        membershipStatus: profile?.membership_status || "free",
      },
      session: data.session,
    })
  } catch (error: any) {
    console.error("[Login] Error general:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}

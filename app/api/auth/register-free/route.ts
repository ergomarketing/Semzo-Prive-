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

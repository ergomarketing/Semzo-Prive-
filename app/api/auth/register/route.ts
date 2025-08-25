import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, phone } = await request.json()

    console.log("[Register] Datos recibidos:", { email, firstName, lastName, phone })

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Crear usuario en Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          firstName,
          lastName,
          phone,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    })

    if (error) {
      console.error("[Register] Error de Supabase:", error)
      return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    }

    console.log("[Register] Usuario creado exitosamente:", data.user?.email)

    return NextResponse.json({
      success: true,
      message: "Usuario registrado exitosamente. Revisa tu email para confirmar tu cuenta.",
      user: data.user,
    })
  } catch (error: any) {
    console.error("[Register] Error general:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}

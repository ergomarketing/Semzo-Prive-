import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, phone } = await request.json()

    console.log("[Register API] Datos recibidos:", { email, firstName, lastName, phone })

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Registrar usuario en Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        data: {
          firstName,
          lastName,
          phone,
        },
      },
    })

    if (error) {
      console.error("[Register API] Error de Supabase:", error)
      return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    }

    if (!data.user) {
      return NextResponse.json({ success: false, message: "Error creando usuario" }, { status: 400 })
    }

    console.log("[Register API] Usuario creado:", data.user.email)

    // Crear perfil en la tabla profiles
    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      email: email,
      membership_status: "free",
      created_at: new Date().toISOString(),
    })

    if (profileError) {
      console.error("[Register API] Error creando perfil:", profileError)
      // No retornamos error aquí porque el usuario ya fue creado
    }

    return NextResponse.json({
      success: true,
      message: "Usuario registrado exitosamente. Por favor verifica tu email.",
      user: {
        id: data.user.id,
        email: data.user.email,
        firstName,
        lastName,
        phone: phone || "",
        membershipStatus: "free",
      },
    })
  } catch (error: any) {
    console.error("[Register API] Error general:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}

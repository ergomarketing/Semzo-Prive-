import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ message: "Email y contraseña son obligatorios" }, { status: 400 })
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { message: authError?.message || "Error al iniciar sesión" },
        { status: 401 }
      )
    }

    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("id, email, first_name, last_name, membership_status")
      .eq("id", authData.user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { message: "Perfil de usuario no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Inicio de sesión exitoso",
      user: {
        id: userProfile.id,
        email: userProfile.email,
        name: `${userProfile.first_name} ${userProfile.last_name}`,
        membershipStatus: userProfile.membership_status,
      },
    })
  } catch (error) {
    console.error("Error en login:", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}

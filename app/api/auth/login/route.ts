import { type NextRequest, NextResponse } from "next/server"
import { AuthServiceSupabase } from "@/app/lib/auth-service-supabase"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ message: "Email y contraseña son obligatorios" }, { status: 400 })
    }

    const result = await AuthServiceSupabase.loginUser(email, password)

    if (!result.success) {
      return NextResponse.json({ message: result.message }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      user: {
        id: result.user?.id,
        email: result.user?.email,
        name: `${result.user?.first_name} ${result.user?.last_name}`,
        membershipStatus: result.user?.membership_status,
      },
    })
  } catch (error) {
    console.error("Error en login:", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}

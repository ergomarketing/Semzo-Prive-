import { type NextRequest, NextResponse } from "next/server"
import { authService } from "@/app/lib/auth-simple"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validaciones
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email y contraseña son requeridos",
        },
        { status: 400 },
      )
    }

    // Iniciar sesión
    const result = await authService.login(email, password)

    if (!result.success) {
      return NextResponse.json(result, { status: 401 })
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("Error en login:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

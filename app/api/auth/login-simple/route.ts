import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin"
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "semzo2024!"

    console.log("[v0] Login attempt:", { username, password: "***" })

    // Validaciones
    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Usuario y contraseña son requeridos",
        },
        { status: 400 },
      )
    }

    const isValidUsername = username === ADMIN_USERNAME
    const isValidPassword = password === ADMIN_PASSWORD

    console.log("[v0] Validation results:", { isValidUsername, isValidPassword })

    if (isValidUsername && isValidPassword) {
      console.log("[v0] Login successful")
      return NextResponse.json(
        {
          success: true,
          message: "Login exitoso",
        },
        { status: 200 },
      )
    } else {
      console.log("[v0] Login failed - invalid credentials")
      return NextResponse.json(
        {
          success: false,
          message: "Usuario o contraseña incorrectos",
        },
        { status: 401 },
      )
    }
  } catch (error) {
    console.error("[v0] Error en login:", error)
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

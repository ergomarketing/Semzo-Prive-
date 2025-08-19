import { type NextRequest, NextResponse } from "next/server"
import { ADMIN_CONFIG } from "@/app/config/email-config"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    console.log("[v0] Login attempt:", { username, password: "***" })
    console.log("[v0] Expected credentials:", {
      username: ADMIN_CONFIG.username,
      password: "***",
      envUsername: process.env.ADMIN_USERNAME,
      envPassword: process.env.ADMIN_PASSWORD ? "SET" : "NOT_SET",
    })

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

    const isValidUsername = username === ADMIN_CONFIG.username
    const isValidPassword = password === ADMIN_CONFIG.password

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

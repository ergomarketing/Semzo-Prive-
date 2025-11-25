'''import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 })
    }

    const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL
    const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD

    // 1. Verificar credenciales contra variables de entorno
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

    // 2. Credenciales válidas: Establecer cookies de sesión
    const response = NextResponse.json({ message: "Login exitoso" }, { status: 200 })

    // Token de sesión (HTTP-only para seguridad)
    response.cookies.set("admin_session_token", "valid_admin_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 semana
      path: "/admin",
    })

    // Email (no HTTP-only, para mostrar en el cliente)
    response.cookies.set("admin_email", email, {
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 semana
      path: "/admin",
    })

    return response
  } catch (error) {
    console.error("Error en API de login de admin:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
'''

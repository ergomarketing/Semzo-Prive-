'''import { NextResponse } from "next/server"

export async function POST() {
  const response = NextResponse.json({ message: "Logout exitoso" }, { status: 200 })

  // Limpiar cookies de sesión
  response.cookies.set("admin_session_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 0, // Expirar inmediatamente
    path: "/admin",
  })

  response.cookies.set("admin_email", "", {
    secure: process.env.NODE_ENV === "production",
    maxAge: 0, // Expirar inmediatamente
    path: "/admin",
  })

  return response
}
'''

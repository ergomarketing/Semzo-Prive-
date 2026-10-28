import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createAdminSessionValue } from "@/lib/admin-auth"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // Las credenciales se leen SOLO desde variables de entorno server-side.
    // Si no están definidas, el login falla — nunca hay fallback hardcodeado.
    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminEmail || !adminPassword) {
      console.error("[admin/login] ADMIN_EMAIL o ADMIN_PASSWORD no están definidos en las variables de entorno.")
      return NextResponse.json({ success: false, message: "Configuración de servidor incompleta" }, { status: 500 })
    }

    if (email === adminEmail && password === adminPassword) {
      // Crear cookie de sesión
      const cookieStore = await cookies()
      const isProduction = process.env.NODE_ENV === "production"
      cookieStore.set("admin_session", createAdminSessionValue(), {
        httpOnly: true,
        // El preview de v0 es un iframe de terceros: sin SameSite=None; Secure el navegador descarta la cookie.
        secure: true,
        sameSite: isProduction ? "lax" : "none",
        maxAge: 60 * 60 * 24, // 24 horas
        path: "/",
      })

      return NextResponse.json({ success: true, message: "Login exitoso" })
    }

    return NextResponse.json({ success: false, message: "Credenciales inválidas" }, { status: 401 })
  } catch (error) {
    console.error("Error en login:", error)
    return NextResponse.json({ success: false, message: "Error en el servidor" }, { status: 500 })
  }
}

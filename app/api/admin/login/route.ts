import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { timingSafeEqual } from "node:crypto"
import { createAdminSessionValue } from "@/lib/admin-auth"
import { getServiceClient } from "@/lib/supabase-service"

// Limite de intentos fallidos (se guardan en audit_log, sin tablas nuevas): por IP y en total.
const WINDOW_MS = 15 * 60 * 1000
const MAX_FAILURES_PER_IP = 5
const MAX_FAILURES_TOTAL = 20
const FAILED_ACTION = "admin_login_failed"

function sameText(a: unknown, b: string): boolean {
  if (typeof a !== "string") return false
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown"
}

async function isLockedOut(ip: string): Promise<boolean> {
  try {
    const db = getServiceClient()
    const since = new Date(Date.now() - WINDOW_MS).toISOString()
    const [{ count: fromIp }, { count: total }] = await Promise.all([
      db
        .from("audit_log")
        .select("id", { count: "exact", head: true })
        .eq("action", FAILED_ACTION)
        .eq("entity_id", ip)
        .gte("created_at", since),
      db
        .from("audit_log")
        .select("id", { count: "exact", head: true })
        .eq("action", FAILED_ACTION)
        .gte("created_at", since),
    ])
    return (fromIp ?? 0) >= MAX_FAILURES_PER_IP || (total ?? 0) >= MAX_FAILURES_TOTAL
  } catch (error) {
    // Si no se puede contar, no se bloquea a la administradora: sigue haciendo falta la contraseña.
    console.error("[admin/login] no se pudo comprobar el limite de intentos:", error)
    return false
  }
}

async function recordFailure(ip: string): Promise<void> {
  try {
    await getServiceClient().from("audit_log").insert({
      action: FAILED_ACTION,
      entity_type: "admin_login",
      entity_id: ip,
    })
  } catch (error) {
    console.error("[admin/login] no se pudo registrar el intento fallido:", error)
  }
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    const ip = clientIp(request)
    if (await isLockedOut(ip)) {
      return NextResponse.json(
        { success: false, message: "Demasiados intentos. Inténtalo de nuevo en 15 minutos." },
        { status: 429 },
      )
    }

    // Las credenciales se leen SOLO desde variables de entorno server-side.
    // Si no están definidas, el login falla — nunca hay fallback hardcodeado.
    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminEmail || !adminPassword) {
      console.error("[admin/login] ADMIN_EMAIL o ADMIN_PASSWORD no están definidos en las variables de entorno.")
      return NextResponse.json({ success: false, message: "Configuración de servidor incompleta" }, { status: 500 })
    }

    if (sameText(email, adminEmail) && sameText(password, adminPassword)) {
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

    await recordFailure(ip)
    await new Promise((resolve) => setTimeout(resolve, 800))
    return NextResponse.json({ success: false, message: "Credenciales inválidas" }, { status: 401 })
  } catch (error) {
    console.error("Error en login:", error)
    return NextResponse.json({ success: false, message: "Error en el servidor" }, { status: 500 })
  }
}

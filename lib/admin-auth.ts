/**
 * lib/admin-auth.ts
 * Helper de autenticación para rutas API del panel de administración.
 *
 * Uso en cualquier route.ts:
 *
 *   import { requireAdminAuth } from "@/lib/admin-auth"
 *
 *   export async function GET(request: NextRequest) {
 *     const authError = await requireAdminAuth(request)
 *     if (authError) return authError
 *     // ... lógica de la ruta
 *   }
 */

import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createHmac, timingSafeEqual } from "crypto"

const COOKIE_NAME = "admin_session"
const SESSION_TTL_MS = 24 * 60 * 60 * 1000

/**
 * La cookie de sesion va FIRMADA (caducidad + HMAC-SHA256 con un secreto del servidor). Antes valia con el
 * texto fijo "authenticated": cualquiera podia fabricarla a mano y entrar en toda la API de administracion.
 * Secreto: ADMIN_SESSION_SECRET si existe; si no, la clave de servicio de Supabase (solo servidor).
 */
function sessionSecret(): string | null {
  return process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || null
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex")
}

/** Valor de la cookie para una sesion nueva. Solo se llama tras validar usuario y contrasena. */
export function createAdminSessionValue(): string {
  const secret = sessionSecret()
  if (!secret) throw new Error("Falta ADMIN_SESSION_SECRET (o SUPABASE_SERVICE_ROLE_KEY)")
  const payload = String(Date.now() + SESSION_TTL_MS)
  return `${payload}.${sign(payload, secret)}`
}

export function isValidAdminSessionValue(value: string | undefined | null): boolean {
  const secret = sessionSecret()
  if (!secret || !value) return false
  const [payload, signature] = value.split(".")
  if (!payload || !signature || !/^\d+$/.test(payload) || Number(payload) < Date.now()) return false
  const expected = Buffer.from(sign(payload, secret), "hex")
  const given = Buffer.from(signature, "hex")
  return expected.length === given.length && timingSafeEqual(expected, given)
}

/**
 * Verifica que la solicitud provenga de un administrador autenticado.
 * - Primero comprueba la cookie httpOnly `admin_session` (navegador/SSR).
 * - Como fallback para clientes que pasen la cookie manualmente en la cabecera
 *   `Cookie`, también se acepta vía el header estándar.
 *
 * Devuelve:
 *   - `null`          → solicitud autenticada, continuar con la lógica de la ruta.
 *   - `NextResponse`  → 401 Unauthorized, devolver inmediatamente.
 */
export async function requireAdminAuth(
  _request?: NextRequest,
): Promise<NextResponse | null> {
  const cookieStore = await cookies()
  const session = cookieStore.get(COOKIE_NAME)

  if (isValidAdminSessionValue(session?.value)) {
    return null // autenticado
  }

  return NextResponse.json(
    { error: "No autorizado", code: "UNAUTHORIZED" },
    { status: 401 },
  )
}

/**
 * Versión síncrona para uso en proxy.ts / middleware donde `cookies()` no
 * está disponible — lee directamente el header Cookie del request.
 */
export function requireAdminAuthFromRequest(request: NextRequest): NextResponse | null {
  const cookie = request.cookies.get(COOKIE_NAME)
  if (isValidAdminSessionValue(cookie?.value)) return null
  return NextResponse.json(
    { error: "No autorizado", code: "UNAUTHORIZED" },
    { status: 401 },
  )
}

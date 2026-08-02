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

const COOKIE_NAME = "admin_session"
const COOKIE_VALUE = "authenticated"

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

  if (session?.value === COOKIE_VALUE) {
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
  if (cookie?.value === COOKIE_VALUE) return null
  return NextResponse.json(
    { error: "No autorizado", code: "UNAUTHORIZED" },
    { status: 401 },
  )
}

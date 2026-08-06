import { type NextRequest, NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/admin-auth"

/**
 * Verifica si la sesión de admin (cookie httpOnly `admin_session`) es válida.
 * Devuelve 200 { authenticated: true } o 401.
 * Lo consume el layout del panel para decidir si muestra el contenido o
 * redirige al login.
 */
export async function GET(request: NextRequest) {
  const authError = await requireAdminAuth(request)
  if (authError) return authError
  return NextResponse.json({ authenticated: true })
}

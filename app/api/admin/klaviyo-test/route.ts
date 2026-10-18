import { type NextRequest, NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/admin-auth"
import { klaviyoConfigured, klaviyoTrack } from "@/lib/klaviyo"

export const dynamic = "force-dynamic"

/**
 * GET /api/admin/klaviyo-test?email=tu@correo.com
 *
 * Comprueba la conexion con Klaviyo: envia un evento de prueba ("Prueba de conexion Semzo") para ese
 * correo. Solo admin. No muestra la clave ni suscribe a nadie. Despues, en Klaviyo → Audiencia →
 * Perfiles, el perfil debe aparecer con ese evento en su actividad.
 */
export async function GET(request: NextRequest) {
  const authError = await requireAdminAuth()
  if (authError) return authError

  const email = request.nextUrl.searchParams.get("email")?.trim()
  if (!klaviyoConfigured()) {
    return NextResponse.json({ configured: false, message: "Falta la variable KLAVIYO_PRIVATE_API_KEY en Vercel (o hay que volver a desplegar)." })
  }
  if (!email) {
    return NextResponse.json({ configured: true, message: "Añade ?email=tu@correo.com a la dirección para enviar el evento de prueba." })
  }

  const result = await klaviyoTrack({
    email,
    metric: "Prueba de conexion Semzo",
    properties: { origen: "admin" },
    uniqueId: `klaviyo-test:${email}:${Date.now()}`,
  })
  return NextResponse.json({ configured: true, ...result })
}

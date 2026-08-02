import { NextResponse } from "next/server"
import { CorreosAPI } from "@/lib/correos-api"
import { requireAdminAuth } from "@/lib/admin-auth"

/**
 * POST /api/admin/logistics/correos/test
 * Prueba la conexion con Correos a traves del proxy en VPS.
 * Ya no requiere body con credenciales: el proxy las gestiona.
 */
export async function POST() {
  const authError = await requireAdminAuth()
  if (authError) return authError
  try {
    const correos = new CorreosAPI()
    const result = await correos.testConnection()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error testing Correos connection:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Error al probar conexion",
      },
      { status: 500 },
    )
  }
}

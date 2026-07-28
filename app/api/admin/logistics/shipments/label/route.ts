import { type NextRequest, NextResponse } from "next/server"
import { CorreosAPI } from "@/lib/correos-api"

/**
 * GET /api/admin/logistics/shipments/label?package_code=XXX
 * Obtener etiqueta PDF de un envio (via proxy Correos).
 *
 * Parametros aceptados (en orden de preferencia):
 *   package_code   — packageCode del paquete (identificador correcto para Labels API)
 *   tracking_number — alias legado; se acepta para compatibilidad pero internamente
 *                     se usa como packageCode si no se proporciona package_code.
 *
 * NOTA: la Labels API de Correos solo imprime usando packageCode, no shipmentCode.
 * Si la etiqueta se creo con la nueva version de correos-api.ts, el packageCode
 * esta disponible en correos_response.packageCode dentro de la tabla shipments.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    // Preferir package_code; caer a tracking_number para compatibilidad con
    // envios creados antes de este cambio.
    const packageCode = searchParams.get("package_code") || searchParams.get("tracking_number")
    if (!packageCode) {
      return NextResponse.json(
        { error: "package_code is required" },
        { status: 400 },
      )
    }

    const correosClient = new CorreosAPI()
    const labelBuffer = await correosClient.getLabel(packageCode)

    return new NextResponse(labelBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="etiqueta-${packageCode}.pdf"`,
      },
    })
  } catch (error) {
    console.error("[Logistics API] Error getting label:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al obtener etiqueta" },
      { status: 500 },
    )
  }
}

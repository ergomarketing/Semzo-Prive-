import { type NextRequest, NextResponse } from "next/server"
import { CorreosAPI, isCorreosProxyConfigured } from "@/lib/correos-api"

/**
 * GET /api/admin/logistics/shipments/label?package_code=XXX
 * Obtener etiqueta PDF de un envio (via proxy Correos).
 *
 * Parametros aceptados (en orden de preferencia):
 *   package_code    — packageCode del paquete (identificador correcto para la Labels API).
 *   tracking_number — alias legado aceptado por compatibilidad con envios anteriores.
 *
 * Internamente llama a CorreosAPI.getLabel(packageCode), que envia:
 *   POST /api/correos/label  { packageCodes: [packageCode], labelFormat: "PDF" }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    // Preferir package_code; caer a tracking_number para envios creados antes
    // de que se introdujera el campo packageCode.
    const packageCode = searchParams.get("package_code") || searchParams.get("tracking_number")
    if (!packageCode) {
      return NextResponse.json({ error: "package_code is required" }, { status: 400 })
    }

    if (!isCorreosProxyConfigured()) {
      return NextResponse.json(
        {
          error:
            "La integracion con Correos no esta configurada. Anade las variables CORREOS_PROXY_URL y CORREOS_PROXY_API_KEY en el proyecto.",
          code: "CORREOS_PROXY_NOT_CONFIGURED",
        },
        { status: 503 },
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

import { type NextRequest, NextResponse } from "next/server"
import { CorreosAPI, isCorreosProxyConfigured } from "@/lib/correos-api"
import { requireAdminAuth } from "@/lib/admin-auth"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

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
  const authError = await requireAdminAuth()
  if (authError) return authError
  try {
    const searchParams = request.nextUrl.searchParams
    const rawParam = searchParams.get("package_code") || searchParams.get("tracking_number")

    if (!rawParam) {
      return NextResponse.json({ error: "package_code is required" }, { status: 400 })
    }

    // Resolver el packageCode real desde la BD.
    // Si el caller ya pasó un package_code explícito lo usamos directamente.
    // Si pasó un tracking_number (codEnvio), buscamos el package_code guardado
    // en la columna dedicada — que puede diferir del tracking_number.
    let packageCode = rawParam
    const isExplicitPackageCode = searchParams.has("package_code")

    if (!isExplicitPackageCode) {
      const { data: shipment } = await supabase
        .from("shipments")
        .select("package_code, return_package_code, tracking_number, return_tracking_number")
        .or(`tracking_number.eq.${rawParam},return_tracking_number.eq.${rawParam}`)
        .maybeSingle()

      if (shipment) {
        // Determinar si el tracking_number corresponde al envío de ida o retorno
        const isReturn = shipment.return_tracking_number === rawParam
        const resolvedCode = isReturn ? shipment.return_package_code : shipment.package_code
        if (resolvedCode) {
          packageCode = resolvedCode
        }
        // Si no hay package_code en BD, usamos rawParam como fallback
      }
    }

    if (!isCorreosProxyConfigured()) {
      return NextResponse.json(
        {
          error: "La integracion con Correos no esta configurada. Anade CORREOS_PROXY_URL y CORREOS_PROXY_API_KEY en las variables de entorno del proyecto.",
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

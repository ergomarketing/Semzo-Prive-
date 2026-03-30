import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { CorreosAPI } from "@/lib/correos-api"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/admin/logistics/shipments/label?tracking_number=XXX
 * Obtener etiqueta PDF de un envío de Correos
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const trackingNumber = searchParams.get("tracking_number")

    if (!trackingNumber) {
      return NextResponse.json({ error: "tracking_number is required" }, { status: 400 })
    }

    // Obtener credenciales de Correos
    const { data: correosSettings } = await supabase
      .from("logistics_settings")
      .select("api_credentials, is_enabled")
      .eq("carrier_name", "Correos")
      .single()

    if (!correosSettings?.api_credentials || !correosSettings.is_enabled) {
      return NextResponse.json({ error: "Correos no está configurado" }, { status: 400 })
    }

    const { clientId, clientSecret } = correosSettings.api_credentials as {
      clientId: string
      clientSecret: string
    }

    const correosClient = new CorreosAPI({ clientId, clientSecret })
    const labelBuffer = await correosClient.getLabel(trackingNumber)

    return new NextResponse(labelBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="etiqueta-${trackingNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error("[Logistics API] Error getting label:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al obtener etiqueta" },
      { status: 500 }
    )
  }
}

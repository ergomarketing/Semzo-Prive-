import { type NextRequest, NextResponse } from "next/server"
import { CorreosAPI } from "@/lib/correos-api"

/**
 * GET /api/admin/logistics/shipments/label?tracking_number=XXX
 * Obtener etiqueta PDF de un envio (via proxy Correos).
 */
export async function GET(request: NextRequest) {
  try {
    const trackingNumber = request.nextUrl.searchParams.get("tracking_number")
    if (!trackingNumber) {
      return NextResponse.json({ error: "tracking_number is required" }, { status: 400 })
    }

    const correosClient = new CorreosAPI()
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
      { status: 500 },
    )
  }
}

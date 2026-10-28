import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { CorreosAPI, isCorreosProxyConfigured } from "@/lib/correos-api"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

/**
 * Etiqueta de devolucion de Correos (PDF) de una reserva. La usan el enlace firmado del correo
 * (/api/return-label) y el panel de la socia (/api/user/return-label); cada ruta valida antes quien pide la etiqueta.
 */
export async function returnLabelPdfResponse(reservationId: string, opts: { download?: boolean } = {}) {
  if (!isCorreosProxyConfigured()) {
    return new NextResponse("La etiqueta no está disponible ahora mismo. Escríbenos a info@semzoprive.com.", { status: 503 })
  }

  const { data: shipment } = await supabase
    .from("shipments")
    .select("return_package_code, return_label_url")
    .eq("reservation_id", reservationId)
    .not("return_tracking_number", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (shipment?.return_label_url) return NextResponse.redirect(shipment.return_label_url)
  if (!shipment?.return_package_code) {
    return new NextResponse("No encontramos tu etiqueta. Escríbenos a info@semzoprive.com.", { status: 404 })
  }

  try {
    const pdf = await new CorreosAPI().getLabel(shipment.return_package_code)
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${opts.download ? "attachment" : "inline"}; filename="Etiqueta-devolucion-SEMZO.pdf"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    console.error("[return-label] No se pudo obtener la etiqueta de Correos:", err)
    return new NextResponse("No hemos podido generar tu etiqueta. Escríbenos a info@semzoprive.com.", { status: 502 })
  }
}

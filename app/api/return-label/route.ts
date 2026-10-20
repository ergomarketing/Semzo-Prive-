import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { CorreosAPI, isCorreosProxyConfigured } from "@/lib/correos-api"
import { verifyReturnLabelToken } from "@/lib/return-label-link"

export const dynamic = "force-dynamic"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

/**
 * GET /api/return-label?r=<reserva>&e=<caducidad>&t=<firma>
 * Descarga la etiqueta de devolucion de Correos (PDF) de una reserva. El enlace va en el correo "Tu paquete te
 * esta esperando"; esta firmado y caduca a los 30 dias, asi que no hace falta iniciar sesion.
 */
export async function GET(req: NextRequest) {
  const reservationId = req.nextUrl.searchParams.get("r") || ""
  const expires = Number(req.nextUrl.searchParams.get("e"))
  const token = req.nextUrl.searchParams.get("t") || ""
  if (!verifyReturnLabelToken(reservationId, expires, token)) {
    return new NextResponse("Enlace no válido o caducado. Escríbenos a info@semzoprive.com.", { status: 403 })
  }
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
        "Content-Disposition": 'inline; filename="Etiqueta-devolucion-SEMZO.pdf"',
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    console.error("[return-label] No se pudo obtener la etiqueta de Correos:", err)
    return new NextResponse("No hemos podido generar tu etiqueta. Escríbenos a info@semzoprive.com.", { status: 502 })
  }
}

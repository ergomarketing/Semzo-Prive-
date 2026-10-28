import { type NextRequest, NextResponse } from "next/server"
import { verifyReturnLabelToken } from "@/lib/return-label-link"
import { returnLabelPdfResponse } from "@/lib/return-label-pdf"

export const dynamic = "force-dynamic"

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
  return returnLabelPdfResponse(reservationId)
}

import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * POST /api/user/ownership/complete — RETIRADA.
 *
 * Cobraba a la tarjeta guardada sin pasar por Stripe Checkout. Con importes altos
 * (p. ej. 4.500 €) falla por autenticacion del banco y no permite pagar a plazos
 * (Klarna, Scalapay, seQura). La compra se hace ahora con
 * POST /api/user/ownership/checkout y se cierra con lib/ownership-sale-close.ts.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Esta ruta ya no está disponible. Usa el pago desde tu panel.", code: "deprecated" },
    { status: 410 },
  )
}

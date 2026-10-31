import { timingSafeEqual } from "node:crypto"

/**
 * Autorizacion de los cron de Vercel: la cabecera "Authorization: Bearer <CRON_SECRET>".
 * Falla CERRADO: si CRON_SECRET no esta configurado, nadie pasa (antes algunas rutas quedaban abiertas
 * y otras aceptaban "Bearer undefined").
 */
export function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error("[cron] CRON_SECRET no configurado: peticion rechazada")
    return false
  }
  const received = Buffer.from(request.headers.get("authorization") || "")
  const expected = Buffer.from(`Bearer ${secret}`)
  return received.length === expected.length && timingSafeEqual(received, expected)
}

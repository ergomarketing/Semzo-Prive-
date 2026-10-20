/**
 * Enlace firmado para descargar la etiqueta de devolucion de Correos desde un correo (sin iniciar sesion).
 * El token liga la reserva a una fecha de caducidad con HMAC; solo el servidor puede generarlo.
 */
import { createHmac, timingSafeEqual } from "crypto"

const TTL_DAYS = 30

function secret(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.CRON_SECRET || "semzo-label"
}

function sign(reservationId: string, expires: number): string {
  return createHmac("sha256", secret()).update(`${reservationId}.${expires}`).digest("hex").slice(0, 40)
}

export function buildReturnLabelUrl(reservationId: string, siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://semzoprive.com"): string {
  const expires = Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000
  return `${siteUrl}/api/return-label?r=${encodeURIComponent(reservationId)}&e=${expires}&t=${sign(reservationId, expires)}`
}

export function verifyReturnLabelToken(reservationId: string, expires: number, token: string): boolean {
  if (!reservationId || !Number.isFinite(expires) || expires < Date.now() || !token) return false
  const expected = Buffer.from(sign(reservationId, expires))
  const given = Buffer.from(token)
  return expected.length === given.length && timingSafeEqual(expected, given)
}

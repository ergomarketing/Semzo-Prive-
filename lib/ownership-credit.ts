/**
 * Reglas del Private Purchase Credit (Modo Colecciona).
 * Fuente: Términos y Condiciones, cláusula 18 — el crédito está limitado al
 * 20% del precio de venta del artículo y no es dinero.
 */
export const CREDIT_CAP_RATIO = 0.2

export const COLECCIONA_PURCHASE_DOCUMENT = "Condiciones de compra Colecciona"
export const COLECCIONA_PURCHASE_VERSION = "v1"

const roundCents = (value: number) => Math.round(value * 100) / 100

/** Crédito máximo aplicable para un precio de compra dado. */
export function getCreditCap(purchasePrice: number): number {
  return roundCents(Math.max(0, purchasePrice) * CREDIT_CAP_RATIO)
}

/** Crédito realmente aplicable: lo acumulado, sin superar el tope del 20%. */
export function getAppliedCredit(accumulated: number, purchasePrice: number): number {
  return roundCents(Math.min(Math.max(0, accumulated), getCreditCap(purchasePrice)))
}

/** Importe que se cobra a la socia al finalizar la compra. */
export function getAmountDue(accumulated: number, purchasePrice: number): number {
  return roundCents(Math.max(0, purchasePrice - getAppliedCredit(accumulated, purchasePrice)))
}

/**
 * Reglas del Private Purchase Credit (Modo Colecciona). REGLA DEFINITIVA (Erika, 2026-10-31):
 * se acumula el 100 % de las cuotas de membresía pagadas, pero al comprar el crédito solo puede
 * descontar hasta el 20 % del precio de venta del bolso elegido. Así nunca se compra un bolso por 0 €.
 */
export const MAX_CREDIT_DISCOUNT_RATE = 0.2

export const COLECCIONA_CREDIT_CAP_LABEL = "el 20 % del precio de venta del bolso elegido"

const roundCents = (value: number) => Math.round(value * 100) / 100

/** Descuento máximo permitido para un bolso: el 20 % de su precio de venta. */
export function getMaxCredit(purchasePrice: number): number {
  return roundCents(Math.max(0, purchasePrice) * MAX_CREDIT_DISCOUNT_RATE)
}

/** Crédito aplicable en la compra: lo acumulado, sin superar el 20 % del precio del bolso. */
export function getAppliedCredit(accumulated: number, purchasePrice: number): number {
  return roundCents(Math.min(Math.max(0, accumulated), getMaxCredit(purchasePrice)))
}

/** Importe que se cobra a la socia al finalizar la compra (nunca menos del 80 % del precio). */
export function getAmountDue(accumulated: number, purchasePrice: number): number {
  return roundCents(Math.max(0, purchasePrice - getAppliedCredit(accumulated, purchasePrice)))
}

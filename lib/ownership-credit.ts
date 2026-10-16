/**
 * Reglas del Private Purchase Credit (Modo Colecciona).
 * Cada cuota pagada se acumula entera hacia el precio del bolso (ver webhook de Stripe).
 * Al finalizar la compra se cobra precio - acumulado; si ya está todo acumulado, 1 € simbólico.
 */
export const SYMBOLIC_AMOUNT = 1

export const COLECCIONA_PURCHASE_DOCUMENT = "Condiciones de compra Colecciona"
export const COLECCIONA_PURCHASE_VERSION = "v1"

const roundCents = (value: number) => Math.round(value * 100) / 100

/** Crédito aplicable: lo acumulado, sin superar el precio del bolso. */
export function getAppliedCredit(accumulated: number, purchasePrice: number): number {
  return roundCents(Math.min(Math.max(0, accumulated), Math.max(0, purchasePrice)))
}

/** Importe que se cobra a la socia al finalizar la compra. */
export function getAmountDue(accumulated: number, purchasePrice: number): number {
  const difference = roundCents(Math.max(0, purchasePrice - getAppliedCredit(accumulated, purchasePrice)))
  return difference > 0 ? difference : SYMBOLIC_AMOUNT
}

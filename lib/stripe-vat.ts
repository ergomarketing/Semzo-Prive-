import type Stripe from "stripe"

const VAT_21_TAG = "semzo_vat_21_inclusive"

/**
 * Tipo de IVA del 21 % INCLUIDO en el precio (los precios de Semzo ya llevan IVA). Se busca el que ya
 * exista (marcado por metadata) y, si no hay, se crea una sola vez. Asi la factura de Stripe desglosa
 * base imponible + IVA sin que haya que configurar nada a mano en el Dashboard.
 */
export async function ensureInclusiveVat21(stripe: Stripe): Promise<string> {
  const existing = await stripe.taxRates.list({ active: true, inclusive: true, limit: 100 })
  const found = existing.data.find(
    (rate) => rate.metadata?.[VAT_21_TAG] === "1" || (rate.percentage === 21 && rate.country === "ES"),
  )
  if (found) return found.id

  const created = await stripe.taxRates.create({
    display_name: "IVA",
    description: "IVA 21 %",
    percentage: 21,
    inclusive: true,
    country: "ES",
    jurisdiction: "ES",
    metadata: { [VAT_21_TAG]: "1" },
  })
  return created.id
}

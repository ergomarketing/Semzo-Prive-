/**
 * Precios de Stripe de las membresias: UNICA lista que el servidor acepta al crear un checkout de suscripcion.
 * Antes el servidor creia el priceId y el membershipType que mandaba el navegador: se podia pagar el precio mas barato
 * (o cualquier otro precio de la cuenta de Stripe) y recibir una membresia superior.
 * Si se crea o cambia un precio en Stripe, hay que actualizarlo aqui (y en los mapas del carrito y de la mejora de plan).
 */
export type MembershipPriceInfo = {
  type: "petite" | "essentiel" | "signature" | "prive"
  /** Ciclos de facturacion con los que el carrito usa este precio. El primero es el real. */
  cycles: string[]
}

export const MEMBERSHIP_PRICES: Record<string, MembershipPriceInfo> = {
  price_1Sx92xKBSKEgBoTnoZwPvKI8: { type: "petite", cycles: ["weekly", "monthly"] },
  price_1RP4LyKBSKEgBoTnJQobCsjs: { type: "essentiel", cycles: ["monthly", "weekly"] },
  price_1SxPFdKBSKEgBoTnUvzx5avc: { type: "essentiel", cycles: ["quarterly"] },
  price_1TMTLrKBSKEgBoTnu7JZzNty: { type: "signature", cycles: ["monthly", "weekly"] },
  price_1TMTUrKBSKEgBoTnBT60oMX0: { type: "signature", cycles: ["quarterly"] },
  price_1TMTIiKBSKEgBoTnJiVwAkWT: { type: "prive", cycles: ["monthly", "weekly"] },
  price_1TMTVlKBSKEgBoTn0vyFQQ4l: { type: "prive", cycles: ["quarterly"] },
}

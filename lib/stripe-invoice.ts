import type Stripe from "stripe"

/**
 * Id de la suscripcion de una factura. Stripe lo envia de dos formas segun la
 * version de API del webhook:
 *  - clasica: invoice.subscription
 *  - nueva (basil, 2025-03-31 en adelante): invoice.parent.subscription_details.subscription
 *    (y en invoice.lines.data[n]).
 * Tu webhook de produccion recibe la forma NUEVA (comprobado con el evento real
 * invoice.payment_succeeded de la renovacion de Irene, 29-sep-2026). Si solo se lee
 * invoice.subscription, el codigo sale sin hacer nada y sin error visible.
 */
export function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  type Ref = string | { id?: string } | null | undefined
  const inv = invoice as unknown as {
    subscription?: Ref
    parent?: { subscription_details?: { subscription?: Ref } | null } | null
    lines?: {
      data?: Array<{
        subscription?: Ref
        parent?: { subscription_item_details?: { subscription?: Ref } | null } | null
      }>
    }
  }
  const pick = (value: Ref): string | null => (typeof value === "string" ? value : value?.id ?? null)
  const firstLine = inv.lines?.data?.[0]
  return (
    pick(inv.subscription) ??
    pick(inv.parent?.subscription_details?.subscription) ??
    pick(firstLine?.subscription) ??
    pick(firstLine?.parent?.subscription_item_details?.subscription) ??
    null
  )
}

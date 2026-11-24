import type Stripe from "stripe"
import { getServiceClient } from "@/lib/supabase-service"

/**
 * Devuelve un stripe_customer_id valido para la usuaria.
 *
 * - Sin id guardado: crea el cliente en Stripe y lo guarda en el perfil.
 * - Con id guardado: comprueba que existe en la cuenta de Stripe. Si Stripe dice que no existe
 *   (borrado, o creado con otra clave/modo), crea uno nuevo y lo guarda, en vez de fallar el pago
 *   con "No such customer".
 *
 * La sustitucion de un id que no existe SOLO se hace en produccion (VERCEL_ENV=production, clave live).
 * En local o en vistas previas la clave puede ser de otro modo y no debe sobrescribir ids reales del perfil:
 * ahi se deja el id y el error de Stripe sale como siempre.
 *
 * Cualquier otro error de Stripe (red, clave...) se propaga sin tocar el perfil.
 */
export async function getValidStripeCustomerId(
  stripe: Stripe,
  opts: {
    userId: string
    existingId?: string | null
    email?: string | null
    name?: string | null
    phone?: string | null
    metadata?: Record<string, string>
  },
): Promise<string> {
  const { userId, existingId } = opts

  if (existingId) {
    if (process.env.VERCEL_ENV !== "production") return existingId
    try {
      const found = await stripe.customers.retrieve(existingId)
      if (!("deleted" in found && found.deleted)) return existingId
      console.warn("[stripe-customer] cliente borrado en Stripe, se crea uno nuevo", { userId, existingId })
    } catch (err: any) {
      if (err?.code !== "resource_missing") throw err
      console.warn("[stripe-customer] cliente inexistente en Stripe, se crea uno nuevo", { userId, existingId })
    }
  }

  const customer = await stripe.customers.create({
    email: opts.email || undefined,
    name: opts.name || undefined,
    phone: opts.phone || undefined,
    metadata: { supabase_user_id: userId, ...(opts.metadata || {}) },
  })

  await getServiceClient().from("profiles").update({ stripe_customer_id: customer.id }).eq("id", userId)
  return customer.id
}

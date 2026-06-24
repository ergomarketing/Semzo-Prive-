import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Cliente Stripe para resolver el payment method por defecto de la
// suscripcion y espejar last4 + brand en user_memberships.
const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
})

/**
 * Resuelve los datos del payment method por defecto de la suscripcion
 * (o del customer si no existe en la subscription) y los devuelve listos
 * para guardar en user_memberships. Robusto a fallos: si Stripe no
 * responde, devolvemos null para no bloquear la activacion.
 */
async function resolvePaymentMethodFromStripe(
  subscription: Stripe.Subscription,
): Promise<{
  customerId: string | null
  paymentMethodId: string | null
  last4: string | null
  brand: string | null
  verified: boolean
}> {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id || null

  // 1) Intentar default_payment_method de la subscripcion
  let paymentMethodId: string | null =
    typeof subscription.default_payment_method === "string"
      ? subscription.default_payment_method
      : subscription.default_payment_method?.id || null

  // 2) Si no hay, ir al invoice_settings.default_payment_method del customer
  if (!paymentMethodId && customerId) {
    try {
      const customer = await stripeClient.customers.retrieve(customerId)
      if (!("deleted" in customer) || !customer.deleted) {
        const invoiceDefault = (customer as Stripe.Customer).invoice_settings
          ?.default_payment_method
        paymentMethodId =
          typeof invoiceDefault === "string"
            ? invoiceDefault
            : invoiceDefault?.id || null
      }
    } catch (err) {
      console.log("[ORCHESTRATOR PM] customers.retrieve failed:", (err as Error).message)
    }
  }

  if (!paymentMethodId) {
    return { customerId, paymentMethodId: null, last4: null, brand: null, verified: false }
  }

  // 3) Recuperar detalles del payment method (last4, brand)
  try {
    const pm = await stripeClient.paymentMethods.retrieve(paymentMethodId)
    const card = pm.card
    return {
      customerId,
      paymentMethodId,
      last4: card?.last4 || null,
      brand: card?.brand || null,
      verified: true,
    }
  } catch (err) {
    console.log("[ORCHESTRATOR PM] paymentMethods.retrieve failed:", (err as Error).message)
    return { customerId, paymentMethodId, last4: null, brand: null, verified: true }
  }
}

function safeTimestamp(epoch: number | null | undefined): string {
  if (epoch === null || epoch === undefined || isNaN(epoch)) {
    return new Date().toISOString()
  }
  const d = new Date(epoch * 1000)
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
}

function mapStripeStatus(stripeStatus: string): string {
  switch (stripeStatus) {
    case "active":
      return "active"
    case "past_due":
      return "past_due"
    case "canceled":
    case "unpaid":
    case "incomplete_expired":
      return "canceled"
    default:
      return "canceled"
  }
}

/**
 * syncMembershipFromStripe
 * Fuente única de verdad: Stripe subscription → user_memberships
 * NO toca: membership_intents, identity_verified, emails, notificaciones
 */
export async function syncMembershipFromStripe(
  subscription: Stripe.Subscription
): Promise<{ success: boolean; error?: string }> {
  const userId = subscription.metadata?.user_id
  const membershipType = subscription.metadata?.membership_type || "petite"

  if (!userId) {
    return { success: false, error: "Missing user_id in subscription metadata" }
  }

  const status = mapStripeStatus(subscription.status)

  // Derivar billing_cycle: Petite siempre es weekly, el resto monthly
  const billingCycle: string =
    subscription.metadata?.billing_cycle ||
    (membershipType === "petite" ? "weekly" : "monthly")

  const startDate = new Date(subscription.current_period_start * 1000)
  // Siempre usar el current_period_end real de Stripe, independientemente del billing_cycle.
  // Petite es mensual en Stripe aunque internamente manejemos pases semanales.
  const endDate = new Date(subscription.current_period_end * 1000)

  // Si Stripe reporta activa/trialing, abrimos can_make_reservations.
  // Para otros estados, lo dejamos en false (default seguro).
  const isStripeActive =
    subscription.status === "active" || subscription.status === "trialing"

  // Espejar payment method de Stripe -> user_memberships. Necesario para
  // poder cobrar incidencias (no devolucion, daños) sin tener que ir al
  // dashboard de Stripe a buscar la tarjeta. Antes solo se guardaba en el
  // flujo de gift card 100%; ahora tambien en el flujo Stripe normal y mixto.
  const pm = await resolvePaymentMethodFromStripe(subscription)

  // ===== EVALUAR LAS 3 CONDICIONES ANTES DEL UPSERT =====
  // Regla de negocio (esqueleto del pago): una membresia NUNCA queda "active"
  // ni abre reservas hasta cumplir: pago OK (Stripe) + identidad verificada +
  // mandato SEPA. Se evalua ANTES del upsert para que el estado escrito ya
  // sea el correcto (antes se abria can_make_reservations solo con el pago).

  // Condicion 1: pago OK (fuente: Stripe)
  const paymentOk = isStripeActive

  // Condicion 2: identidad verificada (fuente: identity_verifications)
  const { data: identityRecord } = await supabase
    .from("identity_verifications")
    .select("status")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  const hasIdentityVerified =
    identityRecord?.status === "verified" || identityRecord?.status === "approved"

  // Condicion 3: mandato SEPA (fuente: profiles.sepa_payment_method_id)
  const { data: profilePayment } = await supabase
    .from("profiles")
    .select("sepa_payment_method_id")
    .eq("id", userId)
    .single()

  const hasSepaMandate = !!profilePayment?.sepa_payment_method_id

  const allConditionsMet = paymentOk && hasIdentityVerified && hasSepaMandate

  // status final:
  // - 3 condiciones OK            -> "active"
  // - pago OK pero falta id/SEPA  -> "pending_verification" (NO abre reservas)
  // - resto                       -> status mapeado de Stripe (past_due, canceled...)
  const finalStatus = allConditionsMet ? "active" : paymentOk ? "pending_verification" : status

  console.log("[ORCHESTRATOR CHECK] condiciones de activacion:", {
    userId,
    payment_ok: paymentOk,
    identity_verified_ok: hasIdentityVerified,
    sepa_mandate_ok: hasSepaMandate,
    all_conditions_met: allConditionsMet,
    final_status: finalStatus,
  })

  const upsertPayload: Record<string, unknown> = {
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: pm.customerId,
    membership_type: membershipType,
    billing_cycle: billingCycle,
    status: finalStatus,
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    can_make_reservations: allConditionsMet,
    updated_at: new Date().toISOString(),
  }

  if (pm.paymentMethodId) {
    upsertPayload.stripe_payment_method_id = pm.paymentMethodId
    upsertPayload.payment_method_verified = pm.verified
    if (pm.last4) upsertPayload.payment_method_last4 = pm.last4
    if (pm.brand) upsertPayload.payment_method_brand = pm.brand
  }

  // onConflict: user_id es la UNIQUE key real de la tabla (un usuario = una
  // membresia). Asi un usuario que recontrata con una NUEVA suscripcion Stripe
  // actualiza su fila existente en vez de chocar con la unique de user_id.
  const { error } = await supabase
    .from("user_memberships")
    .upsert(upsertPayload, { onConflict: "user_id" })

  if (error) {
    return { success: false, error: error.message }
  }

  if (allConditionsMet) {
    console.log("[ORCHESTRATOR] Membresia ACTIVA (pago + identidad + SEPA) para userId:", userId)
  }

  return { success: true }
}

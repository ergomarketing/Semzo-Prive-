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
  const endDate =
    billingCycle === "weekly"
      ? new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      : new Date(subscription.current_period_end * 1000)

  // Si Stripe reporta activa/trialing, abrimos can_make_reservations.
  // Para otros estados, lo dejamos en false (default seguro).
  const isStripeActive =
    subscription.status === "active" || subscription.status === "trialing"

  // Espejar payment method de Stripe -> user_memberships. Necesario para
  // poder cobrar incidencias (no devolucion, daños) sin tener que ir al
  // dashboard de Stripe a buscar la tarjeta. Antes solo se guardaba en el
  // flujo de gift card 100%; ahora tambien en el flujo Stripe normal y mixto.
  const pm = await resolvePaymentMethodFromStripe(subscription)

  const upsertPayload: Record<string, unknown> = {
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: pm.customerId,
    membership_type: membershipType,
    billing_cycle: billingCycle,
    status,
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    can_make_reservations: isStripeActive,
    updated_at: new Date().toISOString(),
  }

  if (pm.paymentMethodId) {
    upsertPayload.stripe_payment_method_id = pm.paymentMethodId
    upsertPayload.payment_method_verified = pm.verified
    if (pm.last4) upsertPayload.payment_method_last4 = pm.last4
    if (pm.brand) upsertPayload.payment_method_brand = pm.brand
  }

  const { error } = await supabase
    .from("user_memberships")
    .upsert(upsertPayload, { onConflict: "stripe_subscription_id" })

  if (error) {
    return { success: false, error: error.message }
  }

  // --- ACTIVACION AUTOMATICA DE MEMBRESIA ---
  // Verificar condiciones usando FUENTES DE VERDAD correctas
  
  // Condicion 1: pago OK (ya verificado: status viene de Stripe)
  const hasActiveMembership = status === "active" || subscription.status === "trialing"

  // Condicion 2: identidad verificada (FUENTE DE VERDAD: identity_verifications)
  const { data: identityRecord } = await supabase
    .from("identity_verifications")
    .select("status")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  const hasIdentityVerified = identityRecord?.status === "verified" || identityRecord?.status === "approved"

  // Condicion 3: mandato SEPA (dato de pago en profiles, aceptable)
  const { data: profilePayment } = await supabase
    .from("profiles")
    .select("sepa_payment_method_id")
    .eq("id", userId)
    .single()

  const hasSepaMandate = !!profilePayment?.sepa_payment_method_id

  // Condicion 4: no duplicar activacion (leer de user_memberships)
  const { data: currentMembership } = await supabase
    .from("user_memberships")
    .select("status")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  const isNotAlreadyActive = currentMembership?.status !== "active"

  console.log("[ORCHESTRATOR CHECK] Evaluando condiciones de activacion:", {
    userId,
    payment_ok: hasActiveMembership,
    identity_verified_ok: hasIdentityVerified,
    sepa_mandate_ok: hasSepaMandate,
    current_status: currentMembership?.status,
    is_not_already_active: isNotAlreadyActive,
    should_activate: hasActiveMembership && hasIdentityVerified && hasSepaMandate && isNotAlreadyActive,
  })

  const shouldActivate =
    hasActiveMembership &&
    hasIdentityVerified &&
    hasSepaMandate &&
    isNotAlreadyActive

  if (shouldActivate) {
    // Activar en user_memberships (FUENTE DE VERDAD)
    // can_make_reservations: true → habilita el gate de reservas.
    // Sin esto, la membresia queda activa pero el endpoint
    // /api/user/reservations bloquea al usuario.
    const { error: activationError } = await supabase
      .from("user_memberships")
      .update({
        status: "active",
        can_make_reservations: true,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)

    if (activationError) {
      console.log("[ORCHESTRATOR ERROR] Fallo al activar membresia:", {
        userId,
        error: activationError.message,
        code: activationError.code,
      })
      return { success: false, error: activationError.message }
    }

    console.log("[ORCHESTRATOR] Membresia activada para userId:", userId)
  }

  return { success: true }
}

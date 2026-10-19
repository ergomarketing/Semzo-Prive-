import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"
import { enrollLifecycleSequence } from "@/lib/lifecycle-emails/enroll"
import { isIdentityVerified } from "@/lib/identity-status"
import { sendMembershipActivatedEmails } from "@/lib/membership-activated-email"
import { klaviyoTrackForUser } from "@/lib/klaviyo"
import { cancelPendingLifecycle } from "@/lib/lifecycle-emails/enroll"

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
 * Solo toca membership_intents para cerrar el intent cuando la membresia pasa a "active".
 * NO toca: identity_verified, emails, notificaciones
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
  const hasIdentityVerified = await isIdentityVerified(supabase, userId)

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
  }

  // Guard de idempotencia para el onboarding post-activacion (Fase 3): solo
  // se enrola la PRIMERA vez que la membresia llega a "active". Se lee ANTES
  // del upsert para saber si ya se habia enrolado en una activacion anterior.
  let shouldStartOnboarding = false
  // Correo "membresia activa": solo cuando pasa a 'active' desde otro estado (no en cada resync).
  let becameActive = false
  let isReturningMember = false
  if (allConditionsMet) {
    const { data: existingMembership } = await supabase
      .from("user_memberships")
      .select("onboarding_sequence_started_at, status")
      .eq("user_id", userId)
      .maybeSingle()

    // Solo altas nuevas, pendientes de verificar y reincorporaciones. NO la recuperacion de
    // un impago (past_due -> active) ni un resync de una membresia que ya estaba activa.
    const previousStatus = existingMembership?.status
    becameActive =
      !previousStatus ||
      ["pending_verification", "cancelled", "canceled", "expired", "incomplete"].includes(previousStatus)
    // Socia que VUELVE (tenia una membresia que se cancelo o caduco): no es nueva, no se le manda la
    // bienvenida de onboarding. (Antes solo se miraba onboarding_sequence_started_at, que en membresias
    // antiguas estaba vacio.)
    isReturningMember = !!previousStatus && ["cancelled", "canceled", "expired"].includes(previousStatus)

    if (!existingMembership?.onboarding_sequence_started_at && !isReturningMember) {
      shouldStartOnboarding = true
      upsertPayload.onboarding_sequence_started_at = new Date().toISOString()
    }
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

  // last4/brand son solo informativos: se guardan aparte y sin bloquear. Si las
  // columnas no existen en la BD, la activacion NO debe fallar por ello
  // (asi fue el 422 de ergomara2).
  if (pm.last4 || pm.brand) {
    const cardInfo: Record<string, string> = {}
    if (pm.last4) cardInfo.payment_method_last4 = pm.last4
    if (pm.brand) cardInfo.payment_method_brand = pm.brand
    const { error: cardError } = await supabase.from("user_memberships").update(cardInfo).eq("user_id", userId)
    if (cardError) {
      console.warn("[ORCHESTRATOR] No se pudo guardar last4/brand (no bloquea):", cardError.message)
    }
  }

  if (allConditionsMet) {
    console.log("[ORCHESTRATOR] Membresia ACTIVA (pago + identidad + SEPA) para userId:", userId)

    // Cerrar el intent vigente para que no se quede en un estado intermedio
    // cuando la activacion no pasa por resume-onboarding. Best-effort.
    try {
      // Solo intents del MISMO plan de la suscripcion y aun sin cerrar. Se
      // prefiere el pagado (paid_pending_verification) sobre uno "initiated",
      // aunque este ultimo sea mas reciente.
      const { data: candidateIntents } = await supabase
        .from("membership_intents")
        .select("id, status, activated_at, created_at")
        .eq("user_id", userId)
        .eq("membership_type", membershipType)
        .in("status", ["paid_pending_verification", "initiated"])
        .order("created_at", { ascending: false })

      const openIntent =
        candidateIntents?.find((i) => i.status === "paid_pending_verification") ||
        candidateIntents?.find((i) => i.status === "initiated") ||
        null

      if (openIntent) {
        const now = new Date().toISOString()
        await supabase
          .from("membership_intents")
          .update({
            status: "active",
            activated_at: openIntent.activated_at || now,
            updated_at: now,
          })
          .eq("id", openIntent.id)
      }
    } catch (err) {
      console.error("[ORCHESTRATOR] Error cerrando membership_intent:", err)
    }
  }

  // Correo "Tu membresia esta activa" + aviso al admin: best-effort, nunca bloquea la activacion.
  if (becameActive) {
    try {
      await sendMembershipActivatedEmails(supabase, {
        userId,
        membershipType,
        subscriptionId: subscription.id,
      })
    } catch (emailErr) {
      console.error("[ORCHESTRATOR] Error enviando correo de membresia activa:", emailErr)
    }

    // Al activarse, dejan de tener sentido los correos pendientes de "te echamos de menos", pago abandonado
    // y pausa. Si ademas es una socia que vuelve, tampoco le toca el onboarding de nuevas.
    try {
      const { data: owner } = await supabase.from("profiles").select("email").eq("id", userId).maybeSingle()
      await cancelPendingLifecycle({
        userId,
        email: owner?.email,
        sequenceKeys: [
          "winback",
          "pause_reactivation",
          "checkout_abandoned",
          ...(isReturningMember ? (["membership_onboarding"] as const) : []),
        ],
        reason: isReturningMember ? "membresia reactivada (socia que vuelve)" : "membresia activada",
      })
    } catch {
      // nunca bloquea la activacion
    }

    // Klaviyo: evento "Membership Activated" (best-effort)
    try {
      await klaviyoTrackForUser(supabase, userId, {
        metric: "Membership Activated",
        properties: { plan: membershipType, billing_cycle: billingCycle },
        uniqueId: `membership_activated:${userId}:${subscription.id}`,
        profile: { properties: { membership_plan: membershipType, membership_status: "active" } },
      })
    } catch {
      // nunca bloquea la activacion
    }
  }

  // Onboarding post-activacion (Secuencia 2, Fase 3): best-effort, nunca
  // bloquea la activacion si falla el enrolamiento.
  if (shouldStartOnboarding) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name, first_name")
        .eq("id", userId)
        .maybeSingle()

      if (profile?.email) {
        const name = profile.full_name || profile.first_name || ""
        const tierLabels: Record<string, string> = {
          petite: "Petite",
          essentiel: "L'Essentiel",
          signature: "Signature",
          prive: "Privé",
        }
        const tier = tierLabels[membershipType] || membershipType
        await enrollLifecycleSequence({
          sequenceKey: "membership_onboarding",
          entityType: "membership",
          entityId: userId,
          userId,
          email: profile.email,
          name,
          vars: { name, tier },
        })
      }
    } catch (err) {
      console.error("[ORCHESTRATOR] Error enrolando onboarding post-activacion:", err)
    }
  }

  return { success: true }
}

import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

  const { error } = await supabase
    .from("user_memberships")
    .upsert(
      {
        user_id: userId,
        stripe_subscription_id: subscription.id,
        membership_type: membershipType,
        billing_cycle: billingCycle,
        status,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_id" }
    )

  if (error) {
    return { success: false, error: error.message }
  }

  // --- ACTIVACION AUTOMATICA DE MEMBRESIA ---
  // Verificar si se cumplen todas las condiciones para activar
  const { data: profile } = await supabase
    .from("profiles")
    .select("identity_verified, sepa_payment_method_id, membership_status")
    .eq("id", userId)
    .single()

  const hasActiveMembership = status === "active" || subscription.status === "trialing"
  const hasIdentityVerified = profile?.identity_verified === true
  const hasSepaMandate = !!profile?.sepa_payment_method_id
  const isNotAlreadyActive = profile?.membership_status !== "active"

  console.log("[ORCHESTRATOR CHECK]", {
    userId,
    hasActiveMembership,
    hasIdentityVerified,
    hasSepaMandate,
    currentStatus: profile?.membership_status,
  })

  const shouldActivate =
    hasActiveMembership &&
    hasIdentityVerified &&
    hasSepaMandate &&
    isNotAlreadyActive

  if (shouldActivate) {
    await supabase
      .from("profiles")
      .update({
        membership_status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    console.log("[ORCHESTRATOR] Membresia activada para userId:", userId)

    // TODO: Enviar emails de activacion (descomentar cuando esten los imports)
    // await sendEmail({ type: "membership_activated", userId })
    // await sendAdminNotification({ type: "membership_activated", userId })
  }

  return { success: true }
}

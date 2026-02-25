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

  const { error } = await supabase
    .from("user_memberships")
    .upsert(
      {
        user_id: userId,
        stripe_subscription_id: subscription.id,
        membership_type: membershipType,
        status,
        end_date: safeTimestamp(subscription.current_period_end),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_id" }
    )

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

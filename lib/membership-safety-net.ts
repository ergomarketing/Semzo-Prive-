import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"
import { isIdentityVerified } from "@/lib/identity-status"
import { syncMembershipFromStripe } from "@/app/api/membership/activate/orchestrator"

const STUCK_STATUSES = ["paid_pending_verification", "pending_verification"]
const MIN_STUCK_MINUTES = 15
const MAX_PER_RUN = 50

export interface SafetyNetResult {
  checked: number
  promoted: number
  skipped: number
  failed: number
}

/**
 * Red de seguridad diaria: busca membresias atascadas en un estado transitorio
 * que ya cumplen las 3 condiciones (Stripe activa + identidad verificada +
 * mandato SEPA) y ejecuta el orquestador existente. No duplica reglas: la
 * decision final de activar la toma siempre syncMembershipFromStripe.
 */
export async function promoteStuckMemberships(): Promise<SafetyNetResult> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
  })

  const result: SafetyNetResult = { checked: 0, promoted: 0, skipped: 0, failed: 0 }
  const cutoff = new Date(Date.now() - MIN_STUCK_MINUTES * 60 * 1000).toISOString()

  const { data: stuck, error } = await supabase
    .from("user_memberships")
    .select("user_id, stripe_subscription_id")
    .in("status", STUCK_STATUSES)
    .not("stripe_subscription_id", "is", null)
    .lt("updated_at", cutoff)
    .limit(MAX_PER_RUN)

  if (error) {
    console.error("[safety-net] error leyendo membresias atascadas:", error.message)
    return result
  }

  for (const row of stuck ?? []) {
    result.checked++
    try {
      const subscription = await stripe.subscriptions.retrieve(row.stripe_subscription_id as string)
      const stripeActive = subscription.status === "active" || subscription.status === "trialing"
      if (!stripeActive) {
        result.skipped++
        continue
      }

      const hasIdentity = await isIdentityVerified(supabase, row.user_id)
      const { data: profile } = await supabase
        .from("profiles")
        .select("sepa_payment_method_id")
        .eq("id", row.user_id)
        .maybeSingle()

      if (!hasIdentity || !profile?.sepa_payment_method_id) {
        result.skipped++
        continue
      }

      const synced = await syncMembershipFromStripe(subscription)
      if (synced.success) {
        result.promoted++
        console.log("[safety-net] membresia promovida:", row.user_id)
      } else {
        result.failed++
        console.error("[safety-net] sync fallo:", row.user_id, synced.error)
      }
    } catch (err: any) {
      result.failed++
      console.error("[safety-net] error con", row.user_id, err?.message)
    }
  }

  return result
}

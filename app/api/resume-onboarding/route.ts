import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@/app/lib/supabase/server"
import { syncMembershipFromStripe } from "@/app/api/membership/activate/orchestrator"

export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

type ResumeAction =
  | "active"
  | "launch_identity"
  | "resume_checkout"
  | "processing_payment"
  | "payment_incomplete"

function isPaidStatus(status?: string | null) {
  return status === "succeeded" || status === "paid"
}

export async function POST() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, identity_verified, membership_status")
      .eq("id", user.id)
      .maybeSingle()

    const { data: intent } = await supabase
      .from("membership_intents")
      .select(
        "id, user_id, membership_type, billing_cycle, status, stripe_payment_intent_id, stripe_checkout_session_id, stripe_subscription_id, stripe_verification_session_id",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!intent) {
      return NextResponse.json(
        {
          action: "payment_incomplete" as ResumeAction,
          reason: "no_intent",
          checkout_url: "/cart",
        },
        { status: 200 },
      )
    }

    let paymentOk = false
    let paymentProcessing = false
    let checkoutUrl: string | null = null
    let stripeSubscriptionId = intent.stripe_subscription_id as string | null

    // 1) Resolve payment truth from Stripe
    if (intent.stripe_payment_intent_id) {
      try {
        const pi = await stripe.paymentIntents.retrieve(intent.stripe_payment_intent_id)
        paymentOk = isPaidStatus(pi.status)
        paymentProcessing = pi.status === "processing"
      } catch {
        // ignore, keep evaluating with checkout/subscription
      }
    }

    if (!paymentOk && intent.stripe_checkout_session_id) {
      try {
        const session = await stripe.checkout.sessions.retrieve(intent.stripe_checkout_session_id)
        paymentOk = session.payment_status === "paid"
        paymentProcessing = session.status === "open" && session.payment_status === "unpaid"
        checkoutUrl = session.url || null

        if (!stripeSubscriptionId && typeof session.subscription === "string") {
          stripeSubscriptionId = session.subscription
        }
      } catch {
        // ignore, continue to fallback
      }
    }

    if (!paymentOk && stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
        paymentOk = subscription.status === "active" || subscription.status === "trialing"
      } catch {
        // ignore
      }
    }

    // 2) If payment incomplete, send user back to checkout
    if (!paymentOk) {
      if (paymentProcessing) {
        return NextResponse.json({
          action: "processing_payment" as ResumeAction,
          reason: "payment_processing",
        })
      }

      return NextResponse.json({
        action: "resume_checkout" as ResumeAction,
        reason: "payment_incomplete",
        checkout_url: checkoutUrl || "/cart",
      })
    }

    // 3) Payment is OK. Identity pending? relaunch/reuse verification.
    if (profile?.identity_verified !== true) {
      const { data: latestVerification } = await supabase
        .from("identity_verifications")
        .select("stripe_verification_id, status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      let verificationUrl: string | null = null
      let verificationId: string | null = null

      if (latestVerification?.stripe_verification_id) {
        try {
          const existing = await stripe.identity.verificationSessions.retrieve(latestVerification.stripe_verification_id)

          if (existing.status === "verified") {
            await supabase
              .from("profiles")
              .update({ identity_verified: true, identity_verified_at: new Date().toISOString() })
              .eq("id", user.id)
          } else if (existing.status !== "canceled" && existing.url) {
            verificationUrl = existing.url
            verificationId = existing.id
          }
        } catch {
          // create new session below
        }
      }

      const { data: freshProfile } = await supabase
        .from("profiles")
        .select("identity_verified")
        .eq("id", user.id)
        .maybeSingle()

      if (freshProfile?.identity_verified !== true) {
        if (!verificationUrl) {
          const appUrl =
            process.env.NEXT_PUBLIC_SITE_URL ||
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

          const created = await stripe.identity.verificationSessions.create({
            type: "document",
            options: {
              document: {
                require_live_capture: true,
                require_matching_selfie: true,
              },
            },
            return_url: `${appUrl}/verify-identity/result?session_id={VERIFICATION_SESSION_ID}`,
            metadata: {
              user_id: user.id,
              intent_id: intent.id,
              membership_type: intent.membership_type || "essentiel",
            },
          })

          verificationUrl = created.url || null
          verificationId = created.id

          await supabase.from("identity_verifications").upsert(
            {
              user_id: user.id,
              stripe_verification_id: created.id,
              status: created.status,
              membership_type: intent.membership_type,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "stripe_verification_id" },
          )
        }

        if (verificationId) {
          await supabase
            .from("membership_intents")
            .update({
              stripe_verification_session_id: verificationId,
              status: "paid_pending_verification",
              updated_at: new Date().toISOString(),
            })
            .eq("id", intent.id)
        }

        return NextResponse.json({
          action: "launch_identity" as ResumeAction,
          verification_url: verificationUrl,
          verification_session_id: verificationId,
        })
      }
    }

    // 4) Payment + identity OK => activate membership idempotently
    if (stripeSubscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
      const synced = await syncMembershipFromStripe(subscription)
      if (!synced.success) {
        return NextResponse.json(
          {
            action: "processing_payment" as ResumeAction,
            error: synced.error || "sync_failed",
          },
          { status: 500 },
        )
      }
    }

    await supabase
      .from("membership_intents")
      .update({ status: "active", updated_at: new Date().toISOString() })
      .eq("id", intent.id)

    await supabase
      .from("profiles")
      .update({ membership_status: "active", updated_at: new Date().toISOString() })
      .eq("id", user.id)

    return NextResponse.json({
      action: "active" as ResumeAction,
      membership_status: "active",
    })
  } catch (error: any) {
    console.error("[resume-onboarding] error:", error)
    return NextResponse.json(
      {
        error: error?.message || "resume_onboarding_failed",
      },
      { status: 500 },
    )
  }
}
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@/app/lib/supabase/server"
import { syncMembershipFromStripe } from "@/app/api/membership/activate/orchestrator"

export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

type ResumeAction =
  | "active"
  | "launch_identity"
  | "resume_checkout"
  | "processing_payment"
  | "payment_incomplete"

function isPaidStatus(status?: string | null) {
  return status === "succeeded" || status === "paid"
}

export async function POST() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, identity_verified, membership_status")
      .eq("id", user.id)
      .maybeSingle()

    const { data: intent } = await supabase
      .from("membership_intents")
      .select(
        "id, user_id, membership_type, billing_cycle, status, stripe_payment_intent_id, stripe_checkout_session_id, stripe_subscription_id, stripe_verification_session_id",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!intent) {
      return NextResponse.json(
        {
          action: "payment_incomplete" as ResumeAction,
          reason: "no_intent",
          checkout_url: "/cart",
        },
        { status: 200 },
      )
    }

    let paymentOk = false
    let paymentProcessing = false
    let checkoutUrl: string | null = null
    let stripeSubscriptionId = intent.stripe_subscription_id as string | null

    // 1) Resolve payment truth from Stripe
    if (intent.stripe_payment_intent_id) {
      try {
        const pi = await stripe.paymentIntents.retrieve(intent.stripe_payment_intent_id)
        paymentOk = isPaidStatus(pi.status)
        paymentProcessing = pi.status === "processing"
      } catch {
        // ignore, keep evaluating with checkout/subscription
      }
    }

    if (!paymentOk && intent.stripe_checkout_session_id) {
      try {
        const session = await stripe.checkout.sessions.retrieve(intent.stripe_checkout_session_id)
        paymentOk = session.payment_status === "paid"
        paymentProcessing = session.status === "open" && session.payment_status === "unpaid"
        checkoutUrl = session.url || null

        if (!stripeSubscriptionId && typeof session.subscription === "string") {
          stripeSubscriptionId = session.subscription
        }
      } catch {
        // ignore, continue to fallback
      }
    }

    if (!paymentOk && stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
        paymentOk = subscription.status === "active" || subscription.status === "trialing"
      } catch {
        // ignore
      }
    }

    // 2) If payment incomplete, send user back to checkout
    if (!paymentOk) {
      if (paymentProcessing) {
        return NextResponse.json({
          action: "processing_payment" as ResumeAction,
          reason: "payment_processing",
        })
      }

      return NextResponse.json({
        action: "resume_checkout" as ResumeAction,
        reason: "payment_incomplete",
        checkout_url: checkoutUrl || "/cart",
      })
    }

    // 3) Payment is OK. Identity pending? relaunch/reuse verification.
    if (profile?.identity_verified !== true) {
      const { data: latestVerification } = await supabase
        .from("identity_verifications")
        .select("stripe_verification_id, status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      let verificationUrl: string | null = null
      let verificationId: string | null = null

      if (latestVerification?.stripe_verification_id) {
        try {
          const existing = await stripe.identity.verificationSessions.retrieve(latestVerification.stripe_verification_id)

          if (existing.status === "verified") {
            await supabase
              .from("profiles")
              .update({ identity_verified: true, identity_verified_at: new Date().toISOString() })
              .eq("id", user.id)
          } else if (existing.status !== "canceled" && existing.url) {
            verificationUrl = existing.url
            verificationId = existing.id
          }
        } catch {
          // create new session below
        }
      }

      const { data: freshProfile } = await supabase
        .from("profiles")
        .select("identity_verified")
        .eq("id", user.id)
        .maybeSingle()

      if (freshProfile?.identity_verified !== true) {
        if (!verificationUrl) {
          const appUrl =
            process.env.NEXT_PUBLIC_SITE_URL ||
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

          const created = await stripe.identity.verificationSessions.create({
            type: "document",
            options: {
              document: {
                require_live_capture: true,
                require_matching_selfie: true,
              },
            },
            return_url: `${appUrl}/verify-identity/result?session_id={VERIFICATION_SESSION_ID}`,
            metadata: {
              user_id: user.id,
              intent_id: intent.id,
              membership_type: intent.membership_type || "essentiel",
            },
          })

          verificationUrl = created.url || null
          verificationId = created.id

          await supabase.from("identity_verifications").upsert(
            {
              user_id: user.id,
              stripe_verification_id: created.id,
              status: created.status,
              membership_type: intent.membership_type,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "stripe_verification_id" },
          )
        }

        if (verificationId) {
          await supabase
            .from("membership_intents")
            .update({
              stripe_verification_session_id: verificationId,
              status: "paid_pending_verification",
              updated_at: new Date().toISOString(),
            })
            .eq("id", intent.id)
        }

        return NextResponse.json({
          action: "launch_identity" as ResumeAction,
          verification_url: verificationUrl,
          verification_session_id: verificationId,
        })
      }
    }

    // 4) Payment + identity OK => activate membership idempotently
    if (stripeSubscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
      const synced = await syncMembershipFromStripe(subscription)
      if (!synced.success) {
        return NextResponse.json(
          {
            action: "processing_payment" as ResumeAction,
            error: synced.error || "sync_failed",
          },
          { status: 500 },
        )
      }
    }

    await supabase
      .from("membership_intents")
      .update({ status: "active", updated_at: new Date().toISOString() })
      .eq("id", intent.id)

    await supabase
      .from("profiles")
      .update({ membership_status: "active", updated_at: new Date().toISOString() })
      .eq("id", user.id)

    return NextResponse.json({
      action: "active" as ResumeAction,
      membership_status: "active",
    })
  } catch (error: any) {
    console.error("[resume-onboarding] error:", error)
    return NextResponse.json(
      {
        error: error?.message || "resume_onboarding_failed",
      },
      { status: 500 },
    )
  }
}

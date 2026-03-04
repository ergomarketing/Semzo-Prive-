import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Protege contra epoch null/undefined devuelto por Stripe
function safeTimestamp(epoch: number | null | undefined): string {
  if (epoch === null || epoch === undefined || isNaN(epoch)) {
    return new Date().toISOString();
  }
  const d = new Date(epoch * 1000);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

/**
 * ============================================================
 * WEBHOOK
 * ============================================================
 */
export async function POST(req: NextRequest) {
  let event: Stripe.Event;

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature")!;
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (err: any) {
    console.error("❌ Invalid signature:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const now = new Date().toISOString();

  try {
    switch (event.type) {

      /**
       * ============================================================
       * 1️⃣ ACTIVACIÓN INICIAL — ÚNICO PUNTO DE CREACIÓN
       * ============================================================
       */
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (
          session.mode !== "subscription" ||
          session.payment_status !== "paid" ||
          !session.subscription
        ) {
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        const userId = subscription.metadata?.user_id;
        const membershipType =
          subscription.metadata?.membership_type || "petite";

        if (!userId) {
          console.error("❌ Missing user_id in subscription metadata");
          break;
        }

        await supabase
          .from("user_memberships")
          .upsert(
            {
              user_id: userId,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: subscription.id,
              membership_type: membershipType,
              status: subscription.status,
              start_date: safeTimestamp(subscription.current_period_start),
              end_date: safeTimestamp(subscription.current_period_end),
              failed_payment_count: 0,
              dunning_status: null,
              updated_at: now,
            },
            { onConflict: "stripe_subscription_id" }
          );

        await supabase
          .from("profiles")
          .update({
            membership_status: subscription.status,
            updated_at: now,
          })
          .eq("id", userId);

        // Marcar el intent como paid_pending_verification
        // para que identity/create-session pueda encontrarlo
        await supabase
          .from("membership_intents")
          .update({
            status: "paid_pending_verification",
            stripe_subscription_id: subscription.id,
            updated_at: now,
          })
          .eq("user_id", userId)
          .in("status", ["pending_payment", "pending", "created"]);

        console.log("✅ Membership ACTIVATED:", userId);
        break;
      }

      /**
       * ============================================================
       * 2️⃣ RENOVACIÓN EXITOSA — NO CREA, SOLO ACTUALIZA
       * ============================================================
       */
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;

        if (
          invoice.billing_reason === "subscription_create" ||
          !invoice.subscription
        ) {
          break;
        }

        const subscriptionId = invoice.subscription as string;

        // 🔒 Resolver user_id desde DB (NO desde metadata)
        const { data: membership } = await supabase
          .from("user_memberships")
          .select("user_id")
          .eq("stripe_subscription_id", subscriptionId)
          .single();

        if (!membership?.user_id) {
          console.error("❌ Membership not found for renewal");
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(
          subscriptionId
        );

        await supabase
          .from("user_memberships")
          .update({
            status: subscription.status,
            start_date: safeTimestamp(subscription.current_period_start),
            end_date: safeTimestamp(subscription.current_period_end),
            failed_payment_count: 0,
            dunning_status: null,
            updated_at: now,
          })
          .eq("stripe_subscription_id", subscriptionId);

        await supabase
          .from("payment_history")
          .upsert(
            {
              user_id: membership.user_id,
              stripe_invoice_id: invoice.id,
              stripe_subscription_id: subscriptionId,
              amount: invoice.amount_paid
                ? invoice.amount_paid / 100
                : 0,
              currency: invoice.currency,
              status: "paid",
              payment_date: now,
              created_at: now,
            },
            { onConflict: "stripe_invoice_id" }
          );

        await supabase
          .from("profiles")
          .update({
            membership_status: subscription.status,
            updated_at: now,
          })
          .eq("id", membership.user_id);

        console.log("✅ Membership RENEWED:", membership.user_id);
        break;
      }

      /**
       * ============================================================
       * 3️⃣ CAMBIO DE ESTADO / CANCELACIÓN
       * ============================================================
       */
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        const { data: membership } = await supabase
          .from("user_memberships")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (!membership?.user_id) break;

        await supabase
          .from("user_memberships")
          .update({
            status: subscription.status,
            membership_type:
              subscription.metadata?.membership_type || "petite",
            updated_at: now,
          })
          .eq("stripe_subscription_id", subscription.id);

        await supabase
          .from("profiles")
          .update({
            membership_status: subscription.status,
            updated_at: now,
          })
          .eq("id", membership.user_id);

        console.log("ℹ️ Subscription status updated:", membership.user_id);
        break;
      }

      default:
        console.log("ℹ️ Unhandled event:", event.type);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

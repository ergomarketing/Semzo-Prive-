console.log("🚨 VERSION 12/10 WEBHOOK ACTIVE 🚨")
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * ============================================================
 * CONFIGURACIÓN
 * ============================================================
 */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// 🔥 CRÍTICO: Service Role para bypass RLS en webhook
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * ============================================================
 * WEBHOOK HANDLER
 * ============================================================
 */

export async function POST(req: NextRequest) {
  let event: Stripe.Event;

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature")!;

    event = stripe.webhooks.constructEvent(
      body,
      signature,
      endpointSecret
    );
  } catch (err: any) {
    console.error("❌ Invalid webhook signature:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const now = new Date().toISOString();

  try {
    switch (event.type) {

      /**
       * ============================================================
       * 1️⃣ ACTIVACIÓN INICIAL
       * ============================================================
       * Punto único de activación de suscripción nueva.
       */
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (
          session.mode !== "subscription" ||
          session.payment_status !== "paid" ||
          !session.subscription
        ) {
          console.log("⏩ Checkout no válido para activación — skipping");
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

        // UPSERT idempotente por user_id
        const { error: membershipError } = await supabase
          .from("user_memberships")
          .upsert(
            {
              user_id: userId,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: subscription.id,
              membership_type: membershipType,
              status: subscription.status,
              start_date: new Date(
                subscription.current_period_start * 1000
              ).toISOString(),
              end_date: new Date(
                subscription.current_period_end * 1000
              ).toISOString(),
              failed_payment_count: 0,
              dunning_status: null,
              updated_at: now,
            },
            { onConflict: "user_id" }
          );

        if (membershipError) {
          console.error("❌ Membership upsert error:", membershipError);
          throw membershipError;
        }

        // Sincronización con perfil
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            membership_status: subscription.status,
            updated_at: now,
          })
          .eq("id", userId);

        if (profileError) {
          console.error("❌ Profile update error:", profileError);
          throw profileError;
        }

        console.log("✅ Membership ACTIVATED:", userId);
        break;
      }

      /**
       * ============================================================
       * 2️⃣ RENOVACIÓN EXITOSA
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

        const subscription = await stripe.subscriptions.retrieve(
          invoice.subscription as string
        );

        const userId = subscription.metadata?.user_id;

        if (!userId) {
          console.error("❌ Missing user_id in renewal metadata");
          break;
        }

        // Actualizar membresía
        const { error: renewalError } = await supabase
          .from("user_memberships")
          .update({
            status: subscription.status,
            start_date: new Date(
              subscription.current_period_start * 1000
            ).toISOString(),
            end_date: new Date(
              subscription.current_period_end * 1000
            ).toISOString(),
            failed_payment_count: 0,
            dunning_status: null,
            updated_at: now,
          })
          .eq("stripe_subscription_id", subscription.id);

        if (renewalError) {
          console.error("❌ Renewal update error:", renewalError);
          throw renewalError;
        }

        // Registrar pago
        const { error: paymentError } = await supabase
          .from("payment_history")
          .upsert(
            {
              user_id: userId,
              stripe_invoice_id: invoice.id,
              stripe_subscription_id: subscription.id,
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

        if (paymentError) {
          console.error("❌ Payment history error:", paymentError);
          throw paymentError;
        }

        // Sincronizar profile
        await supabase
          .from("profiles")
          .update({
            membership_status: subscription.status,
            updated_at: now,
          })
          .eq("id", userId);

        console.log("✅ Membership RENEWED:", userId);
        break;
      }

      /**
       * ============================================================
       * 3️⃣ CANCELACIÓN O CAMBIO DE ESTADO
       * ============================================================
       */
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;

        if (!userId) break;

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
          .eq("id", userId);

        console.log(
          `ℹ️ Subscription status updated (${event.type}) for: ${userId}`
        );
        break;
      }

      default:
        console.log("ℹ️ Unhandled event type:", event.type);
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

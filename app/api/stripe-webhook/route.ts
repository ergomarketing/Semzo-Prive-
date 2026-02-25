import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// 🔐 Cliente Admin (bypass RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 🔒 Protección contra fechas inválidas
function safeDate(unix?: number | null) {
  if (!unix) return null;
  const d = new Date(unix * 1000);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }

  const now = new Date().toISOString();

  try {
    switch (event.type) {
      /**
       * ============================================================
       * ACTIVACIÓN INICIAL
       * ============================================================
       */
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode !== "subscription" || session.payment_status !== "paid") {
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        const userId =
          session.metadata?.user_id ||
          subscription.metadata?.user_id;

        const intentId =
          session.metadata?.intent_id ||
          subscription.metadata?.intent_id;

        if (!userId || !intentId) {
          console.error("❌ Missing userId or intentId");
          break;
        }

        // Buscar intent válido
        const { data: intent, error: intentError } =
          await supabaseAdmin
            .from("membership_intents")
            .select("*")
            .eq("id", intentId)
            .in("status", ["initiated", "paid_pending_verification"])
            .single();

        if (intentError || !intent) {
          console.error("❌ Intent not found:", intentId);
          break;
        }

        // Fechas seguras
        const startDate = safeDate(subscription.current_period_start);
        const endDate = safeDate(subscription.current_period_end);

        // Activar membresía
        const { error: memError } = await supabaseAdmin
          .from("user_memberships")
          .upsert(
            {
              user_id: userId,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: subscription.id,
              membership_type:
                subscription.metadata?.membership_type ||
                intent.membership_type,
              status: subscription.status,
              start_date: startDate,
              end_date: endDate,
              updated_at: now,
            },
            { onConflict: "user_id" }
          );

        if (memError) throw memError;

        // Sync perfil
        await supabaseAdmin
          .from("profiles")
          .update({
            membership_status: subscription.status,
            updated_at: now,
          })
          .eq("id", userId);

        /**
         * Gift Card
         */
        if (intent.gift_card_id && intent.gift_card_applied_cents > 0) {
          const { data: giftCard } = await supabaseAdmin
            .from("gift_cards")
            .select("balance_cents")
            .eq("id", intent.gift_card_id)
            .single();

          if (giftCard) {
            const newBalance = Math.max(
              0,
              giftCard.balance_cents -
                intent.gift_card_applied_cents
            );

            await supabaseAdmin
              .from("gift_cards")
              .update({
                balance_cents: newBalance,
                last_used_at: now,
                updated_at: now,
              })
              .eq("id", intent.gift_card_id);
          }
        }

        // Actualizar intent (auditoría)
        await supabaseAdmin
          .from("membership_intents")
          .update({
            status: "active",
            stripe_subscription_id: subscription.id,
            stripe_customer_id: session.customer as string,
            activated_at: now,
            paid_at: now,
            updated_at: now,
          })
          .eq("id", intent.id);

        console.log("✅ Activación completada:", userId);
        break;
      }

      /**
       * ============================================================
       * RENOVACIÓN
       * ============================================================
       */
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.billing_reason === "subscription_create") break;

        const subscription = await stripe.subscriptions.retrieve(
          invoice.subscription as string
        );

        const userId = subscription.metadata?.user_id;
        if (!userId) break;

        await supabaseAdmin
          .from("user_memberships")
          .update({
            status: subscription.status,
            start_date: safeDate(subscription.current_period_start),
            end_date: safeDate(subscription.current_period_end),
            updated_at: now,
          })
          .eq("stripe_subscription_id", subscription.id);

        await supabaseAdmin
          .from("payment_history")
          .upsert(
            {
              user_id: userId,
              stripe_invoice_id: invoice.id,
              amount: invoice.amount_paid / 100,
              currency: invoice.currency,
              status: "paid",
              payment_date: now,
            },
            { onConflict: "stripe_invoice_id" }
          );

        console.log("✅ Renovación procesada:", userId);
        break;
      }

      /**
       * ============================================================
       * CANCELACIÓN
       * ============================================================
       */
      case "customer.subscription.deleted": {
        const subscription =
          event.data.object as Stripe.Subscription;

        const userId = subscription.metadata?.user_id;
        if (!userId) break;

        await supabaseAdmin
          .from("user_memberships")
          .update({
            status: "canceled",
            updated_at: now,
          })
          .eq("stripe_subscription_id", subscription.id);

        await supabaseAdmin
          .from("profiles")
          .update({
            membership_status: "canceled",
            updated_at: now,
          })
          .eq("id", userId);

        console.log("⚠️ Suscripción cancelada:", userId);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Critical Webhook Error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// CLIENTE DE ADMINISTRACIÓN (Service Role) - Crucial para Webhooks
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode !== "subscription" || session.payment_status !== "paid") {
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        
        const userId = session.metadata?.user_id || subscription.metadata?.user_id;
        const intentId = session.metadata?.intent_id || subscription.metadata?.intent_id;

        if (!userId || !intentId) {
          console.error("❌ Missing userId or intentId in Stripe metadata");
          break;
        }

        // 1. RECUPERAR INTENT (initiated | paid_pending_verification)
        const { data: intent, error: intentError } = await supabaseAdmin
          .from("membership_intents")
          .select("*")
          .eq("id", intentId)
          .in("status", ["initiated", "paid_pending_verification"])
          .single();

        if (intentError || !intent) {
          console.error("❌ Intent not found or already processed:", intentId);
          break;
        }

        // 2. ACTIVACIÓN DE MEMBRESÍA
        const { error: memError } = await supabaseAdmin
          .from("user_memberships")
          .upsert({
            user_id: userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscription.id,
            membership_type: subscription.metadata?.membership_type || intent.membership_type,
            status: subscription.status,
            start_date: new Date(subscription.current_period_start * 1000).toISOString(),
            end_date: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: now,
          }, { onConflict: "user_id" });

        if (memError) throw memError;

        await supabaseAdmin.from("profiles").update({ 
          membership_status: subscription.status,
          updated_at: now 
        }).eq("id", userId);

        // 3. MANEJO DE GIFT CARD (Ajuste 1: gift_card_applied_cents)
        if (intent.gift_card_id && intent.gift_card_applied_cents > 0) {
          const { data: giftCard } = await supabaseAdmin
            .from("gift_cards")
            .select("balance_cents")
            .eq("id", intent.gift_card_id)
            .single();

          if (giftCard) {
            const newBalance = Math.max(0, giftCard.balance_cents - intent.gift_card_applied_cents);
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

        // 4. ACTUALIZAR INTENT (Ajuste 2: Campos Stripe + Auditoría)
        await supabaseAdmin
          .from("membership_intents")
          .update({ 
            status: "active",
            stripe_subscription_id: subscription.id,
            stripe_customer_id: session.customer as string,
            activated_at: now,
            paid_at: now,
            updated_at: now 
          })
          .eq("id", intent.id);

        console.log(`✅ Activación completa y auditada para: ${userId}`);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.billing_reason === "subscription_create") break;

        const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
        const uId = sub.metadata?.user_id;
        if (!uId) break;

        await supabaseAdmin.from("user_memberships").update({
          status: sub.status,
          start_date: new Date(sub.current_period_start * 1000).toISOString(),
          end_date: new Date(sub.current_period_end * 1000).toISOString(),
          updated_at: now,
        }).eq("stripe_subscription_id", sub.id);

        await supabaseAdmin.from("payment_history").upsert({
          user_id: uId,
          stripe_invoice_id: invoice.id,
          amount: invoice.amount_paid / 100,
          currency: invoice.currency,
          status: "paid",
          payment_date: now,
        }, { onConflict: "stripe_invoice_id" });

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Critical Webhook Error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

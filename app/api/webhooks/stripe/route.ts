import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { EmailServiceProduction } from "@/app/lib/email-service-production";

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

  // IDEMPOTENCIA: si este evento ya fue procesado, ignorar
  const { data: alreadyProcessed } = await supabase
    .from("stripe_processed_events")
    .select("event_id")
    .eq("event_id", event.id)
    .maybeSingle();

  if (alreadyProcessed) {
    return NextResponse.json({ received: true, skipped: "already_processed" });
  }

  // Registrar el evento ANTES de procesarlo para evitar doble ejecución en retries simultáneos
  await supabase.from("stripe_processed_events").insert({
    event_id: event.id,
    event_type: event.type,
  }).throwOnError();

  try {
    switch (event.type) {

      /**
       * ============================================================
       * 1️⃣ ACTIVACIÓN INICIAL — ÚNICO PUNTO DE CREACIÓN
       * ============================================================
       */
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // --- PASE DE BOLSO (mode: payment) ---
        if (session.mode === "payment" && session.payment_status === "paid") {
          const giftCardId = session.metadata?.gift_card_id;
          const userId = session.metadata?.user_id;

          // Consumir gift card si había una aplicada parcialmente
          // consume_gift_card_atomic v2: verifica saldo e idempotencia por session.id
          if (giftCardId && userId) {
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
            const originalPriceCents = lineItems.data[0]?.price?.unit_amount || 0;
            const originalPriceEuros = originalPriceCents / 100;
            const amountChargedEuros = (session.amount_total || 0) / 100;
            const giftCardConsumedEuros = parseFloat((originalPriceEuros - amountChargedEuros).toFixed(2));

            if (giftCardConsumedEuros > 0) {
              await supabase.rpc("consume_gift_card_atomic", {
                p_gift_card_id: giftCardId,
                p_amount: giftCardConsumedEuros,
                p_user_id: userId,
                p_reference_id: session.id,       // cs_xxx — idempotencia
                p_reference_type: "bag_pass",
              });
            }
          }
          break;
        }

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

        // user_id puede estar en subscription.metadata o en session.metadata
        let userId: string | undefined =
          subscription.metadata?.user_id ||
          session.metadata?.user_id;
        const membershipType =
          subscription.metadata?.membership_type ||
          session.metadata?.membership_type ||
          "essentiel";

        if (!userId) {
          console.error("❌ Missing user_id in subscription/session metadata — fallback to customer metadata");
          const customerId = session.customer as string;
          const customer = await stripe.customers.retrieve(customerId);
          if (customer.deleted) { break; }
          const supabaseUserId = (customer as Stripe.Customer).metadata?.supabase_user_id;
          if (!supabaseUserId) { break; }
          userId = supabaseUserId;
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
        // Si no existe intent previo, crear uno ahora
        const { data: existingIntent } = await supabase
          .from("membership_intents")
          .select("id")
          .eq("user_id", userId)
          .in("status", ["pending_payment", "pending", "created"])
          .limit(1)
          .maybeSingle();

        if (existingIntent?.id) {
          await supabase
            .from("membership_intents")
            .update({
              status: "paid_pending_verification",
              stripe_subscription_id: subscription.id,
              updated_at: now,
            })
            .eq("id", existingIntent.id);
        } else {
          // Crear intent si no existía (flujo email sin intent previo)
          await supabase.from("membership_intents").insert({
            user_id: userId,
            membership_type: membershipType,
            status: "paid_pending_verification",
            stripe_subscription_id: subscription.id,
            created_at: now,
            updated_at: now,
          });
        }

        // EMAIL AL USUARIO: Membresía activada — pago confirmado
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", userId)
          .single();

        const membershipLabels: Record<string, string> = {
          petite: "L'Essentiel",
          essentiel: "L'Essentiel",
          signature: "Signature",
          prive: "Privé",
        };
        const membershipLabel = membershipLabels[membershipType] || membershipType;

        if (userProfile?.email) {
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://semzoprive.com";
          const emailService = EmailServiceProduction.getInstance();
          await emailService.sendWithResend({
            to: userProfile.email,
            subject: `Bienvenida a Semzo Privé — Tu membresía ${membershipLabel} está activa`,
            html: `
              <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #fff;">
                <h1 style="color: #1a1a4b; font-size: 24px; margin-bottom: 8px;">¡Bienvenida, ${userProfile.full_name || ""}!</h1>
                <p style="color: #444; line-height: 1.6;">Tu pago ha sido confirmado y tu membresía <strong>${membershipLabel}</strong> está activa.</p>
                <div style="background: #f8f6f2; border-left: 4px solid #1a1a4b; padding: 20px; margin: 24px 0; border-radius: 4px;">
                  <p style="margin: 0; color: #1a1a4b; font-size: 15px;"><strong>Próximo paso:</strong> Completa la verificación de identidad para desbloquear el acceso completo al catálogo.</p>
                </div>
                <p style="color: #444; line-height: 1.6;">La verificación es rápida y solo toma unos minutos. Una vez completada, podrás reservar cualquier bolso de nuestra colección exclusiva.</p>
                <div style="margin: 32px 0;">
                  <a href="${siteUrl}/dashboard" style="background: #1a1a4b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-size: 14px; letter-spacing: 1px;">
                    IR A MI DASHBOARD
                  </a>
                </div>
                <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
                <p style="color: #999; font-size: 12px;">Semzo Privé · Av. Bulevar Príncipe Alfonso de Hohenlohe, s/n, Marbella · <a href="mailto:info@semzoprive.com" style="color: #999;">info@semzoprive.com</a></p>
              </div>
            `,
          }).catch(() => {}); // No bloquear el webhook si falla el email

          // Notificar al admin de nueva membresía activada
          await emailService.sendWithResend({
            to: "mailbox@semzoprive.com",
            subject: `[Admin] Nueva membresía activada — ${userProfile.full_name || userProfile.email}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #1a1a4b;">Nueva membresía activada</h2>
                <p><strong>Nombre:</strong> ${userProfile.full_name || "N/A"}</p>
                <p><strong>Email:</strong> ${userProfile.email}</p>
                <p><strong>Plan:</strong> ${membershipLabel}</p>
                <p><strong>Suscripción Stripe:</strong> ${subscription.id}</p>
                <p><strong>Fecha:</strong> ${new Date().toLocaleString("es-ES")}</p>
              </div>
            `,
          }).catch(() => {});
        }

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

        // EMAIL AL USUARIO: Renovación confirmada
        const { data: renewProfile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", membership.user_id)
          .single();

        if (renewProfile?.email) {
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://semzoprive.com";
          const amount = invoice.amount_paid ? (invoice.amount_paid / 100).toFixed(2) : "—";
          const emailService = EmailServiceProduction.getInstance();
          await emailService.sendWithResend({
            to: renewProfile.email,
            subject: "Renovación confirmada — Semzo Privé",
            html: `
              <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #fff;">
                <h1 style="color: #1a1a4b; font-size: 22px; margin-bottom: 8px;">Renovación confirmada</h1>
                <p style="color: #444; line-height: 1.6;">Hola ${renewProfile.full_name || ""}, tu membresía ha sido renovada correctamente.</p>
                <div style="background: #f8f6f2; padding: 20px; border-radius: 4px; margin: 24px 0;">
                  <p style="margin: 0; color: #1a1a4b;"><strong>Importe cobrado:</strong> ${amount}€</p>
                </div>
                <div style="margin: 32px 0;">
                  <a href="${siteUrl}/dashboard" style="background: #1a1a4b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-size: 14px; letter-spacing: 1px;">
                    VER MI CUENTA
                  </a>
                </div>
                <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
                <p style="color: #999; font-size: 12px;">Semzo Privé · <a href="mailto:info@semzoprive.com" style="color: #999;">info@semzoprive.com</a></p>
              </div>
            `,
          }).catch(() => {});
        }

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

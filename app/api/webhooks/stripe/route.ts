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

        // gift_card_id puede estar en subscription.metadata o en session.metadata
        const giftCardId =
          subscription.metadata?.gift_card_id ||
          session.metadata?.gift_card_id;

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

        // Derivar billing_cycle desde metadatos o desde el precio de Stripe
        const billingCycle: string =
          subscription.metadata?.billing_cycle ||
          session.metadata?.billing_cycle ||
          (membershipType === "petite" ? "weekly" : "monthly");

        // Guardar stripe_customer_id en profiles (dato basico, no estado de negocio)
        const customerId = session.customer as string;
        await supabase
          .from("profiles")
          .update({
            stripe_customer_id: customerId,
            updated_at: now,
          })
          .eq("id", userId);

        // Crear/actualizar user_memberships (FUENTE DE VERDAD para estado de membresia)
        const startDate = new Date(subscription.current_period_start * 1000);
        const endDate =
          billingCycle === "weekly"
            ? new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)
            : new Date(subscription.current_period_end * 1000);

        // REGLA DE ORO: Identity → SEPA → Active.
        // NO marcar "active" aqui aunque Stripe diga subscription.status="active".
        // El estado correcto tras pago es "paid_pending_verification".
        // resume-onboarding promueve a "active" solo cuando Identity + SEPA estan OK.
        await supabase
          .from("user_memberships")
          .upsert(
            {
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscription.id,
              membership_type: membershipType,
              billing_cycle: billingCycle,
              status: "paid_pending_verification",
              start_date: startDate.toISOString(),
              end_date: endDate.toISOString(),
              failed_payment_count: 0,
              dunning_status: null,
              updated_at: now,
            },
            { onConflict: "user_id" }
          );

        // Consumir gift card si habia una aplicada.
        // FUENTE DE VERDAD: membership_intents.gift_card_applied_cents
        // (calculado en create-intent cuando el usuario pulso Pagar).
        // Buscamos el intent mas reciente del usuario con gift card.
        if (giftCardId && userId) {
          const { data: intent } = await supabase
            .from("membership_intents")
            .select("gift_card_applied_cents")
            .eq("user_id", userId)
            .gt("gift_card_applied_cents", 0)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          const appliedCents = intent?.gift_card_applied_cents || 0;
          const giftCardConsumedEuros = parseFloat((appliedCents / 100).toFixed(2));

          if (giftCardConsumedEuros > 0) {
            await supabase.rpc("consume_gift_card_atomic", {
              p_gift_card_id: giftCardId,
              p_amount: giftCardConsumedEuros,
              p_user_id: userId,
              p_reference_id: session.id,
              p_reference_type: "membership",
            });
          }
        }

        // Marcar el intent como paid_pending_verification
        // para que identity/create-session pueda encontrarlo
        // Si no existe intent previo, crear uno ahora
        const { data: existingIntent } = await supabase
          .from("membership_intents")
          .select("id")
          .eq("user_id", userId)
          .in("status", ["initiated", "pending_payment", "pending", "created"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingIntent?.id) {
          await supabase
            .from("membership_intents")
            .update({
              status: "paid_pending_verification",
              stripe_subscription_id: subscription.id,
              paid_at: now,
              updated_at: now,
            })
            .eq("id", existingIntent.id);
        } else {
          // Crear intent si no existía — incluir todos los campos NOT NULL
          await supabase.from("membership_intents").insert({
            user_id: userId,
            membership_type: membershipType,
            billing_cycle: "monthly",
            amount_cents: 0,
            original_amount_cents: 0,
            status: "paid_pending_verification",
            stripe_subscription_id: subscription.id,
            initiated_at: now,
            paid_at: now,
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
          petite: "Petite",
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
          .select("user_id, billing_cycle, membership_type")
          .eq("stripe_subscription_id", subscriptionId)
          .single();

        if (!membership?.user_id) {
          console.error("❌ Membership not found for renewal");
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(
          subscriptionId
        );

        // Recalcular end_date según billing_cycle guardado
        const renewalBillingCycle: string =
          subscription.metadata?.billing_cycle ||
          membership?.billing_cycle ||
          (membership?.membership_type === "petite" ? "weekly" : "monthly");

        const renewalStart = new Date(subscription.current_period_start * 1000);
        const renewalEnd =
          renewalBillingCycle === "weekly"
            ? new Date(renewalStart.getTime() + 7 * 24 * 60 * 60 * 1000)
            : new Date(subscription.current_period_end * 1000);

        await supabase
          .from("user_memberships")
          .update({
            status: subscription.status,
            billing_cycle: renewalBillingCycle,
            start_date: renewalStart.toISOString(),
            end_date: renewalEnd.toISOString(),
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

        console.log("ℹ️ Subscription status updated:", membership.user_id);
        break;
      }

      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;

        // --- GIFT CARD PURCHASE ---
        if (pi.metadata?.type === "gift_card") {
          const purchaserId = pi.metadata?.user_id;

          // Buscar la gift card por stripe_payment_intent_id (forma más precisa)
          // o por purchased_by + status + amount como fallback
          let giftCard = null;
          
          // Primero buscar por payment_intent_id (método preferido)
          const { data: giftCardByPI } = await supabase
            .from("gift_cards")
            .select("id, code, amount, personal_message, recipient_email, recipient_name")
            .eq("stripe_payment_intent_id", pi.id)
            .eq("status", "pending")
            .maybeSingle();
          
          if (giftCardByPI) {
            giftCard = giftCardByPI;
          } else {
            // Fallback: buscar por purchased_by + amount (para gift cards antiguas)
            const amountCents = pi.amount;
            const { data: giftCardByAmount } = await supabase
              .from("gift_cards")
              .select("id, code, amount, personal_message, recipient_email, recipient_name")
              .eq("purchased_by", purchaserId)
              .eq("status", "pending")
              .eq("amount", amountCents)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            
            giftCard = giftCardByAmount;
          }

          if (giftCard) {
            // Activar la gift card
            await supabase
              .from("gift_cards")
              .update({
                status: "active",
                stripe_payment_intent_id: pi.id,
                activated_at: now,
                updated_at: now,
              })
              .eq("id", giftCard.id);

            // Enviar email al destinatario (usar datos del gift card, no de metadata)
            const finalRecipientEmail = giftCard.recipient_email || pi.metadata?.recipient_email;
            const finalRecipientName = giftCard.recipient_name || pi.metadata?.recipient_name;
            
            if (finalRecipientEmail) {
              const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://semzoprive.com";
              const amountEuros = (giftCard.amount / 100).toFixed(0);
              const emailService = EmailServiceProduction.getInstance();

              await emailService.sendWithResend({
                to: finalRecipientEmail,
                subject: `Has recibido una Gift Card de Semzo Prive - ${amountEuros}€`,
                html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gift Card Semzo Prive</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f5f5f5; color: #111; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background-color: #1a1a4b; padding: 30px 20px; text-align: center;">
      <img src="https://www.semzoprive.com/images/logo-20semzo-20prive.png" alt="Semzo Prive" style="max-width: 200px; height: auto;" />
      <p style="color: rgba(255,255,255,0.7); margin: 10px 0 0; font-size: 14px;">Acceso exclusivo al lujo</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px; text-align: center; background-color: white;">
      <h2 style="color: #1a1a4b; margin-top: 0; font-size: 24px;">Has recibido una Gift Card</h2>
      
      <p style="color: #444; line-height: 1.6; font-size: 16px;">
        Hola${finalRecipientName ? ` ${finalRecipientName}` : ""},
      </p>
      
      <p style="color: #444; line-height: 1.6; font-size: 16px;">
        Alguien especial te ha regalado acceso al mundo del lujo con una Gift Card de <strong style="color: #1a1a4b;">${amountEuros}€</strong>.
      </p>
      
      <!-- Imagen Gift Card -->
      <div style="margin: 30px 0;">
        <img src="https://www.semzoprive.com/images/gift-card-semzo.jpg" alt="Gift Card Semzo Prive" style="max-width: 100%; height: auto; border-radius: 12px;" />
      </div>
      
      ${giftCard.personal_message ? `
      <!-- Mensaje Personal -->
      <div style="background-color: rgba(244, 196, 204, 0.15); border-left: 4px solid #f4c4cc; padding: 15px; margin: 25px 0; border-radius: 0 8px 8px 0; text-align: left;">
        <p style="color: #444; margin: 0; font-style: italic; line-height: 1.6;">"${giftCard.personal_message}"</p>
      </div>
      ` : ""}
      
      <!-- Codigo -->
      <div style="background-color: #1a1a4b; color: white; padding: 25px; border-radius: 10px; margin: 30px 0;">
        <p style="margin: 0 0 10px 0; font-size: 12px; letter-spacing: 2px; opacity: 0.8; text-transform: uppercase;">Tu codigo de Gift Card</p>
        <p style="margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 4px;">${giftCard.code}</p>
      </div>
      
      <p style="color: #444; line-height: 1.6; font-size: 16px;">
        Usa este codigo en el checkout para aplicar tu credito a cualquier membresia o reserva de bolso.
      </p>
      
      <!-- Boton CTA -->
      <div style="margin: 30px 0;">
        <a href="${siteUrl}/membresias" style="display: inline-block; background-color: #f3c3cc; color: #1a1a4b; padding: 14px 35px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px;">
          Explorar Membresias
        </a>
      </div>
      
      <!-- Info Box -->
      <div style="background-color: rgba(244, 196, 204, 0.15); border-left: 4px solid #f4c4cc; padding: 15px; margin: 25px 0; border-radius: 0 8px 8px 0; text-align: left;">
        <strong style="color: #1a1a4b;">Informacion importante:</strong>
        <ul style="color: #444; margin: 10px 0 0; padding-left: 20px;">
          <li>Tu Gift Card tiene una validez de <strong>2 anos</strong></li>
          <li>Puedes usarla en cualquier membresia o reserva</li>
          <li>El saldo restante queda disponible para futuras compras</li>
        </ul>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #1a1a4b; padding: 20px; text-align: center;">
      <p style="color: rgba(255,255,255,0.7); font-size: 13px; margin: 0;">
        © 2025 Semzo Prive. Todos los derechos reservados.<br />
        <a href="mailto:contacto@semzoprive.com" style="color: rgba(255,255,255,0.7);">contacto@semzoprive.com</a>
      </p>
    </div>
    
  </div>
</body>
</html>
                `,
              }).catch(() => {});
            }

            // Notificar al admin
            const adminEmailService = EmailServiceProduction.getInstance();
            const amountEurosAdmin = (giftCard.amount / 100).toFixed(0);
            await adminEmailService.sendWithResend({
              to: "mailbox@semzoprive.com",
              subject: `[Admin] Nueva Gift Card vendida - ${amountEurosAdmin}€`,
              html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                  <h2 style="color: #1a1a4b;">Nueva Gift Card vendida</h2>
                  <p><strong>Codigo:</strong> ${giftCard.code}</p>
                  <p><strong>Monto:</strong> ${amountEurosAdmin}€</p>
                  <p><strong>Destinatario:</strong> ${finalRecipientName || "N/A"} (${finalRecipientEmail || "N/A"})</p>
                  <p><strong>Fecha:</strong> ${new Date().toLocaleString("es-ES")}</p>
                </div>
              `,
            }).catch(() => {});

          }
          break;
        }

        // --- REGULAR PAYMENT --- (no escribir estado en profiles)
        break;
      }

      case "payment_intent.processing": {
        // Estado de pago se refleja en user_memberships, no en profiles
        break;
      }

      // identity.verification_session.* events are handled exclusively
      // by /api/webhooks/stripe-identity to avoid duplicate processing
      case "identity.verification_session.verified":
      case "identity.verification_session.requires_input":
      case "identity.verification_session.canceled":
      case "identity.verification_session.processing":
        console.log("ℹ️ Identity event delegated to stripe-identity webhook:", event.type);
        break;

      /**
       * ============================================================
       * 4️⃣ IDENTITY VERIFICATION — STRIPE IDENTITY WEBHOOK (deprecated block below, kept as reference)
       * ============================================================
       */
      case "identity.verification_session.verified_DISABLED": {
        const vs = event.data.object as Stripe.Identity.VerificationSession;
        const userId = vs.metadata?.user_id;
        if (!userId) break;

        const now2 = new Date().toISOString();

        await supabase
          .from("identity_verifications")
          .update({ status: "verified", verified_at: now2, updated_at: now2 })
          .eq("stripe_verification_id", vs.id);

        await supabase
          .from("profiles")
          .update({ identity_verified: true, identity_verified_at: now2, updated_at: now2 })
          .eq("id", userId);

        // Activar membresía si hay intent pagado pendiente
        const { data: pendingIntent } = await supabase
          .from("membership_intents")
          .select("id, membership_type, stripe_subscription_id")
          .eq("user_id", userId)
          .in("status", ["paid_pending_verification", "pending_payment"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (pendingIntent) {
          await supabase
            .from("user_memberships")
            .upsert(
              {
                user_id: userId,
                membership_type: pendingIntent.membership_type,
                status: "active",
                stripe_subscription_id: pendingIntent.stripe_subscription_id ?? null,
                identity_verified: true,
                updated_at: now2,
              },
              { onConflict: "user_id" }
            );

          await supabase
            .from("profiles")
            .update({
              membership_status: "active",
              membership_type: pendingIntent.membership_type,
              payment_status: "paid",
              updated_at: now2,
            })
            .eq("id", userId);

          await supabase
            .from("membership_intents")
            .update({ status: "active", updated_at: now2 })
            .eq("id", pendingIntent.id);

          // Email de acceso completo
          const { data: identityProfile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", userId)
            .single();

          if (identityProfile?.email) {
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://semzoprive.com";
            const membershipLabels: Record<string, string> = {
              petite: "Petite", essentiel: "L'Essentiel", signature: "Signature", prive: "Privé",
            };
            const label = membershipLabels[pendingIntent.membership_type] || pendingIntent.membership_type;
            await EmailServiceProduction.getInstance().sendWithResend({
              to: identityProfile.email,
              subject: `Acceso completo desbloqueado — Semzo Privé`,
              html: `
                <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #fff;">
                  <h1 style="color: #1a1a4b; font-size: 24px; margin-bottom: 8px;">Bienvenida al club, ${identityProfile.full_name?.split(" ")[0] || ""}.</h1>
                  <p style="color: #444; line-height: 1.7;">Tu identidad ha sido verificada y tu membresía <strong>${label}</strong> está completamente activa.</p>
                  <p style="color: #444; line-height: 1.7;">Ya puedes acceder al cat��logo completo y realizar tus primeras reservas.</p>
                  <div style="margin: 32px 0;">
                    <a href="${siteUrl}/catalog" style="background: #1a1a4b; color: white; padding: 14px 32px; text-decoration: none; font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase;">
                      Ver el catálogo
                    </a>
                  </div>
                  <hr style="border: none; border-top: 1px solid #e8e4df; margin: 32px 0;" />
                  <p style="color: #999; font-size: 12px;">Semzo Privé · <a href="mailto:info@semzoprive.com" style="color: #999;">info@semzoprive.com</a></p>
                </div>
              `,
            }).catch(() => {});
          }
        }

        console.log("✅ Identity VERIFIED for user:", userId);
        break;
      }

      // Bloques duplicados de payment_intent eliminados (ya manejados arriba)

      /**
       * ============================================================
       * PAGO FALLIDO - Notificar al usuario
       * ============================================================
       */
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const amountDue = invoice.amount_due ? (invoice.amount_due / 100).toFixed(2) : undefined;

        // Buscar membresia y usuario por stripe_customer_id
        const { data: failedMembership } = await supabase
          .from("user_memberships")
          .select("user_id, failed_payment_count")
          .eq("stripe_customer_id", customerId)
          .single();

        if (failedMembership) {
          // Incrementar contador de pagos fallidos en user_memberships
          const failedCount = (failedMembership.failed_payment_count || 0) + 1;
          await supabase
            .from("user_memberships")
            .update({
              failed_payment_count: failedCount,
              dunning_status: failedCount >= 3 ? "critical" : "warning",
              updated_at: now,
            })
            .eq("user_id", failedMembership.user_id);

          // Obtener datos de contacto del perfil (solo lectura de datos basicos)
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, full_name, first_name, last_name")
            .eq("id", failedMembership.user_id)
            .single();

          if (profile) {
            const customerName = profile.full_name || 
              `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || 
              "Cliente";

          // Enviar email de pago fallido
          const emailService = EmailServiceProduction.getInstance();
          await emailService.sendPaymentFailedEmail({
            userEmail: profile.email,
            userName: customerName,
            amount: amountDue,
            reason: invoice.last_finalization_error?.message || "Metodo de pago rechazado"
          });

          console.log(`[Stripe Webhook] Pago fallido para usuario ${failedMembership.user_id}, intento #${failedCount}`);
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const piUserId = pi.metadata?.user_id;

        if (piUserId) {
          // Actualizar failed_payment_count en user_memberships
          const { data: piMembership } = await supabase
            .from("user_memberships")
            .select("failed_payment_count")
            .eq("user_id", piUserId)
            .single();

          if (piMembership) {
            const piFailedCount = (piMembership.failed_payment_count || 0) + 1;
            await supabase
              .from("user_memberships")
              .update({
                failed_payment_count: piFailedCount,
                dunning_status: piFailedCount >= 3 ? "critical" : "warning",
                updated_at: now,
              })
              .eq("user_id", piUserId);
          }

          // Leer datos basicos del perfil para enviar email
          const { data: piProfile } = await supabase
            .from("profiles")
            .select("email, full_name, first_name, last_name")
            .eq("id", piUserId)
            .single();

          if (piProfile) {
            const piCustomerName = piProfile.full_name || 
              `${piProfile.first_name || ""} ${piProfile.last_name || ""}`.trim() || 
              "Cliente";
            const emailService = EmailServiceProduction.getInstance();
            await emailService.sendPaymentFailedEmail({
              userEmail: piProfile.email,
              userName: piCustomerName,
              amount: pi.amount ? (pi.amount / 100).toFixed(2) : undefined,
              reason: pi.last_payment_error?.message || "Pago rechazado"
            });
          }
        }
        break;
      }

      default:
        break;
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

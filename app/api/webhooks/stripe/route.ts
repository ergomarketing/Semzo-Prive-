
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

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

  const supabase = createClient();

  try {
    switch (event.type) {
      /**
       * ==========================
       * ACTIVACIÓN INICIAL (checkout.session.completed)
       * ==========================
       * Se activa cuando un cliente completa el proceso de pago de una nueva suscripción.
       * Crea o actualiza la membresía del usuario y su estado en el perfil.
       */
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Solo procesar si es una suscripción y tiene un ID de suscripción
        if (session.mode !== "subscription" || !session.subscription) {
          console.log("⏩ Checkout session no es de suscripción o falta subscription ID — skipping");
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        const userId = subscription.metadata?.user_id;

        if (!userId) {
          console.error("❌ Missing user_id in subscription metadata for checkout.session.completed");
          break;
        }

        const now = new Date().toISOString();

        // UPSERT en user_memberships
        const { error: upsertMembershipError } = await supabase
          .from("user_memberships")
          .upsert(
            {
              user_id: userId,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: subscription.id,
              membership_type: subscription.metadata?.membership_type || "petite", // Asume 'petite' si no está en metadata
              status: subscription.status, // 'active' o 'trialing'
              start_date: new Date(subscription.current_period_start * 1000).toISOString(),
              end_date: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
              updated_at: now,
            },
            { onConflict: "user_id" } // Actualiza si ya existe una membresía para este user_id
          );

        if (upsertMembershipError) {
          console.error("❌ Error upserting user_memberships on checkout.session.completed:", upsertMembershipError);
          break;
        }

        // Actualizar membership_status en profiles
        const { error: updateProfileError } = await supabase
          .from("profiles")
          .update({
            membership_status: subscription.status,
            updated_at: now,
          })
          .eq("id", userId);

        if (updateProfileError) {
          console.error("❌ Error updating profile membership_status on checkout.session.completed:", updateProfileError);
          break;
        }

        console.log("✅ Membership activated/updated via checkout.session.completed for user:", userId);
        break;
      }

      /**
       * ==========================
       * RENOVACIÓN / PAGO EXITOSO (invoice.payment_succeeded, invoice.paid)
       * ==========================
       * Se activa cuando una factura se paga exitosamente (renovación de suscripción).
       * Actualiza la membresía del usuario, su perfil y registra el pago en el historial.
       * También envía un email de confirmación de renovación.
       */
      case "invoice.payment_succeeded":
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;

        // 1️⃣ Ignorar la primera factura de creación de suscripción (ya manejada por checkout.session.completed)
        if (invoice.billing_reason === "subscription_create") {
          console.log("⏩ [INVOICE] Primera factura de creación de suscripción — skipping");
          break;
        }

        // 2️⃣ Asegurarse de que haya un ID de suscripción válido
        if (!invoice.subscription || typeof invoice.subscription !== "string") {
          console.log("⏩ [INVOICE] No hay subscription_id válido en la factura — skipping");
          break;
        }

        try {
          // 3️⃣ Recuperar la suscripción desde Stripe (fuente única de verdad)
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          const userId = subscription.metadata?.user_id;

          if (!userId) {
            console.error("❌ [INVOICE] Falta user_id en los metadatos de la suscripción para invoice.payment_succeeded");
            break;
          }

          const now = new Date().toISOString();

          // 4️⃣ Actualizar user_memberships (solo renovación - NO UPSERT)
          const { data: updatedMembership, error: membershipUpdateError } = await supabase
            .from("user_memberships")
            .update({
              status: subscription.status,
              start_date: new Date(subscription.current_period_start * 1000).toISOString(),
              end_date: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
              updated_at: now,
            })
            .eq("stripe_subscription_id", subscription.id)
            .select()
            .single();

          if (membershipUpdateError) {
            console.error("❌ [INVOICE] Error actualizando user_memberships:", membershipUpdateError);
            break;
          }

          console.log("✅ [INVOICE] Membresía renovada en user_memberships para user:", userId);

          // 5️⃣ Sincronizar membership_status en profiles
          const { error: profileUpdateError } = await supabase
            .from("profiles")
            .update({
              membership_status: subscription.status,
              updated_at: now,
            })
            .eq("id", userId);

          if (profileUpdateError) {
            console.error("❌ [INVOICE] Error actualizando profile membership_status:", profileUpdateError);
            break;
          }

          console.log("✅ [INVOICE] Profile membership_status actualizado para user:", userId);

          // 6️⃣ Registrar pago en payment_history (idempotente por stripe_invoice_id)
          const { error: paymentHistoryError } = await supabase
            .from("payment_history")
            .upsert(
              {
                user_id: userId,
                stripe_invoice_id: invoice.id,
                stripe_subscription_id: subscription.id,
                amount: invoice.amount_paid !== null ? invoice.amount_paid / 100 : 0, // Convertir a decimal
                currency: invoice.currency,
                status: "paid",
                description: `Renovación de membresía ${subscription.metadata?.membership_type || ""}`,
                payment_date: invoice.status_transitions?.paid_at
                  ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
                  : now,
                created_at: new Date(invoice.created * 1000).toISOString(),
              },
              { onConflict: "stripe_invoice_id" }
            );

          if (paymentHistoryError) {
            console.error("❌ [INVOICE] Error registrando pago en payment_history:", paymentHistoryError);
            break;
          }

          console.log("✅ [INVOICE] Pago registrado en payment_history para user:", userId);

          // 7️⃣ Obtener perfil para enviar emails
          const { data: profile, error: profileFetchError } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", userId)
            .maybeSingle();

          if (profileFetchError) {
            console.error("❌ [INVOICE] Error obteniendo perfil para email:", profileFetchError);
          }

          // 8️⃣ Enviar email al usuario si el perfil y email existen
          if (profile?.email) {
            const membershipNames: Record<string, string> = {
              petite: "Petite",
              essentiel: "L'Essentiel",
              signature: "Signature",
              prive: "Privé",
            };

            await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-email`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                to: profile.email,
                subject: "Tu membresía Semzo Privé ha sido renovada",
                html: `
                  <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
                    <h2>Membresía Renovada</h2>
                    <p>Hola ${profile.full_name || ""},</p>
                    <p>Tu membresía <strong>${
                      membershipNames[updatedMembership.membership_type] ||
                      updatedMembership.membership_type
                    }</strong> ha sido renovada correctamente.</p>
                    <p><strong>Monto:</strong> €${(invoice.amount_paid !== null ? invoice.amount_paid / 100 : 0).toFixed(2)}</p>
                    <p><strong>Válida hasta:</strong> ${new Date(
                      subscription.current_period_end * 1000
                    ).toLocaleDateString("es-ES")}</p>
                    ${invoice.invoice_pdf ? `<p><a href="${invoice.invoice_pdf}">Descargar factura</a></p>` : ""}
                  </div>
                `,
              }),
            }).catch((emailError) => {
              console.error("❌ [INVOICE] Error enviando email de renovación:", emailError);
            });
          }

          console.log("✅ [INVOICE] Flujo de renovación completado para user:", userId);
        } catch (error: any) {
          console.error("❌ [INVOICE] Error en el flujo de renovación:", error?.message);
        }
        break;
      }

      /**
       * ==========================
       * ACTUALIZACIÓN DE SUSCRIPCIÓN (customer.subscription.updated)
       * ==========================
       * Se activa cuando una suscripción cambia de estado (ej. de 'active' a 'past_due', o cambio de plan).
       * Actualiza el estado de la membresía del usuario y su perfil.
       */
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;

        if (!userId) {
          console.error("❌ Missing user_id in subscription metadata for customer.subscription.updated");
          break;
        }

        const now = new Date().toISOString();

        // Actualizar user_memberships
        const { error: membershipUpdateError } = await supabase
          .from("user_memberships")
          .update({
            status: subscription.status,
            membership_type: subscription.metadata?.membership_type || "petite",
            start_date: new Date(subscription.current_period_start * 1000).toISOString(),
            end_date: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: now,
          })
          .eq("stripe_subscription_id", subscription.id);

        if (membershipUpdateError) {
          console.error("❌ Error actualizando user_memberships on customer.subscription.updated:", membershipUpdateError);
          break;
        }

        // Actualizar membership_status en profiles
        const { error: profileUpdateError } = await supabase
          .from("profiles")
          .update({
            membership_status: subscription.status,
            updated_at: now,
          })
          .eq("id", userId);

        if (profileUpdateError) {
          console.error("❌ Error actualizando profile membership_status on customer.subscription.updated:", profileUpdateError);
          break;
        }

        console.log("✅ Membership updated via customer.subscription.updated for user:", userId);
        break;
      }

      /**
       * ==========================
       * CANCELACIÓN (customer.subscription.deleted)
       * ==========================
       * Se activa cuando una suscripción es cancelada o eliminada.
       * Actualiza el estado de la membresía del usuario y su perfil a 'cancelled'.
       */
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;

        if (!userId) {
          console.error("❌ Missing user_id in subscription metadata for customer.subscription.deleted");
          break;
        }

        const now = new Date().toISOString();

        // Actualizar user_memberships a 'cancelled'
        const { error: membershipUpdateError } = await supabase
          .from("user_memberships")
          .update({
            status: "cancelled",
            cancel_at_period_end: false, // La suscripción ya está cancelada
            updated_at: now,
          })
          .eq("stripe_subscription_id", subscription.id);

        if (membershipUpdateError) {
          console.error("❌ Error actualizando user_memberships on customer.subscription.deleted:", membershipUpdateError);
          break;
        }

        // Actualizar membership_status en profiles a 'cancelled'
        const { error: profileUpdateError } = await supabase
          .from("profiles")
          .update({
            membership_status: "cancelled",
            updated_at: now,
          })
          .eq("id", userId);

        if (profileUpdateError) {
          console.error("❌ Error actualizando profile membership_status on customer.subscription.deleted:", profileUpdateError);
          break;
        }

        console.log("✅ Membership cancelled via customer.subscription.deleted for user:", userId);
        break;
      }

      default:
        console.log("ℹ️ Unhandled event type:", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

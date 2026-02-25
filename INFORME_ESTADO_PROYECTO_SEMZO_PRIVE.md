## Informe Técnico: Estado Actual del Proyecto Semzo-Prive-

**Fecha:** 19 de febrero de 2026
**Autor:** Manus AI

### 1. Resumen Ejecutivo

Este informe detalla el estado actual del proyecto `Semzo-Prive-`, una aplicación web desarrollada con Next.js, React y Supabase, con una integración reciente del sistema de pagos a través de Stripe. El objetivo principal es proporcionar una visión técnica completa de la arquitectura, la estructura de la base de datos y la implementación del webhook de Stripe, para facilitar la comprensión y la colaboración con el equipo de ingeniería.

### 2. Visión General del Proyecto

`Semzo-Prive-` es un fork de un proyecto `v0.dev`, lo que implica que su desarrollo y despliegue están estrechamente vinculados a la plataforma Vercel y a la herramienta `v0.dev` para la generación automática de código. Esto sugiere un enfoque de desarrollo rápido y basado en componentes, con actualizaciones automáticas del repositorio a partir de los cambios realizados en `v0.dev` [1].

**Tecnologías Clave:**

*   **Frontend:** Next.js (versión 15.2.8), React (versión 19), TailwindCSS.
*   **Backend/Base de Datos:** Supabase (utilizando `@supabase/ssr` y `@supabase/supabase-js` para interacción), PostgreSQL como base de datos subyacente.
*   **Pagos:** Stripe (utilizando `@stripe/react-stripe-js`, `@stripe/stripe-js` y `stripe` para la API de backend).
*   **Autenticación:** Integrada con Supabase `auth.users`.
*   **Utilidades:** `Nodemailer`, `Resend` para envío de correos, `Twilio` para SMS, `Vercel Blob` para almacenamiento.

### 3. Arquitectura de la Aplicación

La aplicación sigue una arquitectura moderna basada en Next.js, lo que implica renderizado del lado del servidor (SSR), generación de sitios estáticos (SSG) y rutas API. La integración con Supabase se maneja tanto en el lado del cliente como del servidor, aprovechando las capacidades de SSR para una gestión de datos eficiente y segura.

El sistema de pagos se integra a través de Stripe, utilizando un webhook para manejar eventos asíncronos como la creación de suscripciones, pagos exitosos o fallidos, y actualizaciones de facturas. Este webhook es crucial para mantener la sincronización entre el estado de las suscripciones en Stripe y la base de datos de Supabase.

### 4. Estructura de la Base de Datos (Supabase)

El proyecto utiliza Supabase como su backend de base de datos, con un esquema que soporta la gestión de usuarios, perfiles, membresías y pagos. Las tablas clave identificadas son `profiles`, `user_memberships` y `payments`.

#### 4.1. Tabla `profiles`

Esta tabla almacena información detallada del perfil del usuario, extendiendo los datos básicos de `auth.users`. Es la tabla principal para la información de usuario en la aplicación.

| Columna                   | Tipo de Dato        | Descripción                                                                 |
| :------------------------ | :------------------ | :-------------------------------------------------------------------------- |
| `id`                      | `UUID`              | Clave primaria, referencia a `auth.users(id)`.                              |
| `email`                   | `TEXT`              | Correo electrónico del usuario.                                             |
| `full_name`               | `TEXT`              | Nombre completo del usuario.                                                |
| `first_name`              | `TEXT`              | Primer nombre.                                                              |
| `last_name`               | `TEXT`              | Apellido.                                                                   |
| `phone`                   | `TEXT`              | Número de teléfono.                                                         |
| `avatar_url`              | `TEXT`              | URL del avatar del usuario.                                                 |
| `website`                 | `TEXT`              | Sitio web personal.                                                         |
| `bio`                     | `TEXT`              | Biografía del usuario.                                                      |
| `location`                | `TEXT`              | Ubicación.                                                                  |
| `birth_date`              | `DATE`              | Fecha de nacimiento.                                                        |
| `gender`                  | `TEXT`              | Género.                                                                     |
| `preferences`             | `JSONB`             | Preferencias del usuario (JSON).                                            |
| `metadata`                | `JSONB`             | Metadatos adicionales (JSON).                                               |
| `is_active`               | `BOOLEAN`           | Indica si el perfil está activo.                                            |
| `email_verified`          | `BOOLEAN`           | Indica si el correo electrónico ha sido verificado.                         |
| `phone_verified`          | `BOOLEAN`           | Indica si el teléfono ha sido verificado.                                   |
| `newsletter_subscribed`   | `BOOLEAN`           | Indica si está suscrito al boletín.                                         |
| `marketing_emails`        | `BOOLEAN`           | Permiso para recibir correos de marketing.                                  |
| `created_at`              | `TIMESTAMP WITH TIME ZONE` | Fecha de creación del perfil.                                               |
| `updated_at`              | `TIMESTAMP WITH TIME ZONE` | Última fecha de actualización del perfil (con trigger automático).          |
| `last_login`              | `TIMESTAMP WITH TIME ZONE` | Último inicio de sesión.                                                    |

**Políticas RLS:** Implementadas para permitir a los usuarios ver, actualizar, insertar y eliminar su propio perfil (`auth.uid() = id`).

#### 4.2. Tabla `user_memberships`

Esta tabla gestiona el estado de las membresías de los usuarios, incluyendo detalles de la suscripción de Stripe.

| Columna                       | Tipo de Dato        | Descripción                                                                 |
| :---------------------------- | :------------------ | :-------------------------------------------------------------------------- |
| `id`                          | `UUID`              | Clave primaria.                                                             |
| `user_id`                     | `UUID`              | Referencia a `auth.users(id)`. Clave única.                                 |
| `membership_type`             | `TEXT`              | Tipo de membresía (`free`, `essentiel`, `signature`, `prive`).              |
| `status`                      | `TEXT`              | Estado de la membresía (`active`, `suspended`, `cancelled`, `expired`).     |
| `start_date`                  | `TIMESTAMPTZ`       | Fecha de inicio de la membresía.                                            |
| `end_date`                    | `TIMESTAMPTZ`       | Fecha de fin de la membresía.                                               |
| `can_make_reservations`       | `BOOLEAN`           | Permiso para realizar reservas.                                             |
| `stripe_subscription_id`      | `TEXT`              | ID de la suscripción en Stripe.                                             |
| `stripe_customer_id`          | `TEXT`              | ID del cliente en Stripe.                                                   |
| `stripe_payment_method_id`    | `TEXT`              | ID del método de pago guardado en Stripe.                                   |
| `payment_method_verified`     | `BOOLEAN`           | Indica si el método de pago fue verificado.                                 |
| `failed_payment_count`        | `INTEGER`           | Contador de intentos de cobro fallidos.                                     |
| `dunning_status`              | `TEXT`              | Estado de recuperación de pagos (`grace_period`, `warning_sent`, `suspended`).|
| `created_at`                  | `TIMESTAMPTZ`       | Fecha de creación.                                                          |
| `updated_at`                  | `TIMESTAMPTZ`       | Última fecha de actualización (con trigger automático).                     |

**Políticas RLS:** Implementadas para permitir a los usuarios ver y actualizar su propia membresía (`auth.uid() = user_id`).

#### 4.3. Tabla `payments`

Esta tabla registra todas las transacciones de pago realizadas en la aplicación.

| Columna                       | Tipo de Dato        | Descripción                                                                 |
| :---------------------------- | :------------------ | :-------------------------------------------------------------------------- |
| `id`                          | `UUID`              | Clave primaria.                                                             |
| `user_id`                     | `UUID`              | Referencia a `public.profiles(id)`.                                         |
| `reservation_id`              | `UUID`              | Referencia a `public.reservations(id)` (opcional).                          |
| `amount`                      | `DECIMAL(10,2)`     | Monto del pago.                                                             |
| `currency`                    | `VARCHAR(3)`        | Moneda del pago (por defecto 'EUR').                                        |
| `status`                      | `VARCHAR(50)`       | Estado del pago (`pending`, `completed`, `failed`, `refunded`).             |
| `payment_method`              | `VARCHAR(50)`       | Método de pago utilizado.                                                   |
| `stripe_payment_id`           | `TEXT`              | ID del pago en Stripe.                                                      |
| `stripe_payment_intent_id`    | `TEXT`              | ID del Payment Intent en Stripe.                                            |
| `description`                 | `TEXT`              | Descripción del pago.                                                       |
| `created_at`                  | `TIMESTAMP WITH TIME ZONE` | Fecha de creación.                                                          |
| `updated_at`                  | `TIMESTAMP WITH TIME ZONE` | Última fecha de actualización (con trigger automático).                     |

**Políticas RLS:** Implementadas para permitir a los usuarios ver sus propios pagos (`auth.uid() = user_id`) y una política de administración para ciertos correos electrónicos.

### 5. Integración de Pagos con Stripe (Webhook)

La integración de Stripe se realiza a través de un webhook que escucha eventos específicos para mantener la base de datos de Supabase sincronizada con el estado de las suscripciones y pagos en Stripe. La implementación actual del webhook (`/api/stripe-webhook/route.ts`) maneja los siguientes eventos clave:

*   `customer.subscription.created`
*   `customer.subscription.updated`
*   `customer.subscription.deleted`
*   `invoice.payment_succeeded`
*   `invoice.payment_failed`
*   `customer.created`
*   `customer.updated`
*   `payment_method.attached`

El webhook está diseñado para:

1.  **Verificar la firma de Stripe:** Asegura que las solicitudes provienen de Stripe y no han sido manipuladas.
2.  **Manejar eventos de suscripción:** Actualiza la tabla `user_memberships` con el tipo de membresía, estado, fechas de inicio/fin, y IDs de Stripe (`stripe_subscription_id`, `stripe_customer_id`).
3.  **Manejar eventos de factura/pago:** Registra los pagos en la tabla `payments`, incluyendo el monto, estado, IDs de Stripe (`stripe_payment_id`, `stripe_payment_intent_id`) y actualiza el contador de pagos fallidos o el estado de dunning en `user_memberships`.
4.  **Manejar eventos de cliente y método de pago:** Actualiza los `stripe_customer_id` y `stripe_payment_method_id` en `user_memberships` y `profiles` (si aplica).
5.  **Notificaciones:** Envía correos electrónicos de confirmación de suscripción o de fallo de pago utilizando `Resend`.

#### 5.1. Código del Webhook de Stripe (Optimizado)

```typescript
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

// Inicialización de Stripe y Resend
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});
const resend = new Resend(process.env.RESEND_API_KEY);

// Inicialización de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string // Usar service_role_key para bypass RLS
);

// Función para enviar correo electrónico
async function sendEmail(to: string, subject: string, html: string) {
  try {
    await resend.emails.send({
      from: "Semzo Prive <onboarding@semzoprive.com>",
      to: [to],
      subject: subject,
      html: html,
    });
    console.log(`✅ Email sent to ${to} with subject: ${subject}`);
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
}

export async function POST(req: NextRequest) {
  let event: Stripe.Event;

  try {
    const buf = await req.text();
    const sig = req.headers.get("stripe-signature") as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Error message: ${err.message}`);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  console.log("✅ Successfully verified Stripe event.");

  try {
    const data = event.data.object as any;

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        const subscription = data as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        const customerId = subscription.customer as string;

        if (!userId) {
          console.warn(
            `⚠️ Subscription event ${event.type} received without userId in metadata for customer ${customerId}.`
          );
          break;
        }

        const subscriptionStatus = subscription.status;
        const membershipType = subscription.items.data[0].price.lookup_key || "";
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
        const currentPeriodStart = new Date(subscription.current_period_start * 1000).toISOString();

        const { data: existingMembership, error: fetchError } = await supabase
          .from("user_memberships")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (fetchError && fetchError.code !== "PGRST116") { // PGRST116 means no rows found
          console.error("❌ Error fetching existing membership:", fetchError);
          throw fetchError;
        }

        const membershipData = {
          user_id: userId,
          membership_type: membershipType,
          status: subscriptionStatus,
          start_date: currentPeriodStart,
          end_date: currentPeriodEnd,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: customerId,
          can_make_reservations: membershipType === "prive" || membershipType === "signature", // Ejemplo de lógica
          updated_at: new Date().toISOString(),
        };

        if (existingMembership) {
          const { error: updateError } = await supabase
            .from("user_memberships")
            .update(membershipData)
            .eq("user_id", userId);

          if (updateError) {
            console.error("❌ Error updating user membership:", updateError);
            throw updateError;
          }
          console.log(`✅ User membership updated for user ${userId}. Status: ${subscriptionStatus}`);
        } else {
          const { error: insertError } = await supabase
            .from("user_memberships")
            .insert(membershipData);

          if (insertError) {
            console.error("❌ Error inserting user membership:", insertError);
            throw insertError;
          }
          console.log(`✅ New user membership created for user ${userId}. Status: ${subscriptionStatus}`);
        }

        // Enviar correo de confirmación/actualización
        if (event.type === "customer.subscription.created") {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", userId)
            .single();

          if (profileError) {
            console.error("❌ Error fetching profile for email:", profileError);
          } else if (profileData?.email) {
            await sendEmail(
              profileData.email,
              "¡Tu suscripción a Semzo Prive ha sido activada!",
              `<p>Hola ${profileData.full_name || ""},</p>
               <p>Tu suscripción de tipo <strong>${membershipType}</strong> ha sido activada exitosamente.</p>
               <p>Puedes gestionar tu suscripción en tu panel de usuario.</p>
               <p>Gracias por ser parte de Semzo Prive.</p>`
            );
          }
        }
        break;

      case "invoice.payment_succeeded":
        const invoiceSucceeded = data as Stripe.Invoice;
        const customerEmailSucceeded = invoiceSucceeded.customer_email;
        const userIdSucceeded = invoiceSucceeded.metadata?.userId;
        const subscriptionIdSucceeded = invoiceSucceeded.subscription as string;

        if (!userIdSucceeded) {
          console.warn(
            `⚠️ Payment succeeded event received without userId in metadata for invoice ${invoiceSucceeded.id}.`
          );
          break;
        }

        // Actualizar el estado de la membresía a activa y resetear el contador de fallos
        await supabase
          .from("user_memberships")
          .update({ status: "active", failed_payment_count: 0, dunning_status: null, updated_at: new Date().toISOString() })
          .eq("user_id", userIdSucceeded);

        // Registrar el pago en la tabla `payments`
        const { error: paymentInsertError } = await supabase.from("payments").insert({
          user_id: userIdSucceeded,
          amount: invoiceSucceeded.amount_paid ? invoiceSucceeded.amount_paid / 100 : 0, // Convertir a la unidad monetaria correcta
          currency: invoiceSucceeded.currency?.toUpperCase() || "EUR",
          status: "completed",
          payment_method: invoiceSucceeded.payment_reason || "subscription_payment",
          stripe_payment_id: invoiceSucceeded.payment_intent as string,
          stripe_payment_intent_id: invoiceSucceeded.payment_intent as string,
          description: invoiceSucceeded.description || `Pago de suscripción ${subscriptionIdSucceeded}`,
          created_at: new Date(invoiceSucceeded.created * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (paymentInsertError) {
          console.error("❌ Error inserting successful payment record:", paymentInsertError);
          throw paymentInsertError;
        }
        console.log(`✅ Payment succeeded recorded for user ${userIdSucceeded}. Invoice: ${invoiceSucceeded.id}`);

        // Enviar correo de confirmación de pago
        if (customerEmailSucceeded) {
          await sendEmail(
            customerEmailSucceeded,
            "¡Tu pago a Semzo Prive ha sido procesado con éxito!",
            `<p>Hola,</p>
             <p>Tu pago de <strong>${invoiceSucceeded.amount_paid ? invoiceSucceeded.amount_paid / 100 : 0} ${invoiceSucceeded.currency?.toUpperCase()}</strong> ha sido procesado correctamente.</p>
             <p>Gracias por tu confianza.</p>`
          );
        }
        break;

      case "invoice.payment_failed":
        const invoiceFailed = data as Stripe.Invoice;
        const customerEmailFailed = invoiceFailed.customer_email;
        const userIdFailed = invoiceFailed.metadata?.userId;

        if (!userIdFailed) {
          console.warn(
            `⚠️ Payment failed event received without userId in metadata for invoice ${invoiceFailed.id}.`
          );
          break;
        }

        // Incrementar contador de pagos fallidos y actualizar estado de dunning
        const { data: currentMembershipFailed, error: fetchMembershipFailedError } = await supabase
          .from("user_memberships")
          .select("failed_payment_count")
          .eq("user_id", userIdFailed)
          .single();

        const newFailedCount = (currentMembershipFailed?.failed_payment_count || 0) + 1;
        let dunningStatus = "grace_period";
        if (newFailedCount >= 3) { // Ejemplo: suspender después de 3 fallos
          dunningStatus = "suspended";
        } else if (newFailedCount >= 1) {
          dunningStatus = "warning_sent";
        }

        await supabase
          .from("user_memberships")
          .update({ failed_payment_count: newFailedCount, dunning_status: dunningStatus, updated_at: new Date().toISOString() })
          .eq("user_id", userIdFailed);

        // Registrar el pago fallido en la tabla `payments`
        const { error: paymentFailedInsertError } = await supabase.from("payments").insert({
          user_id: userIdFailed,
          amount: invoiceFailed.amount_due ? invoiceFailed.amount_due / 100 : 0,
          currency: invoiceFailed.currency?.toUpperCase() || "EUR",
          status: "failed",
          payment_method: invoiceFailed.payment_reason || "subscription_payment",
          stripe_payment_id: invoiceFailed.payment_intent as string,
          stripe_payment_intent_id: invoiceFailed.payment_intent as string,
          description: invoiceFailed.description || `Fallo de pago de suscripción`,
          created_at: new Date(invoiceFailed.created * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (paymentFailedInsertError) {
          console.error("❌ Error inserting failed payment record:", paymentFailedInsertError);
          throw paymentFailedInsertError;
        }
        console.log(`❌ Payment failed recorded for user ${userIdFailed}. Invoice: ${invoiceFailed.id}`);

        // Enviar correo de notificación de fallo de pago
        if (customerEmailFailed) {
          await sendEmail(
            customerEmailFailed,
            "¡Tu pago a Semzo Prive ha fallado!",
            `<p>Hola,</p>
             <p>Lamentamos informarte que tu pago de <strong>${invoiceFailed.amount_due ? invoiceFailed.amount_due / 100 : 0} ${invoiceFailed.currency?.toUpperCase()}</strong> ha fallado.</p>
             <p>Por favor, actualiza tu método de pago para evitar la interrupción de tu servicio.</p>`
          );
        }
        break;

      case "customer.created":
      case "customer.updated":
        const customer = data as Stripe.Customer;
        const customerUserId = customer.metadata?.userId;

        if (!customerUserId) {
          console.warn(
            `⚠️ Customer event ${event.type} received without userId in metadata for customer ${customer.id}.`
          );
          break;
        }

        await supabase
          .from("user_memberships")
          .update({ stripe_customer_id: customer.id, updated_at: new Date().toISOString() })
          .eq("user_id", customerUserId);
        console.log(`✅ Stripe customer ID updated for user ${customerUserId}.`);
        break;

      case "payment_method.attached":
        const paymentMethod = data as Stripe.PaymentMethod;
        const attachedCustomerId = paymentMethod.customer as string;

        const { data: userMembershipByCustomer, error: fetchUserError } = await supabase
          .from("user_memberships")
          .select("user_id")
          .eq("stripe_customer_id", attachedCustomerId)
          .single();

        if (fetchUserError) {
          console.error("❌ Error fetching user by customer ID:", fetchUserError);
          throw fetchUserError;
        }

        if (userMembershipByCustomer?.user_id) {
          await supabase
            .from("user_memberships")
            .update({ stripe_payment_method_id: paymentMethod.id, payment_method_verified: true, updated_at: new Date().toISOString() })
            .eq("user_id", userMembershipByCustomer.user_id);
          console.log(`✅ Payment method attached and verified for user ${userMembershipByCustomer.user_id}.`);
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
```

### 6. Estado Actual y Próximos Pasos

El proyecto `Semzo-Prive-` se encuentra en un estado funcional con una sólida base para la gestión de usuarios, perfiles y membresías, y una integración de pagos con Stripe que ha sido recientemente desplegada y verificada. La implementación del webhook de Stripe es robusta y maneja los eventos críticos para mantener la coherencia de los datos.

**Logros Recientes:**

*   Despliegue exitoso del webhook de Stripe optimizado, asegurando la sincronización de suscripciones y pagos con la base de datos de Supabase.
*   Manejo de eventos de creación, actualización y eliminación de suscripciones.
*   Registro detallado de pagos exitosos y fallidos en la tabla `payments`.
*   Implementación de lógica para el manejo de pagos fallidos (contador de intentos, estado de dunning).
*   Envío de notificaciones por correo electrónico para eventos clave de suscripción y pago.

**Próximos Pasos y Consideraciones:**

1.  **Monitoreo y Alertas:** Implementar un sistema de monitoreo más avanzado para el webhook de Stripe y la base de datos de Supabase, con alertas en tiempo real para detectar y responder rápidamente a cualquier anomalía o error.
2.  **Pruebas Exhaustivas:** Realizar pruebas de integración y de estrés exhaustivas para asegurar la resiliencia del sistema bajo diferentes escenarios de carga y fallo, especialmente en el flujo de pagos.
3.  **Documentación Adicional:** Crear documentación interna detallada para el equipo de desarrollo sobre el flujo completo de la gestión de membresías y pagos, incluyendo diagramas de secuencia y de estado.
4.  **Optimización de Consultas:** Revisar y optimizar las consultas a la base de datos en el webhook y otras partes críticas de la aplicación para asegurar un rendimiento óptimo a medida que crece la base de usuarios.
5.  **Manejo de Reembolsos/Disputas:** Considerar la implementación de lógica para manejar eventos de reembolso y disputas de Stripe, actualizando la tabla `payments` y `user_memberships` según sea necesario.
6.  **Expansión de Membresías:** Si se planean nuevos tipos de membresía, asegurar que la lógica en el webhook (`membershipType === "prive" || membershipType === "signature"`) sea fácilmente extensible.

### 7. Referencias

[1] v0.dev. (n.d.). *v0.dev - Build your app*. Recuperado de [https://v0.dev/chat/projects/HxEzIdI9UNR](https://v0.dev/chat/projects/HxEzIdI9UNR)

---

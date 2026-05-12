/**
 * ============================================================
 * WEBHOOK DE REFERIDOS — AISLADO DEL WEBHOOK PRINCIPAL
 * ============================================================
 *
 * Endpoint: POST /api/webhooks/referrals/stripe
 *
 * Reglas estrictas de aislamiento (regla de oro):
 *   - NO toca el webhook principal /api/webhooks/stripe
 *   - NO toca la tabla `stripe_processed_events`
 *   - NO mueve dinero ni acredita balance (eso es BLOQUE 4 cron)
 *   - Usa su PROPIO secret: STRIPE_WEBHOOK_SECRET_REFERRALS
 *     (con fallback a STRIPE_WEBHOOK_SECRET para facilitar tests
 *     iniciales antes de crear el endpoint en Stripe Dashboard)
 *   - Idempotencia con su propia tabla: referrals_webhook_events
 *
 * Comportamiento:
 *   1) Verifica firma Stripe
 *   2) Idempotencia: registra event.id; si ya existia, devuelve 200
 *   3) Solo procesa `invoice.payment_succeeded`
 *   4) Localiza referral pending para el customer de la factura
 *   5) Si la subscription tiene >=60 dias de antiguedad, marca el
 *      referral como `qualified` (transicion atomica via UPDATE
 *      condicional, sin races)
 *   6) Devuelve 200 SIEMPRE (excepto firma invalida) para que Stripe
 *      no reintente. Errores internos se loguean.
 *
 * Lo que NO hace (deliberadamente):
 *   - No suma euros al referral_balance del referrer
 *   - No envia emails
 *   - No cancela ni rechaza referidos
 *   - No procesa subscription.deleted ni refunds
 */

import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// Cliente Stripe propio (no compartido con otros webhooks).
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

// Secret dedicado. Si no esta configurado todavia en Vercel, usa el
// secret del webhook principal como fallback temporal (solo para fase
// de pruebas iniciales; en produccion debe ser su propio endpoint).
const webhookSecret =
  process.env.STRIPE_WEBHOOK_SECRET_REFERRALS ||
  process.env.STRIPE_WEBHOOK_SECRET ||
  ""

// Cliente Supabase con service role (acceso solo servidor, RLS bypass).
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// Constante de negocio: 60 dias de membresia activa para calificar.
// Definido aqui (no en env) porque es regla del programa, no config.
const QUALIFY_DAYS = 60
const MS_PER_DAY = 86_400_000

/**
 * Obtiene la fecha de inicio de la subscription. Stripe expone
 * varios campos posibles segun la version del API; cogemos el primero
 * disponible. Devuelve null si la subscription no tiene fecha valida.
 */
function getSubscriptionStart(sub: Stripe.Subscription): Date | null {
  const epoch =
    (sub as any).start_date ??
    sub.created ??
    null
  if (!epoch || isNaN(epoch)) return null
  const d = new Date(epoch * 1000)
  return isNaN(d.getTime()) ? null : d
}

export async function POST(req: NextRequest) {
  // 1) Verificar firma de Stripe.
  let event: Stripe.Event
  try {
    const body = await req.text()
    const signature = req.headers.get("stripe-signature") || ""
    if (!webhookSecret) {
      console.error("[v0] referrals webhook: STRIPE_WEBHOOK_SECRET_REFERRALS no configurado")
      return NextResponse.json({ error: "Webhook secret missing" }, { status: 500 })
    }
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error("[v0] referrals webhook: firma invalida", err?.message)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  // 2) Idempotencia: insertar event.id en tabla dedicada. Si ya existia,
  // el INSERT falla con UNIQUE violation y devolvemos 200 sin procesar.
  // Esto evita el race condition de "comprobar y luego insertar".
  const { error: dedupError } = await supabase
    .from("referrals_webhook_events")
    .insert({ event_id: event.id, event_type: event.type })

  if (dedupError) {
    // Codigo 23505 = unique_violation -> ya procesado, OK.
    if ((dedupError as any).code === "23505") {
      return NextResponse.json({ received: true, skipped: "already_processed" })
    }
    // Otro error de DB: logueamos pero devolvemos 200 para que Stripe
    // no reintente indefinidamente. Si DB esta caida, mejor perder un
    // evento que bombardear con retries.
    console.error("[v0] referrals webhook: dedup insert error", dedupError)
    return NextResponse.json({ received: true, skipped: "db_error" })
  }

  // 3) Solo nos interesa invoice.payment_succeeded en este bloque.
  if (event.type !== "invoice.payment_succeeded") {
    await supabase
      .from("referrals_webhook_events")
      .update({
        processed_at: new Date().toISOString(),
        result: { skipped: "irrelevant_event_type" },
      })
      .eq("event_id", event.id)
    return NextResponse.json({ received: true, skipped: "irrelevant_event_type" })
  }

  // 4) Procesar invoice.payment_succeeded.
  try {
    const invoice = event.data.object as Stripe.Invoice
    const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id
    const subscriptionId =
      typeof invoice.subscription === "string"
        ? invoice.subscription
        : invoice.subscription?.id

    if (!customerId || !subscriptionId) {
      await supabase
        .from("referrals_webhook_events")
        .update({
          processed_at: new Date().toISOString(),
          result: { skipped: "no_customer_or_subscription" },
        })
        .eq("event_id", event.id)
      return NextResponse.json({ received: true, skipped: "no_customer_or_subscription" })
    }

    // 4a) Localizar el usuario asociado a ese customer.
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle()

    if (!profile?.id) {
      await supabase
        .from("referrals_webhook_events")
        .update({
          processed_at: new Date().toISOString(),
          result: { skipped: "no_profile_for_customer", customer: customerId },
        })
        .eq("event_id", event.id)
      return NextResponse.json({ received: true, skipped: "no_profile_for_customer" })
    }

    // 4b) Buscar referral pendiente para este usuario.
    // Si ya esta `qualified` o `rewarded`, no hacemos nada.
    // Si es `pending` (o `paid` si v2 esta aplicada), candidato a subir.
    const { data: referral } = await supabase
      .from("referrals")
      .select("id, status, created_at")
      .eq("referred_user_id", profile.id)
      .in("status", ["pending", "paid"])
      .maybeSingle()

    if (!referral?.id) {
      await supabase
        .from("referrals_webhook_events")
        .update({
          processed_at: new Date().toISOString(),
          result: { skipped: "no_active_referral", user_id: profile.id },
        })
        .eq("event_id", event.id)
      return NextResponse.json({ received: true, skipped: "no_active_referral" })
    }

    // 4c) Calcular antiguedad de la subscription en Stripe.
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const startedAt = getSubscriptionStart(subscription)
    if (!startedAt) {
      await supabase
        .from("referrals_webhook_events")
        .update({
          processed_at: new Date().toISOString(),
          result: { skipped: "no_subscription_start_date", subscription: subscriptionId },
        })
        .eq("event_id", event.id)
      return NextResponse.json({ received: true, skipped: "no_subscription_start_date" })
    }

    const ageDays = Math.floor((Date.now() - startedAt.getTime()) / MS_PER_DAY)

    // 4d) Si NO ha cumplido 60 dias, no marcamos nada todavia. Esperamos
    // al siguiente invoice.payment_succeeded. El sistema sigue siendo
    // idempotente porque el dedup de event.id ya esta registrado.
    if (ageDays < QUALIFY_DAYS) {
      await supabase
        .from("referrals_webhook_events")
        .update({
          processed_at: new Date().toISOString(),
          result: {
            skipped: "not_yet_60_days",
            age_days: ageDays,
            referral_id: referral.id,
          },
        })
        .eq("event_id", event.id)
      return NextResponse.json({ received: true, skipped: "not_yet_60_days", age_days: ageDays })
    }

    // 4e) Cumplio 60+ dias: marcar qualified. UPDATE condicional para
    // evitar pisar un estado mas avanzado (rewarded) si llega un evento
    // tardio. Solo subimos desde pending/paid.
    const nowIso = new Date().toISOString()
    const { data: updated, error: updateError } = await supabase
      .from("referrals")
      .update({ status: "qualified", qualified_at: nowIso })
      .eq("id", referral.id)
      .in("status", ["pending", "paid"])
      .select("id, status")
      .maybeSingle()

    if (updateError) {
      console.error("[v0] referrals webhook: update qualified failed", updateError)
      await supabase
        .from("referrals_webhook_events")
        .update({
          processed_at: new Date().toISOString(),
          result: { error: "update_failed", message: updateError.message },
        })
        .eq("event_id", event.id)
      // Devolvemos 200 para no provocar retries en bucle.
      return NextResponse.json({ received: true, skipped: "update_failed" })
    }

    await supabase
      .from("referrals_webhook_events")
      .update({
        processed_at: new Date().toISOString(),
        result: {
          action: updated ? "marked_qualified" : "no_op",
          referral_id: referral.id,
          age_days: ageDays,
        },
      })
      .eq("event_id", event.id)

    return NextResponse.json({
      received: true,
      action: updated ? "marked_qualified" : "no_op",
      referral_id: referral.id,
      age_days: ageDays,
    })
  } catch (err: any) {
    console.error("[v0] referrals webhook: unexpected error", err)
    await supabase
      .from("referrals_webhook_events")
      .update({
        processed_at: new Date().toISOString(),
        result: { error: "unexpected", message: err?.message },
      })
      .eq("event_id", event.id)
    // 200 para evitar retries; el error queda registrado en la tabla.
    return NextResponse.json({ received: true, skipped: "unexpected_error" })
  }
}

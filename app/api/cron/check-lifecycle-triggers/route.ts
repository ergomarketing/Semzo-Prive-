import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import Stripe from "stripe"
import { enrollLifecycleSequence } from "@/lib/lifecycle-emails/enroll"

/**
 * Cron diario de detección/enrolamiento para las secuencias de lifecycle de
 * la Fase 3. Solo enrola — el envío real lo hace send-lifecycle-emails.
 * Idempotente: cada entity_id incluye lo necesario para no re-enrolar el
 * mismo ciclo/evento en ejecuciones sucesivas.
 *
 * AISLADO de la Secuencia 1 (leads/newsletter) — no toca leads ni email_templates.
 */
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2024-06-20" })

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}

function dateOnly(iso: string) {
  return iso.slice(0, 10)
}

async function getRecipient(userId: string): Promise<{ email: string; name: string } | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name, first_name")
    .eq("id", userId)
    .maybeSingle()

  if (!profile?.email) return null
  return { email: profile.email, name: profile.full_name || profile.first_name || "" }
}

async function checkCheckoutAbandoned() {
  let enrolled = 0
  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString() // > 1h desde initiated_at

  const { data: intents } = await supabase
    .from("membership_intents")
    .select("id, user_id, initiated_at, membership_type")
    .eq("status", "initiated")
    .lt("initiated_at", cutoff)
    .limit(200)

  for (const intent of intents || []) {
    const recipient = await getRecipient(intent.user_id)
    if (!recipient) continue

    const result = await enrollLifecycleSequence({
      sequenceKey: "checkout_abandoned",
      entityType: "membership_intent",
      entityId: intent.id,
      userId: intent.user_id,
      email: recipient.email,
      name: recipient.name,
      vars: { membership_type: intent.membership_type || "" },
    })
    if (result.ok) enrolled += result.enrolled
  }
  return enrolled
}

async function checkRenewalReminders() {
  let enrolled = 0

  const { data: memberships } = await supabase
    .from("user_memberships")
    .select("id, user_id, current_period_end")
    .eq("status", "active")
    .not("current_period_end", "is", null)
    .gte("current_period_end", new Date().toISOString())
    .lte("current_period_end", daysFromNow(8))
    .limit(500)

  for (const m of memberships || []) {
    if (!m.current_period_end) continue
    const daysUntil = (new Date(m.current_period_end).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
    const recipient = await getRecipient(m.user_id)
    if (!recipient) continue

    const entityId = `${m.id}:${dateOnly(m.current_period_end)}`

    if (daysUntil <= 8 && daysUntil > 4) {
      const result = await enrollLifecycleSequence({
        sequenceKey: "renewal_reminder",
        entityType: "membership",
        entityId,
        userId: m.user_id,
        email: recipient.email,
        name: recipient.name,
        stepNumbers: [1],
        scheduledForOverrides: { 1: new Date().toISOString() },
      })
      if (result.ok) enrolled += result.enrolled
    } else if (daysUntil <= 4 && daysUntil >= 0) {
      const result = await enrollLifecycleSequence({
        sequenceKey: "renewal_reminder",
        entityType: "membership",
        entityId,
        userId: m.user_id,
        email: recipient.email,
        name: recipient.name,
        stepNumbers: [2],
        scheduledForOverrides: { 2: new Date().toISOString() },
      })
      if (result.ok) enrolled += result.enrolled
    }
  }
  return enrolled
}

async function checkCardExpiring() {
  let enrolled = 0

  const { data: memberships } = await supabase
    .from("user_memberships")
    .select("id, user_id, current_period_end, stripe_payment_method_id")
    .eq("status", "active")
    .not("stripe_payment_method_id", "is", null)
    .not("current_period_end", "is", null)
    .gte("current_period_end", new Date().toISOString())
    .lte("current_period_end", daysFromNow(30))
    .limit(300)

  for (const m of memberships || []) {
    if (!m.stripe_payment_method_id || !m.current_period_end) continue

    try {
      const pm = await stripe.paymentMethods.retrieve(m.stripe_payment_method_id)
      const card = pm.card
      if (!card?.exp_month || !card?.exp_year) continue

      const periodEnd = new Date(m.current_period_end)
      const cardExpiresBeforePeriodEnd =
        card.exp_year < periodEnd.getFullYear() ||
        (card.exp_year === periodEnd.getFullYear() && card.exp_month <= periodEnd.getMonth() + 1)

      if (!cardExpiresBeforePeriodEnd) continue

      const recipient = await getRecipient(m.user_id)
      if (!recipient) continue

      const entityId = `${m.id}:${card.exp_month}-${card.exp_year}`
      const result = await enrollLifecycleSequence({
        sequenceKey: "card_expiring",
        entityType: "membership",
        entityId,
        userId: m.user_id,
        email: recipient.email,
        name: recipient.name,
        vars: { card_brand: card.brand || "", card_last4: pm.card?.last4 || "" },
      })
      if (result.ok) enrolled += result.enrolled
    } catch (err) {
      console.error(`[check-lifecycle-triggers] Error consultando tarjeta de membership ${m.id}:`, err)
    }
  }
  return enrolled
}

async function checkWinback() {
  let enrolled = 0

  const { data: memberships } = await supabase
    .from("user_memberships")
    .select("id, user_id, canceled_at")
    .in("status", ["canceled", "cancelled"])
    .not("canceled_at", "is", null)
    .gte("canceled_at", new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString())
    .limit(500)

  for (const m of memberships || []) {
    if (!m.canceled_at) continue
    const recipient = await getRecipient(m.user_id)
    if (!recipient) continue

    const canceledAtMs = new Date(m.canceled_at).getTime()
    const entityId = `${m.id}:${m.canceled_at}`

    const result = await enrollLifecycleSequence({
      sequenceKey: "winback",
      entityType: "membership",
      entityId,
      userId: m.user_id,
      email: recipient.email,
      name: recipient.name,
      scheduledForOverrides: {
        1: new Date(canceledAtMs + 15 * 24 * 60 * 60 * 1000).toISOString(),
        2: new Date(canceledAtMs + 30 * 24 * 60 * 60 * 1000).toISOString(),
        3: new Date(canceledAtMs + 60 * 24 * 60 * 60 * 1000).toISOString(),
      },
    })
    if (result.ok) enrolled += result.enrolled
  }
  return enrolled
}

async function checkPauseReactivation() {
  let enrolled = 0

  const { data: memberships } = await supabase
    .from("user_memberships")
    .select("id, user_id, paused_at")
    .eq("status", "paused")
    .not("paused_at", "is", null)
    .gte("paused_at", new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString())
    .limit(500)

  for (const m of memberships || []) {
    if (!m.paused_at) continue
    const recipient = await getRecipient(m.user_id)
    if (!recipient) continue

    const pausedAtMs = new Date(m.paused_at).getTime()
    const entityId = `${m.id}:${m.paused_at}`

    const result = await enrollLifecycleSequence({
      sequenceKey: "pause_reactivation",
      entityType: "membership",
      entityId,
      userId: m.user_id,
      email: recipient.email,
      name: recipient.name,
      scheduledForOverrides: {
        1: new Date(pausedAtMs + 15 * 24 * 60 * 60 * 1000).toISOString(),
        2: new Date(pausedAtMs + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    })
    if (result.ok) enrolled += result.enrolled
  }
  return enrolled
}

async function checkNps() {
  let enrolled = 0
  const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  const cutoffStart = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()

  const { data: reservations } = await supabase
    .from("reservations")
    .select("id, user_id, updated_at, bag_id")
    .eq("status", "completed")
    .lte("updated_at", cutoff)
    .gte("updated_at", cutoffStart)
    .limit(300)

  for (const r of reservations || []) {
    const recipient = await getRecipient(r.user_id)
    if (!recipient) continue

    const result = await enrollLifecycleSequence({
      sequenceKey: "nps",
      entityType: "reservation",
      entityId: r.id,
      userId: r.user_id,
      email: recipient.email,
      name: recipient.name,
    })
    if (result.ok) enrolled += result.enrolled
  }
  return enrolled
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const results: Record<string, number | string> = {}

  try {
    results.checkout_abandoned = await checkCheckoutAbandoned()
  } catch (err) {
    results.checkout_abandoned = `error: ${String(err)}`
  }

  try {
    results.renewal_reminder = await checkRenewalReminders()
  } catch (err) {
    results.renewal_reminder = `error: ${String(err)}`
  }

  try {
    results.card_expiring = await checkCardExpiring()
  } catch (err) {
    results.card_expiring = `error: ${String(err)}`
  }

  try {
    results.winback = await checkWinback()
  } catch (err) {
    results.winback = `error: ${String(err)}`
  }

  try {
    results.pause_reactivation = await checkPauseReactivation()
  } catch (err) {
    results.pause_reactivation = `error: ${String(err)}`
  }

  try {
    results.nps = await checkNps()
  } catch (err) {
    results.nps = `error: ${String(err)}`
  }

  return NextResponse.json({ ok: true, ...results })
}

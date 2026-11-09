/**
 * Renovacion automatica del pase semanal (Modo Colecciona, socias Petite). Lo ejecuta el cron diario.
 *
 * Por cada reserva con pase Petite cuyo pase termina en <= 2 dias (o ya termino) y cuyo bolso la socia tiene en
 * Colecciona con autorizacion vigente:
 *   1. Avisa por correo del cobro (una sola vez por vencimiento).
 *   2. Pasadas >= 20 h desde el aviso, cuando el pase ya termino, cobra el pase de ese bolso con la tarjeta
 *      guardada (cobro sin la socia presente). Si falla reintenta cada dia, hasta 3 intentos.
 *   3. Si cobra: alarga la reserva 7 dias, suma el credito Colecciona y avisa.
 *   4. Si agota los intentos: avisa a la socia y a administracion; el bolso sigue su via normal de devolucion.
 *
 * Idempotencia: colecciona_pass_renewals tiene (reserva, fin del pase) unico y cada intento usa una clave de
 * idempotencia de Stripe distinta solo cuando el intento anterior fallo de verdad.
 */
import Stripe from "stripe"
import type { SupabaseClient } from "@supabase/supabase-js"
import {
  MAX_AUTO_RENEWALS,
  PASS_DAYS,
  PASS_PRICE_CENTS,
  getConsentedProgressIds,
  normalizePassTier,
} from "@/lib/colecciona-autocharge"
import { creditPassPurchase } from "@/lib/ownership-pass-credit"
import {
  sendRenewalFailed,
  sendRenewalGaveUp,
  sendRenewalNotice,
  sendRenewalSuccess,
} from "@/lib/colecciona-renewal-emails"

const HOUR = 3_600_000
const DAY = 24 * HOUR
const NOTICE_LEAD_MS = 2 * DAY
const MIN_NOTICE_BEFORE_CHARGE_MS = 20 * HOUR
const RETRY_GAP_MS = 20 * HOUR
const LOOKBACK_MS = 14 * DAY
const MAX_ATTEMPTS = 3

export interface RenewalRunSummary {
  candidates: number
  notices: number
  charged: number
  failed: number
  gaveUp: number
  skipped: number
  errors: string[]
}

type RenewalRow = {
  id: string
  status: string
  attempts: number
  notice_sent_at: string | null
  last_attempt_at: string | null
  stripe_payment_intent_id: string | null
  amount_cents: number
  period_end: string
}

/**
 * Decide si toca cobrar ahora. Solo si el pase ya termino, el aviso salio hace >= 20 h, han pasado >= 20 h
 * desde el ultimo intento, quedan intentos y la fila esta lista (notified/failed).
 */
export function canChargeNow(input: {
  now: Date
  periodEnd: Date
  noticeSentAt: Date | null
  lastAttemptAt: Date | null
  attempts: number
  status: string
}): boolean {
  if (!input.noticeSentAt) return false
  if (input.status !== "notified" && input.status !== "failed") return false
  if (input.attempts >= MAX_ATTEMPTS) return false
  if (input.periodEnd.getTime() > input.now.getTime()) return false
  if (input.now.getTime() - input.noticeSentAt.getTime() < MIN_NOTICE_BEFORE_CHARGE_MS) return false
  if (input.lastAttemptAt && input.now.getTime() - input.lastAttemptAt.getTime() < RETRY_GAP_MS) return false
  return true
}

function getStripe(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion })
}

const formatDay = (d: Date) =>
  d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Madrid" })

async function notifyAdmin(
  supabase: SupabaseClient,
  title: string,
  message: string,
  metadata: Record<string, unknown>,
  priority: "high" | "medium" = "high",
) {
  const { error } = await supabase
    .from("admin_notifications")
    .insert({ type: "colecciona_pass_renewal", priority, title, message, metadata })
  if (error) console.error("[colecciona-renewal] No se pudo avisar a administracion:", error.message)
}

/** Tarjeta con la que cobrar: la predeterminada del cliente de Stripe o, si no hay, la primera tarjeta guardada. */
async function resolvePaymentMethod(stripe: Stripe, customerId: string): Promise<string | null> {
  const customer = await stripe.customers.retrieve(customerId)
  if (customer.deleted) return null
  const def = customer.invoice_settings?.default_payment_method
  if (def) return typeof def === "string" ? def : def.id
  const list = await stripe.paymentMethods.list({ customer: customerId, type: "card", limit: 1 })
  return list.data[0]?.id ?? null
}

export async function runColeccionaPassRenewals(supabase: SupabaseClient, now = new Date()): Promise<RenewalRunSummary> {
  const summary: RenewalRunSummary = { candidates: 0, notices: 0, charged: 0, failed: 0, gaveUp: 0, skipped: 0, errors: [] }
  const stripe = getStripe()

  const { data: reservations, error } = await supabase
    .from("reservations")
    .select("id, user_id, bag_id, bag_pass_id, status, membership_type, pass_expires_at")
    .not("bag_pass_id", "is", null)
    .in("status", ["active", "confirmed", "overdue"])
    .not("pass_expires_at", "is", null)
    .lte("pass_expires_at", new Date(now.getTime() + NOTICE_LEAD_MS).toISOString())
    .gte("pass_expires_at", new Date(now.getTime() - LOOKBACK_MS).toISOString())
  if (error) throw error

  const petite = (reservations ?? []).filter((r) => String(r.membership_type || "").toLowerCase() === "petite")
  summary.candidates = petite.length
  if (petite.length === 0) return summary

  const userIds = [...new Set(petite.map((r) => r.user_id))]
  const bagIds = [...new Set(petite.map((r) => r.bag_id))]
  const passIds = [...new Set(petite.map((r) => r.bag_pass_id))]

  const [progressRes, membershipsRes, profilesRes, bagsRes, passesRes] = await Promise.all([
    supabase.from("ownership_progress").select("id, user_id, bag_id, purchase_price").eq("mode", "collect").eq("status", "active").in("user_id", userIds),
    supabase.from("user_memberships").select("user_id, status, stripe_customer_id").in("user_id", userIds),
    supabase.from("profiles").select("id, email, first_name, last_name, stripe_customer_id").in("id", userIds),
    supabase.from("bags").select("id, name, brand").in("id", bagIds),
    supabase.from("bag_passes").select("id, pass_tier").in("id", passIds),
  ])
  const progressByKey = new Map((progressRes.data ?? []).map((p) => [`${p.user_id}|${p.bag_id}`, p]))
  const membershipByUser = new Map((membershipsRes.data ?? []).map((m) => [m.user_id, m]))
  const profileById = new Map((profilesRes.data ?? []).map((p) => [p.id, p]))
  const bagById = new Map((bagsRes.data ?? []).map((b) => [b.id, b]))
  const tierByPass = new Map((passesRes.data ?? []).map((p) => [p.id, p.pass_tier]))

  const progressIds = (progressRes.data ?? []).map((p) => p.id as string)
  const consented = await getConsentedProgressIds(supabase, progressIds)
  const { data: doneRows } = progressIds.length
    ? await supabase.from("colecciona_pass_renewals").select("ownership_progress_id").eq("status", "succeeded").in("ownership_progress_id", progressIds)
    : { data: [] as { ownership_progress_id: string }[] }
  const doneByProgress = new Map<string, number>()
  for (const r of doneRows ?? []) doneByProgress.set(String(r.ownership_progress_id), (doneByProgress.get(String(r.ownership_progress_id)) ?? 0) + 1)

  for (const r of petite) {
    try {
      const progress = progressByKey.get(`${r.user_id}|${r.bag_id}`)
      const membership = membershipByUser.get(r.user_id)
      const profile = profileById.get(r.user_id)
      const bag = bagById.get(r.bag_id)
      const tier = normalizePassTier(tierByPass.get(r.bag_pass_id))
      const done = progress ? doneByProgress.get(progress.id) ?? 0 : 0

      // Condiciones para renovar: Colecciona activo de ESTE bolso, autorizacion vigente, membresia activa y bajo el tope.
      if (!progress || !consented.has(progress.id) || membership?.status !== "active" || !profile?.email || !bag || !tier) {
        summary.skipped++
        continue
      }
      if (done >= MAX_AUTO_RENEWALS) {
        summary.skipped++
        continue
      }

      const amountCents = PASS_PRICE_CENTS[tier]
      const periodEnd = new Date(r.pass_expires_at as string)
      const name = (profile.first_name as string) || "socia"
      const bagName = `${bag.brand} ${bag.name}`.trim()
      const base = { to: profile.email as string, name, bagName, reservationId: r.id as string }

      // Fila del vencimiento (unica por reserva + fin del pase): se crea una vez.
      let { data: row } = await supabase
        .from("colecciona_pass_renewals")
        .select("id, status, attempts, notice_sent_at, last_attempt_at, stripe_payment_intent_id, amount_cents, period_end")
        .eq("reservation_id", r.id)
        .eq("period_end", periodEnd.toISOString())
        .maybeSingle()
      if (!row) {
        const { error: insertError } = await supabase.from("colecciona_pass_renewals").insert({
          user_id: r.user_id,
          reservation_id: r.id,
          ownership_progress_id: progress.id,
          bag_id: r.bag_id,
          pass_tier: tier,
          amount_cents: amountCents,
          period_end: periodEnd.toISOString(),
        })
        // Una carrera con otra ejecucion deja la fila ya creada: se vuelve a leer.
        if (insertError && insertError.code !== "23505") throw insertError
        const again = await supabase
          .from("colecciona_pass_renewals")
          .select("id, status, attempts, notice_sent_at, last_attempt_at, stripe_payment_intent_id, amount_cents, period_end")
          .eq("reservation_id", r.id)
          .eq("period_end", periodEnd.toISOString())
          .single()
        row = again.data
      }
      if (!row) throw new Error("No se pudo leer la fila de renovacion")
      const current = row as RenewalRow

      if (current.status === "succeeded" || current.status === "gave_up") {
        summary.skipped++
        continue
      }

      // 1) Aviso previo (una vez).
      if (!current.notice_sent_at) {
        const sent = await sendRenewalNotice({
          ...base,
          amountCents,
          chargeDate: formatDay(periodEnd),
          renewalsDone: done,
          maxRenewals: MAX_AUTO_RENEWALS,
        })
        if (sent) {
          await supabase
            .from("colecciona_pass_renewals")
            .update({ notice_sent_at: now.toISOString(), status: "notified", updated_at: now.toISOString() })
            .eq("id", current.id)
          summary.notices++
        } else {
          summary.errors.push(`aviso no enviado a ${profile.email}`)
        }
        continue // nunca se cobra en la misma ejecucion que el aviso
      }

      const noticeAge = now.getTime() - new Date(current.notice_sent_at).getTime()
      const sinceLast = current.last_attempt_at ? now.getTime() - new Date(current.last_attempt_at).getTime() : Infinity

      // 2) Cobro en proceso, o que se quedo a medias (la ejecucion se cortó): se comprueba en Stripe antes de nada.
      const stuckCharging = current.status === "charging" && sinceLast >= 2 * HOUR
      if ((current.status === "processing" || stuckCharging) && current.stripe_payment_intent_id) {
        const pi = await stripe.paymentIntents.retrieve(current.stripe_payment_intent_id)
        if (pi.status === "succeeded") {
          await finishSuccess(supabase, current, r, pi.id, amountCents, periodEnd, base, now)
          summary.charged++
        } else if (pi.status === "processing") {
          summary.skipped++
        } else {
          await registerFailure(supabase, current, base, amountCents, `Stripe: ${pi.status}`, now, summary, bagName, profile.email as string, r.id as string)
        }
        continue
      }
      if (stuckCharging) {
        // Sin cobro creado en Stripe: se libera para el siguiente intento (misma clave de idempotencia).
        await supabase.from("colecciona_pass_renewals").update({ status: "notified", updated_at: now.toISOString() }).eq("id", current.id)
        summary.skipped++
        continue
      }

      // 3) Cobro. Solo si: el pase ya termino, el aviso salio hace >= 20 h, ha pasado >= 20 h desde el ultimo
      // intento y quedan intentos. Cualquier otra cosa espera a la siguiente ejecucion.
      if (
        !canChargeNow({
          now,
          periodEnd,
          noticeSentAt: new Date(current.notice_sent_at),
          lastAttemptAt: current.last_attempt_at ? new Date(current.last_attempt_at) : null,
          attempts: current.attempts,
          status: current.status,
        })
      ) {
        summary.skipped++
        continue
      }

      // Bloqueo optimista: solo una ejecucion pasa de notified/failed a charging.
      const { data: locked } = await supabase
        .from("colecciona_pass_renewals")
        .update({ status: "charging", last_attempt_at: now.toISOString(), updated_at: now.toISOString() })
        .eq("id", current.id)
        .eq("status", current.status)
        .select("id")
      if (!locked || locked.length === 0) {
        summary.skipped++
        continue
      }

      const customerId = (membership?.stripe_customer_id as string | null) || (profile.stripe_customer_id as string | null)
      try {
        const paymentMethod = customerId ? await resolvePaymentMethod(stripe, customerId) : null
        if (!customerId || !paymentMethod) {
          await registerFailure(supabase, current, base, amountCents, "Sin tarjeta guardada", now, summary, bagName, profile.email as string, r.id as string)
          continue
        }
        const pi = await stripe.paymentIntents.create(
          {
            amount: amountCents,
            currency: "eur",
            customer: customerId,
            payment_method: paymentMethod,
            off_session: true,
            confirm: true,
            description: `Renovación semanal del pase · ${bagName} · reserva ${r.id}`,
            metadata: {
              type: "colecciona_pass_renewal",
              renewal_id: current.id,
              reservation_id: r.id as string,
              user_id: r.user_id as string,
              bag_id: r.bag_id as string,
              ownership_progress_id: progress.id as string,
            },
          },
          // Misma clave si el intento anterior no llego a resolverse (red): nunca se cobra dos veces el mismo intento.
          { idempotencyKey: `colecciona-renewal-${current.id}-${current.attempts + 1}` },
        )
        await supabase.from("colecciona_pass_renewals").update({ stripe_payment_intent_id: pi.id }).eq("id", current.id)
        if (pi.status === "succeeded") {
          await finishSuccess(supabase, current, r, pi.id, amountCents, periodEnd, base, now)
          summary.charged++
        } else if (pi.status === "processing") {
          await supabase.from("colecciona_pass_renewals").update({ status: "processing", updated_at: now.toISOString() }).eq("id", current.id)
        } else {
          await registerFailure(supabase, current, base, amountCents, `Stripe: ${pi.status}`, now, summary, bagName, profile.email as string, r.id as string)
        }
      } catch (err) {
        const stripeErr = err as Stripe.errors.StripeError
        const isCardProblem =
          stripeErr?.type === "StripeCardError" || !!stripeErr?.payment_intent || stripeErr?.code === "authentication_required"
        if (isCardProblem) {
          await registerFailure(
            supabase, current, base, amountCents,
            `${stripeErr.code || stripeErr.type}: ${stripeErr.message}`.slice(0, 300), now, summary, bagName, profile.email as string, r.id as string,
          )
        } else {
          // Fallo de red o de la API: no cuenta como intento; el siguiente usa la misma clave de idempotencia.
          await supabase.from("colecciona_pass_renewals").update({ status: current.status, updated_at: now.toISOString() }).eq("id", current.id)
          throw err
        }
      }
    } catch (err) {
      summary.errors.push(`${r.id}: ${err instanceof Error ? err.message : String(err)}`)
      console.error("[colecciona-renewal] Error procesando", r.id, err)
    }
  }
  return summary
}

/** Cobro confirmado: alarga el pase 7 dias, suma el credito y avisa. Cada paso falla por separado y avisa a administracion. */
async function finishSuccess(
  supabase: SupabaseClient,
  row: RenewalRow,
  reservation: { id: string; user_id: string; bag_id: string; status: string },
  paymentIntentId: string,
  amountCents: number,
  periodEnd: Date,
  base: { to: string; name: string; bagName: string; reservationId: string },
  now: Date,
) {
  await supabase
    .from("colecciona_pass_renewals")
    .update({ status: "succeeded", stripe_payment_intent_id: paymentIntentId, charged_at: now.toISOString(), attempts: row.attempts + 1, last_error: null, updated_at: now.toISOString() })
    .eq("id", row.id)

  const newEnd = new Date(periodEnd.getTime() + PASS_DAYS * DAY)
  const { error: extendError } = await supabase
    .from("reservations")
    .update({
      pass_expires_at: newEnd.toISOString(),
      end_date: newEnd.toISOString(),
      reminder_2d_sent_at: null,
      overdue_1d_sent_at: null,
      ...(reservation.status === "overdue" ? { status: "active" } : {}),
      updated_at: now.toISOString(),
    })
    .eq("id", reservation.id)
  if (extendError) {
    await notifyAdmin(supabase, "Colecciona: pase cobrado pero no se alargó la reserva",
      `Se cobraron ${amountCents / 100} € (${paymentIntentId}) pero falló alargar la reserva ${reservation.id}: ${extendError.message}. Alárgala a mano 7 días.`,
      { reservation_id: reservation.id, payment_intent: paymentIntentId })
  }

  let accumulated: number | null = null
  try {
    const credit = await creditPassPurchase(supabase, { userId: reservation.user_id, sessionId: paymentIntentId, amountPaidCents: amountCents })
    if (credit.credited) accumulated = credit.accumulated
  } catch (err) {
    await notifyAdmin(supabase, "Colecciona: pase cobrado pero no se sumó el crédito",
      `Se cobraron ${amountCents / 100} € (${paymentIntentId}) a la reserva ${reservation.id} pero el crédito falló: ${err instanceof Error ? err.message : String(err)}. Súmalo a mano.`,
      { reservation_id: reservation.id, payment_intent: paymentIntentId })
  }

  await sendRenewalSuccess({ ...base, amountCents, newEndDate: formatDay(newEnd), accumulated })
}

/** Cobro fallido: cuenta el intento y avisa; al tercero se rinde, avisa a la socia y a administracion. */
async function registerFailure(
  supabase: SupabaseClient,
  row: RenewalRow,
  base: { to: string; name: string; bagName: string; reservationId: string },
  amountCents: number,
  reason: string,
  now: Date,
  summary: RenewalRunSummary,
  bagName: string,
  email: string,
  reservationId: string,
) {
  const attempts = row.attempts + 1
  const gaveUp = attempts >= MAX_ATTEMPTS
  await supabase
    .from("colecciona_pass_renewals")
    .update({ status: gaveUp ? "gave_up" : "failed", attempts, last_error: reason, updated_at: now.toISOString() })
    .eq("id", row.id)

  if (gaveUp) {
    summary.gaveUp++
    await sendRenewalGaveUp({ ...base, amountCents })
    await notifyAdmin(supabase, "Colecciona: no se pudo cobrar la renovación del pase",
      `${email} · ${bagName}: ${attempts} intentos fallidos (${reason}). Reserva ${reservationId}. Contacta con la socia: debe comprar el bolso o devolverlo.`,
      { reservation_id: reservationId, renewal_id: row.id, reason })
  } else {
    summary.failed++
    await sendRenewalFailed({ ...base, amountCents, attemptsLeft: MAX_ATTEMPTS - attempts })
  }
}

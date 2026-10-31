import type Stripe from "stripe"
import type { SupabaseClient } from "@supabase/supabase-js"
import { getMaxCredit } from "@/lib/ownership-credit"

/**
 * Libro de crédito de Modo Colecciona (tabla ownership_credit_entries).
 * Una factura de Stripe solo puede dar crédito una vez: el libro tiene
 * stripe_invoice_id UNIQUE y todas las altas usan ON CONFLICT DO NOTHING.
 */

export type CreditSource = "rental_conversion" | "collect_invoice" | "collect_pass"

export interface LedgerRow {
  ownership_progress_id: string
  user_id: string
  stripe_invoice_id: string
  amount_cents: number
  source: CreditSource
}

export interface PaidInvoice {
  id: string
  amount_cents: number
  paid_at: string
}

export interface LedgerClaim extends PaidInvoice {
  ownership_progress_id: string
  source: string
}

export interface RentalConversionPreview {
  subscription_id: string | null
  /** false si la tabla del libro aún no existe en la base de datos. */
  ledger_available: boolean
  invoices_paid: number
  eligible: PaidInvoice[]
  already_credited: LedgerClaim[]
  /** Facturas fuera del libro pagadas durante un periodo Colecciona anterior (ya acumuladas por webhook antes de existir el libro). */
  excluded_legacy_collect_period: PaidInvoice[]
  eligible_cents: number
}

export interface ConversionSimulation extends RentalConversionPreview {
  bag_id: string
  purchase_price: number
  /** Crédito con el que arrancaría el progreso (limitado al precio). */
  initial_credit: number
  resulting_status: "active"
  ready_to_finalize: boolean
  persisted: false
}

const roundCents = (value: number) => Math.round(value * 100) / 100

const isMissingTable = (error: { code?: string } | null) =>
  error?.code === "42P01" || error?.code === "PGRST205"

/**
 * Inserta filas en el libro con ON CONFLICT DO NOTHING y devuelve SOLO las que
 * se insertaron de verdad (las facturas ya registradas no vuelven a contar).
 */
export async function insertLedgerEntries(supabase: SupabaseClient, rows: LedgerRow[]): Promise<LedgerRow[]> {
  if (rows.length === 0) return []
  const { data, error } = await supabase
    .from("ownership_credit_entries")
    .upsert(rows, { onConflict: "stripe_invoice_id", ignoreDuplicates: true })
    .select("stripe_invoice_id")
  if (error) throw error
  const inserted = new Set((data ?? []).map((row) => row.stripe_invoice_id as string))
  return rows.filter((row) => inserted.has(row.stripe_invoice_id))
}

export async function deleteLedgerEntry(supabase: SupabaseClient, stripeInvoiceId: string): Promise<void> {
  await supabase.from("ownership_credit_entries").delete().eq("stripe_invoice_id", stripeInvoiceId)
}

/**
 * Suma crédito a un progreso activo sin superar el precio. `reachedPrice` indica que se acaba de alcanzar el
 * descuento máximo (20 % del precio): a partir de ahí más crédito ya no abarata la compra. Usa comparación del
 * valor leído para no pisar un cambio concurrente (reintenta si cambió).
 * Nunca cambia el estado: alcanzar el precio deja status='active'.
 */
export async function addCreditToProgress(
  supabase: SupabaseClient,
  progressId: string,
  creditEuros: number,
  target: number,
): Promise<{ previous: number; accumulated: number; reachedPrice: boolean }> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const { data: row, error } = await supabase
      .from("ownership_progress")
      .select("accumulated")
      .eq("id", progressId)
      .eq("status", "active")
      .single()
    if (error || !row) throw error ?? new Error("Progreso no activo")

    const previous = Number(row.accumulated || 0)
    const accumulated = roundCents(Math.min(previous + creditEuros, target))
    const maxCredit = getMaxCredit(target)
    const { data: updated } = await supabase
      .from("ownership_progress")
      .update({ accumulated, updated_at: new Date().toISOString() })
      .eq("id", progressId)
      .eq("status", "active")
      .eq("accumulated", row.accumulated)
      .select("id")
    if (updated && updated.length > 0) {
      return { previous, accumulated, reachedPrice: previous < maxCredit && accumulated >= maxCredit }
    }
  }
  throw new Error("No se pudo actualizar el crédito por cambios concurrentes")
}

/**
 * Facturas pagadas de la suscripción actual que aún pueden dar crédito al
 * convertir a Colecciona: todas las que NO estén ya en el libro, de ningún
 * ownership_progress (activo, cancelado o completado). Solo lectura.
 */
export async function previewRentalConversion(
  supabase: SupabaseClient,
  stripe: Stripe,
  userId: string,
): Promise<RentalConversionPreview> {
  const { data: membership } = await supabase
    .from("user_memberships")
    .select("stripe_subscription_id")
    .eq("user_id", userId)
    .maybeSingle()

  const subscriptionId = (membership?.stripe_subscription_id as string | null) ?? null
  const empty: RentalConversionPreview = {
    subscription_id: subscriptionId,
    ledger_available: true,
    invoices_paid: 0,
    eligible: [],
    already_credited: [],
    excluded_legacy_collect_period: [],
    eligible_cents: 0,
  }
  if (!subscriptionId) return empty

  const paid: PaidInvoice[] = []
  for await (const invoice of stripe.invoices.list({ subscription: subscriptionId, status: "paid", limit: 100 })) {
    if (invoice.id && (invoice.amount_paid ?? 0) > 0) {
      paid.push({
        id: invoice.id,
        amount_cents: invoice.amount_paid,
        paid_at: new Date(invoice.created * 1000).toISOString(),
      })
    }
  }

  const claims = new Map<string, { ownership_progress_id: string; source: string }>()
  let ledgerAvailable = true
  for (let i = 0; i < paid.length && ledgerAvailable; i += 100) {
    const ids = paid.slice(i, i + 100).map((invoice) => invoice.id)
    const { data, error } = await supabase
      .from("ownership_credit_entries")
      .select("stripe_invoice_id, ownership_progress_id, source")
      .in("stripe_invoice_id", ids)
    if (isMissingTable(error)) {
      ledgerAvailable = false
      break
    }
    if (error) throw error
    for (const row of data ?? []) {
      claims.set(row.stripe_invoice_id, { ownership_progress_id: row.ownership_progress_id, source: row.source })
    }
  }

  const { data: collectRecords } = await supabase
    .from("ownership_progress")
    .select("status, started_at, completed_at, updated_at")
    .eq("user_id", userId)
    .eq("mode", "collect")
  const collectPeriods = (collectRecords ?? []).map((record) => ({
    start: new Date(record.started_at).getTime(),
    end:
      record.status === "active"
        ? Date.now()
        : new Date(record.completed_at ?? record.updated_at).getTime(),
  }))
  const inCollectPeriod = (invoice: PaidInvoice) => {
    const paidAt = new Date(invoice.paid_at).getTime()
    return collectPeriods.some((period) => paidAt >= period.start && paidAt <= period.end)
  }

  const unclaimed = paid.filter((invoice) => !claims.has(invoice.id))
  const excludedLegacy = unclaimed.filter(inCollectPeriod)
  const eligible = unclaimed.filter((invoice) => !inCollectPeriod(invoice))
  const alreadyCredited = paid
    .filter((invoice) => claims.has(invoice.id))
    .map((invoice) => ({ ...invoice, ...claims.get(invoice.id)! }))

  return {
    subscription_id: subscriptionId,
    ledger_available: ledgerAvailable,
    invoices_paid: paid.length,
    eligible,
    already_credited: alreadyCredited,
    excluded_legacy_collect_period: excludedLegacy,
    eligible_cents: sum(eligible),
  }
}

/** Calcula, sin guardar nada, el crédito que recibiría la socia al convertir a Colecciona. */
export async function simulateConversion(
  supabase: SupabaseClient,
  stripe: Stripe,
  userId: string,
  bagId: string,
  purchasePrice: number,
): Promise<ConversionSimulation> {
  const preview = await previewRentalConversion(supabase, stripe, userId)
  const initialCredit = roundCents(Math.min(preview.eligible_cents / 100, purchasePrice))
  return {
    ...preview,
    bag_id: bagId,
    purchase_price: purchasePrice,
    initial_credit: initialCredit,
    resulting_status: "active",
    ready_to_finalize: purchasePrice > 0 && initialCredit >= getMaxCredit(purchasePrice),
    persisted: false,
  }
}

function sum(invoices: PaidInvoice[]): number {
  return invoices.reduce((total, invoice) => total + invoice.amount_cents, 0)
}

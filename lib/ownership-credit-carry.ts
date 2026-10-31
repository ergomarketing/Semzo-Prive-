import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * El credito de Modo Colecciona es SALDO DE LA SOCIA, no del bolso.
 *
 *  - Se acumula con las cuotas pagadas (libro ownership_credit_entries).
 *  - Renunciar a un bolso o cambiar de bolso NO lo pierde: el siguiente Colecciona lo hereda (con el tope del precio).
 *  - Solo se gasta en una compra COMPLETADA, y solo lo que se descuenta (max. 20 % del precio): el resto sigue siendo
 *    de la socia (spentOnSale parte la entrada si hace falta). Las entradas gastadas llevan spent_at.
 *  - Se pierde al darse de baja de la membresia: las entradas se marcan con forfeited_at.
 */

interface OpenEntry {
  id: string
  ownership_progress_id: string
  amount_cents: number
  progress_status: string | null
}

/** Entradas de credito vivas (ni perdidas ni gastadas en una venta) de una socia, de mas antigua a mas nueva. */
export async function getOpenCreditEntries(supabase: SupabaseClient, userId: string): Promise<OpenEntry[]> {
  const { data: entries, error } = await supabase
    .from("ownership_credit_entries")
    .select("id, ownership_progress_id, amount_cents, created_at")
    .eq("user_id", userId)
    .is("forfeited_at", null)
    .is("spent_at", null)
    .order("created_at", { ascending: true })
  if (error) throw error
  if (!entries || entries.length === 0) return []

  const progressIds = Array.from(new Set(entries.map((e) => e.ownership_progress_id as string)))
  const { data: progress, error: progressError } = await supabase
    .from("ownership_progress")
    .select("id, status")
    .in("id", progressIds)
  if (progressError) throw progressError
  const statusById = new Map((progress || []).map((p) => [p.id as string, p.status as string]))

  return entries.map((e) => ({
    id: e.id as string,
    ownership_progress_id: e.ownership_progress_id as string,
    amount_cents: Number(e.amount_cents || 0),
    progress_status: statusById.get(e.ownership_progress_id as string) ?? null,
  }))
}

/**
 * Venta cerrada: gasta `appliedCents` del credito del progreso (de mas antiguo a mas nuevo) y deja el resto como
 * saldo de la socia. Si una entrada solo se gasta en parte, se parte en dos: la gastada y el resto (que sigue abierto).
 * Solo debe llamarse la primera vez que se cierra la venta.
 */
export async function spendCreditOnSale(
  supabase: SupabaseClient,
  progressId: string,
  appliedCents: number,
): Promise<{ spentCents: number; keptCents: number }> {
  const { data: entries, error } = await supabase
    .from("ownership_credit_entries")
    .select("id, user_id, stripe_invoice_id, amount_cents, source, created_at")
    .eq("ownership_progress_id", progressId)
    .is("forfeited_at", null)
    .is("spent_at", null)
    .order("created_at", { ascending: true })
  if (error) throw error

  let remaining = Math.max(0, Math.round(appliedCents))
  let spentCents = 0
  let keptCents = 0
  const now = new Date().toISOString()

  for (const entry of entries || []) {
    const amount = Number(entry.amount_cents || 0)
    if (remaining <= 0) {
      keptCents += amount
      continue
    }
    if (remaining >= amount) {
      const { error: spendError } = await supabase
        .from("ownership_credit_entries")
        .update({ spent_at: now })
        .eq("id", entry.id)
      if (spendError) throw spendError
      remaining -= amount
      spentCents += amount
      continue
    }
    // Gasto parcial: primero se crea el resto y luego se recorta la entrada original.
    const rest = amount - remaining
    const { data: restRow, error: restError } = await supabase
      .from("ownership_credit_entries")
      .insert({
        ownership_progress_id: progressId,
        user_id: entry.user_id,
        stripe_invoice_id: `${entry.stripe_invoice_id}#rest`,
        amount_cents: rest,
        source: entry.source,
        created_at: entry.created_at,
      })
      .select("id")
      .single()
    if (restError) throw restError
    const { error: cutError } = await supabase
      .from("ownership_credit_entries")
      .update({ amount_cents: remaining, spent_at: now })
      .eq("id", entry.id)
    if (cutError) {
      await supabase.from("ownership_credit_entries").delete().eq("id", restRow.id)
      throw cutError
    }
    spentCents += remaining
    keptCents += rest
    remaining = 0
  }
  return { spentCents, keptCents }
}

/** Saldo de credito de la socia en centimos (todo lo no perdido ni gastado). */
export async function getCreditBalanceCents(supabase: SupabaseClient, userId: string): Promise<number> {
  const entries = await getOpenCreditEntries(supabase, userId)
  return entries.reduce((total, e) => total + e.amount_cents, 0)
}

export interface CarriedEntry {
  id: string
  from_progress_id: string
  amount_cents: number
}

/**
 * Pasa al nuevo progreso el credito que la socia tenia en intentos cancelados, de mas antiguo a mas nuevo y sin
 * superar `roomCents` (lo que falta hasta el precio). Lo que no cabe se queda como saldo para despues.
 * Devuelve lo movido para poder deshacerlo si algo falla despues.
 */
export async function carryOverCredit(
  supabase: SupabaseClient,
  userId: string,
  newProgressId: string,
  roomCents: number,
): Promise<{ cents: number; moved: CarriedEntry[] }> {
  if (roomCents <= 0) return { cents: 0, moved: [] }
  const entries = await getOpenCreditEntries(supabase, userId)
  const moved: CarriedEntry[] = []
  let total = 0
  for (const entry of entries) {
    if (entry.progress_status !== "cancelled" && entry.progress_status !== "completed") continue
    if (entry.ownership_progress_id === newProgressId) continue
    if (total + entry.amount_cents > roomCents) continue
    const { error } = await supabase
      .from("ownership_credit_entries")
      .update({ ownership_progress_id: newProgressId })
      .eq("id", entry.id)
      .eq("ownership_progress_id", entry.ownership_progress_id)
    if (error) {
      await restoreCarriedCredit(supabase, moved)
      throw error
    }
    moved.push({ id: entry.id, from_progress_id: entry.ownership_progress_id, amount_cents: entry.amount_cents })
    total += entry.amount_cents
  }
  return { cents: total, moved }
}

/** Devuelve cada entrada movida a su progreso de origen (rollback). */
export async function restoreCarriedCredit(supabase: SupabaseClient, moved: CarriedEntry[]): Promise<void> {
  for (const entry of moved) {
    await supabase
      .from("ownership_credit_entries")
      .update({ ownership_progress_id: entry.from_progress_id })
      .eq("id", entry.id)
  }
}

/** Baja de la membresia: el credito vivo de la socia se pierde (queda marcado, no se borra el historial). */
export async function forfeitUserCredit(supabase: SupabaseClient, userId: string): Promise<number> {
  const entries = await getOpenCreditEntries(supabase, userId)
  if (entries.length === 0) return 0
  const { error } = await supabase
    .from("ownership_credit_entries")
    .update({ forfeited_at: new Date().toISOString() })
    .in(
      "id",
      entries.map((e) => e.id),
    )
  if (error) throw error
  return entries.reduce((total, e) => total + e.amount_cents, 0)
}

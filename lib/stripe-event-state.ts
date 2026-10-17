import type { SupabaseClient } from "@supabase/supabase-js"

const TABLE = "stripe_processed_events"

// Un evento en 'processing' mas tiempo que esto se considera abandonado
// (la funcion murio o hizo timeout) y puede reclamarse en un reintento.
export const STALE_PROCESSING_MS = 5 * 60 * 1000

export type ClaimResult =
  | { action: "process"; attempt: number }
  | { action: "skip_done" }
  | { action: "skip_in_progress" }

export async function claimStripeEvent(
  supabase: SupabaseClient,
  event: { id: string; type: string },
): Promise<ClaimResult> {
  const nowIso = new Date().toISOString()

  const { error: insertError } = await supabase.from(TABLE).insert({
    event_id: event.id,
    event_type: event.type,
    status: "processing",
    attempts: 1,
    updated_at: nowIso,
  })

  if (!insertError) return { action: "process", attempt: 1 }
  if (insertError.code !== "23505") throw insertError

  const { data: row, error: selectError } = await supabase
    .from(TABLE)
    .select("status, attempts, updated_at")
    .eq("event_id", event.id)
    .maybeSingle()

  if (selectError) throw selectError
  if (!row) return { action: "skip_in_progress" }

  if (row.status === "done") return { action: "skip_done" }

  const isFreshProcessing =
    row.status === "processing" &&
    Date.now() - new Date(row.updated_at).getTime() < STALE_PROCESSING_MS
  if (isFreshProcessing) return { action: "skip_in_progress" }

  // 'failed' o 'processing' abandonado: reclamar con update condicional para
  // que solo un reintento concurrente gane.
  const attempt = (row.attempts ?? 1) + 1
  const { data: claimed, error: claimError } = await supabase
    .from(TABLE)
    .update({ status: "processing", attempts: attempt, updated_at: nowIso })
    .eq("event_id", event.id)
    .eq("status", row.status)
    .eq("updated_at", row.updated_at)
    .select("event_id")

  if (claimError) throw claimError
  if (!claimed || claimed.length !== 1) return { action: "skip_in_progress" }

  return { action: "process", attempt }
}

export async function markStripeEventDone(supabase: SupabaseClient, eventId: string) {
  const { error } = await supabase
    .from(TABLE)
    .update({ status: "done", last_error: null, updated_at: new Date().toISOString() })
    .eq("event_id", eventId)
  if (error) {
    console.error("[stripe-webhook] No se pudo marcar el evento como done:", eventId, error.message)
  }
}

export async function markStripeEventFailed(
  supabase: SupabaseClient,
  eventId: string,
  err: unknown,
) {
  const message = err instanceof Error ? err.message : String(err)
  const { error } = await supabase
    .from(TABLE)
    .update({
      status: "failed",
      last_error: message.slice(0, 1000),
      updated_at: new Date().toISOString(),
    })
    .eq("event_id", eventId)
  if (error) {
    console.error("[stripe-webhook] No se pudo marcar el evento como failed:", eventId, error.message)
  }
}

/**
 * enrollLifecycleSequence — helper genérico para meter cualquier entidad
 * (membresía, intent de checkout, item de wishlist, reserva...) en una
 * secuencia de emails de lifecycle/negocio (Fase 3).
 *
 * AISLADO de la Secuencia 1 (leads/newsletter): usa las tablas
 * lifecycle_email_templates / lifecycle_email_log, nunca email_templates /
 * email_sequence_log. No enviar nada aquí — solo programa filas en
 * lifecycle_email_log; el envío real lo hace el cron send-lifecycle-emails.
 */
import { createClient } from "@supabase/supabase-js"

export type LifecycleSequenceKey =
  | "membership_onboarding"
  | "checkout_abandoned"
  | "renewal_reminder"
  | "card_expiring"
  | "winback"
  | "pause_reactivation"
  | "back_in_stock"
  | "nps"

export type LifecycleEntityType = "membership" | "membership_intent" | "wishlist_item" | "reservation"

interface EnrollLifecycleOptions {
  sequenceKey: LifecycleSequenceKey
  entityType: LifecycleEntityType
  entityId: string
  userId?: string | null
  email: string
  name?: string | null
  vars?: Record<string, string>
  /** Si se indica, solo enrola estos step_number (en vez de todos los steps activos). */
  stepNumbers?: number[]
  /** Override explícito de scheduled_for por step_number (ISO string), en vez de now()+delay_hours. */
  scheduledForOverrides?: Record<number, string>
}

function getServiceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  })
}

/**
 * Enrola una entidad en todos los steps activos de una secuencia.
 * Idempotente: si ya existe una fila para (sequence_key, step_number, entity_id)
 * no se duplica (ignoreDuplicates). Es seguro llamarla varias veces para la
 * misma entidad (ej. un cron diario que la vuelve a detectar).
 */
export async function enrollLifecycleSequence(
  opts: EnrollLifecycleOptions,
): Promise<{ ok: boolean; enrolled: number; reason?: string }> {
  const supabase = getServiceClient()
  const email = opts.email.toLowerCase().trim()

  let templatesQuery = supabase
    .from("lifecycle_email_templates")
    .select("step_number, delay_hours")
    .eq("sequence_key", opts.sequenceKey)
    .eq("active", true)
    .order("step_number")

  if (opts.stepNumbers && opts.stepNumbers.length > 0) {
    templatesQuery = templatesQuery.in("step_number", opts.stepNumbers)
  }

  const { data: templates, error: tplError } = await templatesQuery

  if (tplError) {
    console.error(`[enrollLifecycleSequence] Error leyendo templates de ${opts.sequenceKey}:`, tplError)
    return { ok: false, enrolled: 0, reason: tplError.message }
  }

  if (!templates || templates.length === 0) {
    return { ok: false, enrolled: 0, reason: "no_active_templates" }
  }

  const now = Date.now()
  const rows = templates.map((t) => ({
    sequence_key: opts.sequenceKey,
    step_number: t.step_number,
    entity_type: opts.entityType,
    entity_id: opts.entityId,
    user_id: opts.userId || null,
    recipient_email: email,
    recipient_name: opts.name || null,
    scheduled_for:
      opts.scheduledForOverrides?.[t.step_number] ?? new Date(now + t.delay_hours * 60 * 60 * 1000).toISOString(),
    status: "pending" as const,
    metadata: opts.vars || null,
  }))

  const { error: insertError, count } = await supabase
    .from("lifecycle_email_log")
    .upsert(rows, { onConflict: "sequence_key,step_number,entity_id", ignoreDuplicates: true, count: "exact" })

  if (insertError) {
    console.error(`[enrollLifecycleSequence] Error enrolando ${opts.sequenceKey}:`, insertError)
    return { ok: false, enrolled: 0, reason: insertError.message }
  }

  return { ok: true, enrolled: count ?? rows.length }
}

/**
 * Cancela los steps pendientes de una secuencia para una entidad concreta.
 * Útil cuando la condición de negocio deja de aplicar (ej. la socia reactiva
 * su membresía antes de que se envíe el siguiente email de win-back).
 */
export async function cancelLifecycleSequence(
  sequenceKey: LifecycleSequenceKey,
  entityId: string,
): Promise<void> {
  const supabase = getServiceClient()
  try {
    await supabase
      .from("lifecycle_email_log")
      .update({ status: "cancelled" })
      .eq("sequence_key", sequenceKey)
      .eq("entity_id", entityId)
      .eq("status", "pending")
  } catch (e) {
    console.error(`[cancelLifecycleSequence] Error cancelando ${sequenceKey}/${entityId}:`, e)
  }
}

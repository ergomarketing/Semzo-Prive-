/**
 * "Proximo bolso" en cola (reserva anticipada).
 *
 * Regla: una socia que YA tiene un bolso puede reservar UNO mas en los ultimos 7 dias de su ciclo
 * (antes de la renovacion). Esa reserva queda en estado 'queued' (el bolso queda retenido) y NO sale hasta
 * que Logistica confirma la devolucion del bolso actual: entonces pasa a 'confirmed' y entra en el flujo
 * normal de envio. Nunca hay mas de un bolso en cola, y nunca dos bolsos en casa.
 *
 * Aplica a todas las membresias, tambien Petite con Pase de Bolso (el pase se consume al encolar y se
 * devuelve si la reserva en cola se cancela).
 */
import type { SupabaseClient } from "@supabase/supabase-js"

export const NEXT_BAG_WINDOW_DAYS = 7
const DAY_MS = 24 * 60 * 60 * 1000

/** Estados de una reserva "en curso" (el bolso esta o va a estar en manos de la socia). No incluye 'queued'. */
export const ONGOING_EXCLUDED_STATUSES = "(completed,cancelled,canceled,queued)"

export type NextBagBlockReason =
  | "no_bag_in_hand"
  | "bag_overdue"
  | "membership_not_active"
  | "membership_ending"
  | "no_renewal_date"
  | "window_closed"
  | "already_queued"

export interface NextBagState {
  /** La socia tiene un bolso en curso (en casa o de camino). */
  hasBagInHand: boolean
  ongoing: { id: string; status: string; bagLabel: string } | null
  /** Reserva en cola, si la hay. */
  queued: { id: string; bagId: string; bagLabel: string; imageUrl: string | null; createdAt: string } | null
  renewalDate: string | null
  daysToRenewal: number | null
  /** Primer dia en que podra elegir su proximo bolso (7 dias antes de renovar). */
  windowOpensAt: string | null
  windowOpen: boolean
  /** Puede reservar ahora mismo un bolso como "proximo bolso". */
  canQueue: boolean
  reason: NextBagBlockReason | null
}

type BagRel = { name?: string | null; brand?: string | null; image_url?: string | null } | null

function bagLabelOf(bags: unknown): string {
  const bag = (Array.isArray(bags) ? bags[0] : bags) as BagRel
  return bag ? `${bag.brand || ""} ${bag.name || ""}`.trim() : "tu bolso"
}

export async function getNextBagState(supabase: SupabaseClient, userId: string): Promise<NextBagState> {
  const [{ data: ongoing }, { data: queued }, { data: membership }] = await Promise.all([
    supabase
      .from("reservations")
      .select("id, status, bags(name, brand)")
      .eq("user_id", userId)
      .not("status", "in", ONGOING_EXCLUDED_STATUSES)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("reservations")
      .select("id, bag_id, created_at, bags(name, brand, image_url)")
      .eq("user_id", userId)
      .eq("status", "queued")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("user_memberships")
      .select("status, cancel_at_period_end, current_period_end, end_date, start_date, membership_type")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  // Fecha de renovacion: la del periodo en curso; Petite sin periodo propio = 30 dias desde el inicio.
  let renewal: Date | null = null
  const rawRenewal = membership?.current_period_end || membership?.end_date || null
  if (rawRenewal) renewal = new Date(rawRenewal)
  else if (membership?.start_date) renewal = new Date(new Date(membership.start_date).getTime() + 30 * DAY_MS)

  const daysToRenewal = renewal ? (renewal.getTime() - Date.now()) / DAY_MS : null
  const windowOpen = daysToRenewal !== null && daysToRenewal >= 0 && daysToRenewal <= NEXT_BAG_WINDOW_DAYS
  const windowOpensAt = renewal ? new Date(renewal.getTime() - NEXT_BAG_WINDOW_DAYS * DAY_MS).toISOString() : null

  let reason: NextBagBlockReason | null = null
  if (!ongoing) reason = "no_bag_in_hand"
  else if (ongoing.status === "overdue") reason = "bag_overdue"
  else if (!membership || membership.status !== "active") reason = "membership_not_active"
  else if (membership.cancel_at_period_end) reason = "membership_ending"
  else if (!renewal) reason = "no_renewal_date"
  else if (!windowOpen) reason = "window_closed"
  else if (queued) reason = "already_queued"

  const queuedRow = queued as
    | { id: string; bag_id: string; created_at: string; bags: unknown }
    | null
  const queuedBag = queuedRow ? ((Array.isArray(queuedRow.bags) ? queuedRow.bags[0] : queuedRow.bags) as BagRel) : null

  return {
    hasBagInHand: !!ongoing,
    ongoing: ongoing ? { id: ongoing.id as string, status: ongoing.status as string, bagLabel: bagLabelOf((ongoing as any).bags) } : null,
    queued: queuedRow
      ? {
          id: queuedRow.id,
          bagId: queuedRow.bag_id,
          bagLabel: bagLabelOf(queuedRow.bags),
          imageUrl: queuedBag?.image_url ?? null,
          createdAt: queuedRow.created_at,
        }
      : null,
    renewalDate: renewal ? renewal.toISOString() : null,
    daysToRenewal: daysToRenewal === null ? null : Math.ceil(daysToRenewal),
    windowOpensAt,
    windowOpen,
    canQueue: !reason,
    reason,
  }
}

/** Mensaje para la socia cuando no puede reservar otro bolso mientras tiene uno. */
export function nextBagBlockMessage(state: NextBagState): string {
  const current = state.ongoing?.bagLabel || "tu bolso actual"
  switch (state.reason) {
    case "window_closed": {
      const opens = state.windowOpensAt
        ? new Date(state.windowOpensAt).toLocaleDateString("es-ES", { day: "numeric", month: "long" })
        : null
      return opens
        ? `Tienes una reserva en curso con ${current}. Podrás reservar tu próximo bolso a partir del ${opens}, en los últimos ${NEXT_BAG_WINDOW_DAYS} días de tu ciclo.`
        : `Tienes una reserva en curso con ${current}. Podrás reservar tu próximo bolso en los últimos ${NEXT_BAG_WINDOW_DAYS} días de tu ciclo.`
    }
    case "already_queued":
      return `Ya tienes tu próximo bolso reservado (${state.queued?.bagLabel || "en cola"}). Saldrá hacia ti en cuanto recibamos ${current}.`
    case "bag_overdue":
      return `Tu reserva con ${current} está vencida. Devuélvelo para poder reservar tu siguiente bolso.`
    case "membership_ending":
    case "membership_not_active":
      return `Tienes una reserva en curso con ${current}. Para reservar un nuevo bolso, primero envía el actual a Semzo Privé. En cuanto recibamos la devolución podrás elegir tu siguiente bolso.`
    default:
      return `Tienes una reserva en curso con ${current}. Para reservar un nuevo bolso, primero envía el actual a Semzo Privé. En cuanto recibamos la devolución podrás elegir tu siguiente bolso.`
  }
}

/**
 * Cancela la reserva en cola de una socia: libera el bolso (lo hace el trigger de BD al pasar a 'cancelled') y
 * devuelve el Pase de Bolso si se uso uno. Devuelve true si habia algo que cancelar.
 */
export async function cancelQueuedReservation(
  supabase: SupabaseClient,
  userId: string,
  reason: string,
): Promise<{ cancelled: boolean; reservationId?: string }> {
  const { data: queued } = await supabase
    .from("reservations")
    .select("id, bag_pass_id")
    .eq("user_id", userId)
    .eq("status", "queued")
    .limit(1)
    .maybeSingle()

  if (!queued) return { cancelled: false }

  const { error } = await supabase
    .from("reservations")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", queued.id)
    .eq("status", "queued")
  if (error) {
    console.error("[next-bag-queue] No se pudo cancelar la reserva en cola:", error.message)
    return { cancelled: false }
  }

  if (queued.bag_pass_id) {
    await supabase
      .from("bag_passes")
      .update({ status: "available", used_at: null, used_for_reservation_id: null })
      .eq("id", queued.bag_pass_id)
      .eq("status", "used")
  }

  await supabase.from("audit_log").insert({
    user_id: userId,
    action: "queued_reservation_cancelled",
    entity_type: "reservation",
    entity_id: queued.id,
    old_data: { status: "queued" },
    new_data: { status: "cancelled", reason },
    created_at: new Date().toISOString(),
  })

  return { cancelled: true, reservationId: queued.id as string }
}

/**
 * Cuando Logistica confirma la devolucion del bolso actual: la reserva en cola pasa a 'confirmed' y entra en el
 * flujo normal de envio (fechas desde hoy). Si la membresia ya no esta activa, se cancela en lugar de enviarla.
 * Nunca lanza: un fallo aqui no debe tumbar el cierre de la devolucion.
 */
export async function promoteQueuedReservation(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ promoted: boolean; cancelled?: boolean; reservationId?: string; bagLabel?: string }> {
  try {
    const { data: queued } = await supabase
      .from("reservations")
      .select("id, bag_id, rental_days, bags(name, brand)")
      .eq("user_id", userId)
      .eq("status", "queued")
      .limit(1)
      .maybeSingle()

    if (!queued) return { promoted: false }

    const { data: membership } = await supabase
      .from("user_memberships")
      .select("status, cancel_at_period_end")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!membership || membership.status !== "active" || membership.cancel_at_period_end) {
      const result = await cancelQueuedReservation(supabase, userId, "membership_not_active_on_return")
      return { promoted: false, cancelled: result.cancelled }
    }

    const start = new Date()
    const end = new Date(start.getTime() + (Number(queued.rental_days) || 30) * DAY_MS)
    const { error } = await supabase
      .from("reservations")
      .update({
        status: "confirmed",
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", queued.id)
      .eq("status", "queued")
    if (error) {
      console.error("[next-bag-queue] No se pudo activar la reserva en cola:", error.message)
      return { promoted: false }
    }

    await supabase.from("audit_log").insert({
      user_id: userId,
      action: "queued_reservation_promoted",
      entity_type: "reservation",
      entity_id: queued.id,
      old_data: { status: "queued" },
      new_data: { status: "confirmed" },
      created_at: new Date().toISOString(),
    })

    return { promoted: true, reservationId: queued.id as string, bagLabel: bagLabelOf((queued as any).bags) }
  } catch (err) {
    console.error("[next-bag-queue] Error activando la reserva en cola:", err)
    return { promoted: false }
  }
}

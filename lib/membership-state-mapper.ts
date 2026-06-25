/**
 * MEMBERSHIP STATE MAPPER
 *
 * Centraliza el mapeo entre estados de DB y estados de UI.
 * Source of Truth: user_memberships.status
 *
 * Estados DB (user_memberships):
 * - initiated: Pago iniciado, esperando confirmación de Stripe
 * - paid_pending_verification: Pago completado, esperando verificación de identidad
 * - pending_sepa: Pago verificado pero falta validar SEPA
 * - pending_verification: Pendiente verificación de identidad
 * - active: Membresía completamente activa
 * - paused: Membresía pausada por el usuario
 * - past_due: Pago fallido, en periodo de gracia
 * - cancelling: Cancelada pero con acceso hasta end_date
 * - cancelled / canceled: Cancelada (puede tener o no acceso, depende de end_date)
 * - expired: Membresía expirada (Petite cuando ya pasó end_date)
 *
 * Estados UI: añadimos `cancelled_active` para diferenciar
 * "cancelada con acceso vigente" vs "cancelada sin acceso".
 */

export type MembershipDBStatus =
  | "initiated"
  | "paid_pending_verification"
  | "pending_sepa"
  | "pending_verification"
  | "active"
  | "paused"
  | "past_due"
  | "cancelling"
  | "cancelled"
  | "canceled"
  | "expired"

export type MembershipUIStatus =
  | "pending_payment"
  | "pending_verification"
  | "pending_sepa"
  | "active"
  | "paused"
  | "past_due"
  | "cancelled_active" // cancelada PERO con acceso hasta end_date
  | "cancelled"
  | "expired"
  | "inactive"

/**
 * Devuelve true si el usuario aún tiene acceso efectivo a la plataforma.
 * Una membresía cancelada con end_date en el futuro mantiene acceso.
 */
export function hasEffectiveAccess(
  dbStatus: string | null | undefined,
  endDate: string | null | undefined,
): boolean {
  if (!dbStatus) return false

  // Estados que conceden acceso siempre que estén vigentes
  const accessGrantingStates = ["active", "cancelling", "cancelled", "canceled", "past_due"]
  if (!accessGrantingStates.includes(dbStatus)) return false

  // Si es active sin end_date, asumimos acceso vigente (suscripción mensual recurrente)
  if (dbStatus === "active" && !endDate) return true

  // Para cancelled/cancelling/past_due: comprobar end_date
  if (!endDate) return false
  const end = new Date(endDate)
  return end.getTime() > Date.now()
}

/**
 * Mapea el estado de DB al estado de UI considerando end_date.
 * Necesita end_date para distinguir cancelled_active vs cancelled.
 */
export function mapDBStatusToUI(
  dbStatus: string | null | undefined,
  endDate?: string | null,
): MembershipUIStatus {
  if (!dbStatus) return "inactive"

  // Casos especiales que dependen de end_date
  if (dbStatus === "cancelling" || dbStatus === "cancelled" || dbStatus === "canceled") {
    return hasEffectiveAccess(dbStatus, endDate) ? "cancelled_active" : "cancelled"
  }

  const statusMap: Record<string, MembershipUIStatus> = {
    initiated: "pending_payment",
    paid_pending_verification: "pending_verification",
    pending_verification: "pending_verification",
    pending_sepa: "pending_sepa",
    active: "active",
    paused: "paused",
    past_due: "past_due",
    expired: "expired",
  }

  return statusMap[dbStatus] || "inactive"
}

/**
 * Labels amigables en español para cada estado UI
 */
export function getStatusLabel(uiStatus: MembershipUIStatus): string {
  const labels: Record<MembershipUIStatus, string> = {
    pending_payment: "Procesando pago...",
    pending_verification: "Pendiente verificación",
    pending_sepa: "Pendiente SEPA",
    active: "Activa",
    paused: "Pausada",
    past_due: "Pago pendiente",
    cancelled_active: "Cancelada (acceso vigente)",
    cancelled: "Cancelada",
    expired: "Expirada",
    inactive: "Sin membresía",
  }

  return labels[uiStatus] || "Desconocido"
}

/**
 * Descripciones para cada estado UI
 */
export function getStatusDescription(uiStatus: MembershipUIStatus, membershipType?: string): string {
  if (uiStatus === "pending_payment") return "Procesando tu pago"
  if (uiStatus === "pending_verification") return "Verifica tu identidad para activar"
  if (uiStatus === "pending_sepa") return "Confirma tu cuenta SEPA"
  if (uiStatus === "paused") return "Suscripción pausada"
  if (uiStatus === "past_due") return "Actualiza tu método de pago"
  if (uiStatus === "cancelled_active") return "Acceso hasta el final del periodo"
  if (uiStatus === "cancelled") return "Sin acceso. Puedes reactivar"
  if (uiStatus === "expired") return "Tu periodo ha terminado"
  if (uiStatus !== "active") return "Sin membresía activa"

  switch (membershipType) {
    case "petite":
      return "Hasta 4 bolsos al mes (7 días cada uno)"
    case "essentiel":
    case "lessentiel":
      return "1 bolso al mes (30 días)"
    case "signature":
      return "1 bolso al mes (30 días)"
    case "prive":
      return "1 bolso al mes (30 días) — Acceso completo"
    default:
      return "Acceso básico"
  }
}

/**
 * Mapea un estado de Stripe.Subscription.status al vocabulario interno.
 *
 * IMPORTANTE: este mapping respeta la "REGLA DE ORO" del webhook:
 *   nunca promover a "active" desde Stripe sin haber pasado por
 *   identity/sepa. Por eso "active" de Stripe -> null aqui (no propagar).
 *
 * Solo propagamos estados de degradacion / cancelacion.
 */
export function mapStripeStatusToInternal(
  stripeStatus: string | null | undefined,
): MembershipDBStatus | null {
  if (!stripeStatus) return null

  // active de Stripe NO se propaga (lo otorgan resume-onboarding/activate)
  const propagateMap: Record<string, MembershipDBStatus> = {
    canceled: "cancelled",
    incomplete_expired: "expired",
    past_due: "past_due",
    unpaid: "past_due",
    paused: "paused",
  }

  return propagateMap[stripeStatus] ?? null
}

/**
 * Decide si una membresia permite crear nuevas reservas.
 * Esta es LA fuente unica de verdad de elegibilidad.
 *
 * Regla de negocio (acordada):
 *   - can_make_reservations = true  (intencion explicita guardada por
 *     los flujos de cancel/activate/orchestrator)
 *   - membresia vigente por fecha (end_date NULL = recurrente activa, o
 *     end_date > NOW())
 *   - status sirve como senial secundaria: "expired" o "incomplete_expired"
 *     bloquean siempre, aunque can_make_reservations no se haya limpiado.
 *
 * NOTA: cancel_at_period_end=true NO bloquea de forma ciega: el modelo
 * actual permite reservar hasta end_date tras cancelar.
 */
export function canCreateReservations(membership: {
  status?: string | null
  can_make_reservations?: boolean | null
  end_date?: string | null
}): { allowed: boolean; reason?: string } {
  if (!membership) return { allowed: false, reason: "no_membership" }

  // Bloqueos duros independientemente del flag.
  // past_due / unpaid = socia MOROSA: jamas puede reservar hasta regularizar
  // el pago (esto es regla de negocio del ecommerce, no opcional).
  const hardBlockStatuses = new Set([
    "expired",
    "incomplete_expired",
    "initiated",
    "paused",
    "past_due",
    "unpaid",
  ])
  if (membership.status && hardBlockStatuses.has(membership.status)) {
    return { allowed: false, reason: `status_${membership.status}` }
  }

  // Intencion explicita
  if (membership.can_make_reservations === false) {
    return { allowed: false, reason: "can_make_reservations_false" }
  }

  // Vigencia por fecha
  if (membership.end_date) {
    const end = new Date(membership.end_date).getTime()
    if (end <= Date.now()) {
      return { allowed: false, reason: "end_date_passed" }
    }
  }

  return { allowed: true }
}

/**
 * Estados de reserva que se consideran TERMINADAS (la socia ya NO tiene el
 * bolso en su poder). Cualquier otro estado = bolso en posesion / en curso.
 */
export const FINISHED_RESERVATION_STATUSES = ["completed", "cancelled", "canceled"] as const

/**
 * Una reserva esta "en curso" (bolso en posesion de la socia o pendiente de
 * entrega/devolucion) mientras NO este completada ni cancelada. Esto cubre
 * pending, confirmed, active, shipped, delivered, in_use, returning, overdue
 * y cualquier estado intermedio futuro, sin tener que enumerarlos.
 *
 * Regla de negocio: 1 bolso a la vez. Si hay una reserva en curso, la socia
 * NO puede reservar ni comprar otro pase hasta devolver el bolso actual.
 */
export function isReservationOngoing(status: string | null | undefined): boolean {
  if (!status) return false
  return !FINISHED_RESERVATION_STATUSES.includes(status as any)
}

/**
 * Devuelve metadatos de un plan: ciclo, días por reserva, max bolsos.
 */
export function getPlanMeta(
  membershipType: string | null | undefined,
  billingCycle: string | null | undefined,
): {
  planLabel: string
  cycleLabel: string
  cycleDays: number
  bagDurationDays: number
  maxBagsPerCycle: number
  isPetite: boolean
} {
  const type = (membershipType || "").toLowerCase()
  const cycle = (billingCycle || "monthly").toLowerCase()

  const planLabels: Record<string, string> = {
    petite: "Petite",
    essentiel: "L'Essentiel",
    lessentiel: "L'Essentiel",
    signature: "Signature",
    prive: "Privé",
  }

  const isPetite = type === "petite"
  const isQuarterly = cycle === "quarterly" || cycle === "trimestral"

  return {
    planLabel: planLabels[type] || "Sin plan",
    cycleLabel: isPetite ? "Mensual (4 pases semanales)" : isQuarterly ? "Trimestral" : "Mensual",
    cycleDays: isQuarterly ? 90 : 30,
    bagDurationDays: isPetite ? 7 : 30,
    maxBagsPerCycle: isPetite ? 4 : isQuarterly ? 3 : 1,
    isPetite,
  }
}

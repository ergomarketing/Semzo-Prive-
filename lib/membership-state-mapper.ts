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

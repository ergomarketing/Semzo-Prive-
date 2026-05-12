/**
 * Chequeos antifraude del programa de referidos.
 *
 * Funciones puras: reciben los datos de referrer + referred ya cargados
 * y devuelven un veredicto. No tocan la DB. Se usan desde
 * `applyReferral.ts` para mantener la logica de validacion aislada y
 * facilmente testeable.
 */

export type ReferralRejection =
  | "invalid_code"
  | "self_referral"
  | "already_referred"
  | "same_email"
  | "same_stripe_customer"
  | "db_error"

export interface ReferralParty {
  id: string
  email: string | null
  stripe_customer_id: string | null
}

/**
 * Antifraude: mismo usuario intentando referirse a si mismo.
 */
export function isSelfReferral(referrer: ReferralParty, referredUserId: string): boolean {
  return referrer.id === referredUserId
}

/**
 * Antifraude: mismo email (case-insensitive, trim).
 * Cubre el caso de crear un alias gmail+test@ apuntando al mismo buzon.
 *
 * Si alguno de los emails es null/vacio devuelve `false` (no podemos
 * comparar) y el chequeo se considera no aplicable.
 */
export function isSameEmail(referrer: ReferralParty, referred: ReferralParty | null): boolean {
  if (!referrer.email || !referred?.email) return false
  return referrer.email.trim().toLowerCase() === referred.email.trim().toLowerCase()
}

/**
 * Antifraude: mismo stripe_customer_id (mismo metodo de pago / tarjeta).
 * Solo aplica si ambos tienen customer_id asignado en Stripe.
 */
export function isSameStripeCustomer(referrer: ReferralParty, referred: ReferralParty | null): boolean {
  if (!referrer.stripe_customer_id || !referred?.stripe_customer_id) return false
  return referrer.stripe_customer_id === referred.stripe_customer_id
}

/**
 * Orquestador: ejecuta los chequeos en orden y devuelve el primer motivo
 * de rechazo encontrado, o null si todo OK.
 *
 * Orden importante: self_referral primero porque es el mas explicito.
 */
export function validateReferralAntifraud(
  referrer: ReferralParty,
  referred: ReferralParty | null,
  referredUserId: string,
): ReferralRejection | null {
  if (isSelfReferral(referrer, referredUserId)) return "self_referral"
  if (isSameEmail(referrer, referred)) return "same_email"
  if (isSameStripeCustomer(referrer, referred)) return "same_stripe_customer"
  return null
}

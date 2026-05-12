/**
 * Barrel export del modulo de referidos.
 *
 * Re-exporta todo lo publico para que callers existentes que importen
 * desde `@/lib/referrals` (sin path interno) sigan funcionando sin
 * cambios. La estructura interna en 4 archivos cumple la spec oficial:
 *
 *   - referralStatus     -> tipos + lectura/agregados (stats + lista)
 *   - generateReferralCode -> creacion/aprovisionamiento del codigo
 *   - validateReferral   -> chequeos antifraude (puros)
 *   - applyReferral      -> mutacion: registrar fila pending
 */
export {
  type ReferralStatus,
  type ReferralRow,
  type ReferralStats,
  getReferralList,
  getReferralStats,
} from "./referralStatus"

export { buildReferralCodeCandidate, getOrCreateReferralCode } from "./generateReferralCode"

export {
  type ReferralRejection,
  type ReferralParty,
  isSelfReferral,
  isSameEmail,
  isSameStripeCustomer,
  validateReferralAntifraud,
} from "./validateReferral"

export {
  type TrackReferralRejection,
  applyReferral,
  // Alias deprecated mantenido para compatibilidad temporal.
  trackReferralSignup,
} from "./applyReferral"

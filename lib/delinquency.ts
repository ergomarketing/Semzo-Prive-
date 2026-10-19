/**
 * Reglas de morosidad (impago de la membresia), acordadas con Erika (2026-10-19):
 *
 *  - Desde el DIA 0 del impago la socia NO puede reservar (canCreateReservations: past_due es bloqueo duro).
 *  - Mantiene el ACCESO AL PANEL durante el periodo de gracia (DELINQUENCY_GRACE_DAYS) para poder pagar.
 *  - Avisos: correo 1 al fallo (dia 0), correo 2 a los 3 dias, correo 3 a los 7 (cron send-dunning-emails).
 *  - Pasados SUSPEND_AFTER_DAYS (24 h despues del correo 3) el cron marca la membresia como suspendida
 *    (suspended_at): sin acceso al panel hasta regularizar. Si tiene un bolso en casa, se le pide la devolucion.
 *  - Al cobrarse la cuota (Stripe) se limpia todo: past_due_since y suspended_at vuelven a null.
 */
export const DELINQUENCY_GRACE_DAYS = 7
export const SUSPEND_AFTER_DAYS = 8
/** Plazo que se da para devolver el bolso cuando la membresia queda suspendida. */
export const SUSPENDED_RETURN_DAYS = 7

const DAY_MS = 24 * 60 * 60 * 1000

/** ¿Sigue la socia morosa dentro del periodo de gracia (con acceso al panel)? */
export function isWithinDelinquencyGrace(
  pastDueSince: string | null | undefined,
  suspendedAt: string | null | undefined,
  now = Date.now(),
): boolean {
  if (suspendedAt) return false
  // Sin marca de inicio (datos antiguos) se conserva la regla anterior: la decide end_date en quien llama.
  if (!pastDueSince) return false
  return now - new Date(pastDueSince).getTime() < DELINQUENCY_GRACE_DAYS * DAY_MS
}

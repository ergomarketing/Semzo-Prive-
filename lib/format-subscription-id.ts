/**
 * Helper para generar IDs amigables de suscripción Semzo Privé.
 *
 * Opción 1 (la elegida): tomar los últimos 6 caracteres del
 * `stripe_subscription_id` real y prefijar con "SP-".
 *
 * Ejemplos:
 *   sub_1QXyZaBcDeFgHiJk  ->  SP-FGHIJK
 *   sub_1RABC123DEF456    ->  SP-DEF456
 *
 * Garantías:
 * - Determinista: el mismo input siempre devuelve el mismo output.
 * - Único en la práctica: Stripe genera IDs únicos, y los últimos
 *   6 chars son aleatorios (~62^6 = 56.000M combinaciones).
 * - No expone el ID interno de Supabase ni el sub_ completo.
 *
 * Para soporte interno: si la socia reporta "SP-FGHIJK", el admin
 * busca en Stripe `sub_*FGHIJK` o filtra por sufijo en BD.
 */
export function formatSubscriptionId(stripeSubscriptionId: string | null | undefined): string | null {
  if (!stripeSubscriptionId || typeof stripeSubscriptionId !== "string") {
    return null
  }

  // Quitar prefijo "sub_" y limpiar (Stripe IDs usan [A-Za-z0-9])
  const clean = stripeSubscriptionId.replace(/^sub_/i, "").replace(/[^A-Za-z0-9]/g, "")

  if (clean.length < 4) {
    // ID sospechosamente corto, no generar formato falso
    return null
  }

  // Coger los últimos 6 caracteres (o todos si hay menos) y mayúsculas
  const suffix = clean.slice(-6).toUpperCase()

  return `SP-${suffix}`
}

/**
 * Fallback: si la socia no tiene `stripe_subscription_id` (membresía
 * cancelada, pagada con gift card, regalo, etc.), generamos el ID
 * amigable desde el UUID interno de `user_memberships.id`.
 *
 * Mismo formato SP-XXXXXX para que soporte pueda buscar igual.
 */
export function formatMembershipId(membershipUuid: string | null | undefined): string | null {
  if (!membershipUuid || typeof membershipUuid !== "string") {
    return null
  }
  const clean = membershipUuid.replace(/-/g, "")
  if (clean.length < 4) return null
  return `SP-${clean.slice(-6).toUpperCase()}`
}

/**
 * Inverso: dado un ID amigable "SP-FGHIJK", devuelve el sufijo
 * para que el admin pueda buscar en BD con `LIKE '%FGHIJK'`.
 * Devuelve null si el formato no es válido.
 */
export function parseSubscriptionIdSuffix(friendlyId: string | null | undefined): string | null {
  if (!friendlyId || typeof friendlyId !== "string") return null
  const match = friendlyId.trim().toUpperCase().match(/^SP-([A-Z0-9]{4,8})$/)
  return match ? match[1] : null
}

// ─── MEMBRESÍAS ──────────────────────────────────────────────────────────────
// Pagos recurrentes vía Stripe Subscriptions
// Endpoint: /api/stripe/create-subscription-checkout

export const MEMBERSHIP_PLANS = {
  petite: {
    price: 19.99,
    billing_cycle: "weekly",
    label: "Petite",
    stripe_interval: "week",
  },
  essentiel: {
    price: 59,
    billing_cycle: "monthly",
    label: "L'Essentiel",
    stripe_interval: "month",
  },
  signature: {
    price: 89,
    billing_cycle: "monthly",
    label: "Signature",
    stripe_interval: "month",
  },
  prive: {
    price: 149,
    billing_cycle: "monthly",
    label: "Privé",
    stripe_interval: "month",
  },
} as const

export type MembershipType = keyof typeof MEMBERSHIP_PLANS

export function getMembershipPlan(type: string) {
  return MEMBERSHIP_PLANS[type?.toLowerCase() as MembershipType] ?? null
}

export function validateMembershipType(type: string): type is MembershipType {
  return type?.toLowerCase() in MEMBERSHIP_PLANS
}

// ─── PASES DE BOLSO ──────────────────────────────────────────────────────────
// Pagos únicos vía Stripe Payment (mode: "payment")
// Endpoint: /api/stripe/create-payment-checkout

export const BAG_PASSES = {
  semana: {
    price: 25,
    label: "Pase Semanal",
    description: "Acceso semanal a un bolso de lujo",
    duration_days: 7,
  },
  fin_de_semana: {
    price: 15,
    label: "Pase Fin de Semana",
    description: "Acceso de fin de semana a un bolso de lujo",
    duration_days: 2,
  },
} as const

export type BagPassType = keyof typeof BAG_PASSES

export function getBagPass(type: string) {
  return BAG_PASSES[type?.toLowerCase() as BagPassType] ?? null
}

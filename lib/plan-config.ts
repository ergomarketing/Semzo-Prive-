// ─── MEMBRESÍAS ──────────────────────────────────────────────────────────────
// Pagos recurrentes vía Stripe Subscriptions
// Endpoint: /api/stripe/create-subscription-checkout

export const MEMBERSHIP_PLANS = {
  petite: {
    price_monthly: 19.99,
    price_quarterly: null,
    label: "Petite",
    stripe_interval: "month", // suscripción mensual — los pases se renuevan semanalmente aparte
  },
  essentiel: {
    price_monthly: 59,
    price_quarterly: 142,
    label: "L'Essentiel",
    stripe_interval: "month",
  },
  signature: {
    price_monthly: 129,
    price_quarterly: 310,
    label: "Signature",
    stripe_interval: "month",
  },
  prive: {
    price_monthly: 189,
    price_quarterly: 453,
    label: "Privé",
    stripe_interval: "month",
  },
} as const

export type MembershipType = keyof typeof MEMBERSHIP_PLANS

export function getMembershipPlan(type: string) {
  return MEMBERSHIP_PLANS[type?.toLowerCase() as MembershipType] ?? null
}

export function getMembershipPrice(type: string, billingCycle: string): number | null {
  const plan = getMembershipPlan(type)
  if (!plan) return null
  if (billingCycle === "quarterly") return plan.price_quarterly ?? null
  return plan.price_monthly
}

export function validateMembershipType(type: string): type is MembershipType {
  return type?.toLowerCase() in MEMBERSHIP_PLANS
}

// ─── PASES DE BOLSO ──────────────────────────────────────────────────────────
// Pagos únicos vía Stripe Payment (mode: "payment")
// Endpoint: /api/stripe/create-payment-checkout

export const BAG_PASSES = {
  essentiel: {
    price: 52,
    label: "Pase L'Essentiel",
    description: "Acceso a un bolso de la selección Essentiel",
  },
  signature: {
    price: 99,
    label: "Pase Signature",
    description: "Acceso a un bolso de la selección Signature",
  },
  prive: {
    price: 137,
    label: "Pase Privé",
    description: "Acceso a un bolso de la selección Privé",
  },
} as const

export type BagPassType = keyof typeof BAG_PASSES

export function getBagPass(type: string) {
  return BAG_PASSES[type?.toLowerCase() as BagPassType] ?? null
}

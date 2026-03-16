export const PLAN_CONFIG = {
  petite: {
    price: 19.99,
    billing_cycle: "weekly",
    label: "Petite",
  },
  essentiel: {
    price: 59,
    billing_cycle: "monthly",
    label: "L'Essentiel",
  },
  signature: {
    price: 89,
    billing_cycle: "monthly",
    label: "Signature",
  },
  prive: {
    price: 149,
    billing_cycle: "monthly",
    label: "Privé",
  },
} as const

export type MembershipType = keyof typeof PLAN_CONFIG

export function getPlanConfig(membershipType: string) {
  const type = membershipType?.toLowerCase() as MembershipType
  const config = PLAN_CONFIG[type]
  if (!config) return null
  return config
}

export function validateMembershipType(membershipType: string): membershipType is MembershipType {
  return !!PLAN_CONFIG[membershipType?.toLowerCase() as MembershipType]
}

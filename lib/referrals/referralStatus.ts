/**
 * Tipos y agregados de estado del programa de referidos SEMZO PRIVE.
 *
 * Aqui SOLO se exponen tipos, lectura y agregaciones. La logica de
 * mutacion vive en `applyReferral.ts` y los chequeos antifraude en
 * `validateReferral.ts`.
 */
import { getSupabaseServiceRole } from "@/lib/supabase"

// Estados oficiales del programa (alineados con el CHECK del SQL v2).
//   pending   -> signup registrado, todavia sin primer pago
//   paid      -> pago primer mes, contando 60 dias
//   qualified -> cumplio 60 dias activos, credito pendiente de aplicar
//   rewarded  -> credito de 50 EUR ya aplicado al referrer
//   rejected  -> cancelado o invalidado (incluye antifraude)
export type ReferralStatus = "pending" | "paid" | "qualified" | "rewarded" | "rejected"

export interface ReferralRow {
  id: string
  referrer_user_id: string
  referred_user_id: string
  referral_code: string
  status: ReferralStatus
  qualified_at: string | null
  reward_applied_at: string | null
  stripe_customer_id: string | null
  created_at: string
}

export interface ReferralStats {
  referralCode: string
  referralLink: string
  totalReferrals: number
  pendingReferrals: number
  paidReferrals: number
  qualifiedReferrals: number
  rewardedReferrals: number
  rejectedReferrals: number
  balanceEuros: number
}

/**
 * Devuelve la lista cruda de referidos del usuario, ordenada por fecha
 * descendente. Usa el cliente service-role para saltarse RLS de forma
 * controlada (el caller debe haber autenticado al usuario previamente).
 */
export async function getReferralList(userId: string): Promise<ReferralRow[]> {
  const admin = getSupabaseServiceRole()
  if (!admin) return []

  const { data, error } = await admin
    .from("referrals")
    .select(
      "id, referrer_user_id, referred_user_id, referral_code, status, qualified_at, reward_applied_at, stripe_customer_id, created_at",
    )
    .eq("referrer_user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] getReferralList error:", error)
    return []
  }
  return (data || []) as ReferralRow[]
}

/**
 * Obtiene las estadisticas agregadas del usuario (codigo + contadores
 * por estado + saldo). NO incluye la lista detallada: para eso usa
 * `getReferralList(userId)` por separado.
 */
export async function getReferralStats(userId: string): Promise<ReferralStats | null> {
  const admin = getSupabaseServiceRole()
  if (!admin) return null

  // Import dinamico para evitar dependencia circular con generateReferralCode.
  const { getOrCreateReferralCode } = await import("./generateReferralCode")

  const code = await getOrCreateReferralCode(userId)
  if (!code) return null

  const { data: profile } = await admin
    .from("profiles")
    .select("referral_balance")
    .eq("id", userId)
    .maybeSingle()

  const { data: rows } = await admin.from("referrals").select("status").eq("referrer_user_id", userId)

  const totals = {
    total: 0,
    pending: 0,
    paid: 0,
    qualified: 0,
    rewarded: 0,
    rejected: 0,
  }
  for (const r of rows || []) {
    totals.total += 1
    const s = r.status as ReferralStatus
    if (s === "pending") totals.pending += 1
    else if (s === "paid") totals.paid += 1
    else if (s === "qualified") totals.qualified += 1
    else if (s === "rewarded") totals.rewarded += 1
    else if (s === "rejected") totals.rejected += 1
  }

  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://semzoprive.com").replace(/\/$/, "")

  return {
    referralCode: code,
    referralLink: `${baseUrl}/signup?ref=${code}`,
    totalReferrals: totals.total,
    pendingReferrals: totals.pending,
    paidReferrals: totals.paid,
    qualifiedReferrals: totals.qualified,
    rewardedReferrals: totals.rewarded,
    rejectedReferrals: totals.rejected,
    balanceEuros: Number(profile?.referral_balance ?? 0),
  }
}

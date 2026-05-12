/**
 * Helpers del sistema de referidos SEMZO PRIVE.
 *
 * Fase 1: solo lectura, generacion de codigo y tracking del signup.
 * NO aplica creditos automaticamente. NO toca Stripe.
 */
import { getSupabaseServiceRole } from "@/lib/supabase"

export type ReferralStatus = "pending" | "qualified" | "rewarded" | "cancelled"

export interface ReferralRow {
  id: string
  referrer_user_id: string
  referred_user_id: string
  referral_code: string
  status: ReferralStatus
  qualified_at: string | null
  reward_applied_at: string | null
  created_at: string
}

export interface ReferralStats {
  referralCode: string
  referralLink: string
  totalReferrals: number
  pendingReferrals: number
  qualifiedReferrals: number
  rewardedReferrals: number
  balanceEuros: number
}

/**
 * Genera un codigo de referido limpio a partir de un nombre o email.
 * Solo mayusculas alfanumericas, max 8 chars + sufijo si choca.
 *
 * NOTA: la unicidad se garantiza con un retry en DB. Esta funcion solo
 * produce el candidato.
 */
export function buildReferralCodeCandidate(seed: string): string {
  const cleaned = (seed || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
  const base = cleaned.length >= 3 ? cleaned : `${cleaned}USER`
  return base.slice(0, 8)
}

/**
 * Devuelve el codigo de referido del usuario. Si no existe, lo crea
 * en DB (esto solo deberia ocurrir para usuarios pre-migracion que no
 * pasaron por el backfill).
 */
export async function getOrCreateReferralCode(userId: string): Promise<string | null> {
  const admin = getSupabaseServiceRole()
  if (!admin) return null

  const { data: profile } = await admin
    .from("profiles")
    .select("referral_code, first_name, email")
    .eq("id", userId)
    .maybeSingle()

  if (profile?.referral_code) return profile.referral_code

  // Generar y guardar con reintentos por si choca con otro codigo.
  const seed = profile?.first_name || profile?.email || "USER"
  let candidate = buildReferralCodeCandidate(seed)
  let attempt = 0
  while (attempt < 10) {
    const try_code = attempt === 0 ? candidate : `${candidate}${attempt}`
    const { error } = await admin
      .from("profiles")
      .update({ referral_code: try_code })
      .eq("id", userId)
    if (!error) return try_code
    // Si error es unique-violation, reintentamos con sufijo.
    if ((error as any)?.code !== "23505") {
      console.error("[v0] getOrCreateReferralCode update error:", error)
      return null
    }
    attempt += 1
  }
  return null
}

/**
 * Obtiene las estadisticas del usuario (codigo + contadores + saldo).
 */
export async function getReferralStats(userId: string): Promise<ReferralStats | null> {
  const admin = getSupabaseServiceRole()
  if (!admin) return null

  const code = await getOrCreateReferralCode(userId)
  if (!code) return null

  const { data: profile } = await admin
    .from("profiles")
    .select("referral_balance")
    .eq("id", userId)
    .maybeSingle()

  const { data: rows } = await admin
    .from("referrals")
    .select("status")
    .eq("referrer_user_id", userId)

  const totals = { total: 0, pending: 0, qualified: 0, rewarded: 0 }
  for (const r of rows || []) {
    totals.total += 1
    if (r.status === "pending") totals.pending += 1
    else if (r.status === "qualified") totals.qualified += 1
    else if (r.status === "rewarded") totals.rewarded += 1
  }

  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://semzoprive.com").replace(/\/$/, "")

  return {
    referralCode: code,
    referralLink: `${baseUrl}/signup?ref=${code}`,
    totalReferrals: totals.total,
    pendingReferrals: totals.pending,
    qualifiedReferrals: totals.qualified,
    rewardedReferrals: totals.rewarded,
    balanceEuros: Number(profile?.referral_balance ?? 0),
  }
}

/**
 * Registra un signup que llego con un codigo de referido.
 * Idempotente: si ya existe una fila para ese referido, no la duplica.
 *
 * Validaciones:
 *   - El codigo existe en la tabla profiles
 *   - El referrer no es el mismo usuario que el referido
 *   - El referido no ha sido referido antes
 */
export async function trackReferralSignup(params: {
  referralCode: string
  referredUserId: string
}): Promise<
  | { ok: true; referrerUserId: string }
  | { ok: false; reason: "invalid_code" | "self_referral" | "already_referred" | "db_error" }
> {
  const admin = getSupabaseServiceRole()
  if (!admin) return { ok: false, reason: "db_error" }

  const code = (params.referralCode || "").trim().toUpperCase()
  if (!code) return { ok: false, reason: "invalid_code" }

  // 1) Resolver el referrer a partir del codigo.
  const { data: referrer } = await admin
    .from("profiles")
    .select("id")
    .eq("referral_code", code)
    .maybeSingle()

  if (!referrer?.id) return { ok: false, reason: "invalid_code" }
  if (referrer.id === params.referredUserId) return { ok: false, reason: "self_referral" }

  // 2) Ya existe registro para este referido?
  const { data: existing } = await admin
    .from("referrals")
    .select("id")
    .eq("referred_user_id", params.referredUserId)
    .maybeSingle()
  if (existing?.id) return { ok: false, reason: "already_referred" }

  // 3) Insertar la fila pending.
  const { error } = await admin.from("referrals").insert({
    referrer_user_id: referrer.id,
    referred_user_id: params.referredUserId,
    referral_code: code,
    status: "pending",
  })

  if (error) {
    console.error("[v0] trackReferralSignup insert error:", error)
    return { ok: false, reason: "db_error" }
  }

  return { ok: true, referrerUserId: referrer.id }
}

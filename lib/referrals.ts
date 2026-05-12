/**
 * Helpers del sistema de referidos SEMZO PRIVE.
 *
 * Fase 1: solo lectura, generacion de codigo y tracking del signup.
 * NO aplica creditos automaticamente. NO toca Stripe.
 */
import { getSupabaseServiceRole } from "@/lib/supabase"

// Estados oficiales del programa (alineados con el CHECK del SQL v2).
// pending  -> signup registrado, todavia sin primer pago
// paid     -> pago primer mes, contando 60 dias
// qualified-> cumplio 60 dias activos, credito pendiente de aplicar
// rewarded -> credito de 50 EUR ya aplicado al referrer
// rejected -> cancelado o invalidado (incluye antifraude)
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
 * Genera un codigo de referido en formato NOMBRE + 4 digitos numericos
 * aleatorios (ej: "MARIA8472"). La unicidad final se garantiza en DB con
 * reintentos. Esta funcion solo produce el candidato.
 *
 * Reglas:
 *   - Sin acentos, solo alfanumericos, mayusculas
 *   - 5 chars del nombre (recortado o rellenado con 'USER')
 *   - 4 digitos aleatorios (0000-9999)
 */
export function buildReferralCodeCandidate(seed: string): string {
  const cleaned = (seed || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
  const padded = cleaned.length >= 3 ? cleaned : `${cleaned}USER`
  const base = padded.slice(0, 5)
  const suffix = String(Math.floor(Math.random() * 10000)).padStart(4, "0")
  return `${base}${suffix}`
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
    .select("referral_code, first_name, last_name, email")
    .eq("id", userId)
    .maybeSingle()

  if (profile?.referral_code) return profile.referral_code

  // Seed prioriza nombre real, fallback a parte local del email.
  const seed =
    profile?.first_name ||
    profile?.last_name ||
    (profile?.email ? profile.email.split("@")[0] : "USER")

  // Reintenta hasta 20 veces con codigos aleatorios diferentes.
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = buildReferralCodeCandidate(seed)
    const { error } = await admin
      .from("profiles")
      .update({ referral_code: candidate })
      .eq("id", userId)
    if (!error) return candidate
    // Si NO es unique-violation, error real -> abortar.
    if ((error as any)?.code !== "23505") {
      console.error("[v0] getOrCreateReferralCode update error:", error)
      return null
    }
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

export type TrackReferralRejection =
  | "invalid_code"
  | "self_referral"
  | "already_referred"
  | "same_email"
  | "same_stripe_customer"
  | "db_error"

/**
 * Registra un signup que llego con un codigo de referido.
 * Idempotente: si ya existe una fila para ese referido, no la duplica.
 *
 * Validaciones antifraude (todas obligatorias):
 *   1) El codigo existe en profiles
 *   2) referrer.id !== referred.id (no self-referral)
 *   3) El referido no ha sido referido antes (constraint UNIQUE tambien)
 *   4) referrer.email !== referred.email (mismo email)
 *   5) referrer.stripe_customer_id !== referred.stripe_customer_id
 *      (mismo customer Stripe - misma tarjeta)
 *
 * Si pasa todas, crea la fila con status='pending' y cachea el
 * stripe_customer_id del referido (si existe) para futuras comprobaciones.
 */
export async function trackReferralSignup(params: {
  referralCode: string
  referredUserId: string
}): Promise<
  | { ok: true; referrerUserId: string }
  | { ok: false; reason: TrackReferralRejection }
> {
  const admin = getSupabaseServiceRole()
  if (!admin) return { ok: false, reason: "db_error" }

  const code = (params.referralCode || "").trim().toUpperCase()
  if (!code) return { ok: false, reason: "invalid_code" }

  // 1) Resolver el referrer a partir del codigo (con email + customer_id).
  const { data: referrer } = await admin
    .from("profiles")
    .select("id, email, stripe_customer_id")
    .eq("referral_code", code)
    .maybeSingle()

  if (!referrer?.id) return { ok: false, reason: "invalid_code" }
  if (referrer.id === params.referredUserId) return { ok: false, reason: "self_referral" }

  // 2) Datos del referido para antifraude.
  const { data: referred } = await admin
    .from("profiles")
    .select("id, email, stripe_customer_id")
    .eq("id", params.referredUserId)
    .maybeSingle()

  // 3) Antifraude: mismo email (case-insensitive).
  if (
    referrer.email &&
    referred?.email &&
    referrer.email.trim().toLowerCase() === referred.email.trim().toLowerCase()
  ) {
    console.warn("[v0] referral rejected: same_email", { referrer: referrer.id, referred: referred.id })
    return { ok: false, reason: "same_email" }
  }

  // 4) Antifraude: mismo stripe_customer_id (mismo metodo de pago).
  if (
    referrer.stripe_customer_id &&
    referred?.stripe_customer_id &&
    referrer.stripe_customer_id === referred.stripe_customer_id
  ) {
    console.warn("[v0] referral rejected: same_stripe_customer", {
      referrer: referrer.id,
      referred: referred?.id,
    })
    return { ok: false, reason: "same_stripe_customer" }
  }

  // 5) Ya existe registro para este referido?
  const { data: existing } = await admin
    .from("referrals")
    .select("id")
    .eq("referred_user_id", params.referredUserId)
    .maybeSingle()
  if (existing?.id) return { ok: false, reason: "already_referred" }

  // 6) Insertar la fila pending con cache del stripe_customer_id.
  const { error } = await admin.from("referrals").insert({
    referrer_user_id: referrer.id,
    referred_user_id: params.referredUserId,
    referral_code: code,
    status: "pending",
    stripe_customer_id: referred?.stripe_customer_id ?? null,
  })

  if (error) {
    console.error("[v0] trackReferralSignup insert error:", error)
    return { ok: false, reason: "db_error" }
  }

  return { ok: true, referrerUserId: referrer.id }
}

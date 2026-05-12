/**
 * Generacion y aprovisionamiento de codigos de referido.
 *
 * Dos funciones:
 *   - buildReferralCodeCandidate: pura, devuelve un candidato a partir
 *     de una seed (nombre o email).
 *   - getOrCreateReferralCode: lee el codigo del perfil; si no existe
 *     genera candidatos y los persiste con reintentos por colision.
 */
import { getSupabaseServiceRole } from "@/lib/supabase"

/**
 * Construye un candidato de codigo en formato `NOMBRE + 4 digitos`
 * (ej. "MARIA8472"). La unicidad final se garantiza en DB; aqui
 * solo generamos el candidato.
 *
 * Reglas:
 *   - Quita acentos, deja solo alfanumericos en mayusculas.
 *   - 5 chars de la seed (rellenando con 'USER' si es corta).
 *   - Sufijo numerico aleatorio 0000-9999.
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
 * Devuelve el codigo de referido del usuario. Si no existe, genera
 * candidatos y los persiste con hasta 20 reintentos por colision
 * (unique-violation = 23505).
 *
 * Solo deberia entrar al bucle de generacion para usuarios pre-migracion
 * que no pasaron por el backfill del SQL v1.
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

  // Seed prioriza nombre real; fallback a parte local del email.
  const seed =
    profile?.first_name ||
    profile?.last_name ||
    (profile?.email ? profile.email.split("@")[0] : "USER")

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = buildReferralCodeCandidate(seed)
    const { error } = await admin.from("profiles").update({ referral_code: candidate }).eq("id", userId)
    if (!error) return candidate
    // Si NO es unique-violation, es error real -> abortar.
    if ((error as any)?.code !== "23505") {
      console.error("[v0] getOrCreateReferralCode update error:", error)
      return null
    }
  }
  return null
}

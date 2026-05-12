/**
 * Aplicacion (registro) de un referido en la tabla `referrals`.
 *
 * Funcion principal: `applyReferral`. Renombrada desde la anterior
 * `trackReferralSignup` para alinearse con la spec oficial. El nombre
 * antiguo se exporta como alias para mantener compatibilidad temporal.
 */
import { getSupabaseServiceRole } from "@/lib/supabase"
import { validateReferralAntifraud, type ReferralRejection } from "./validateReferral"

// Re-export del tipo de rechazo para callers (manteniendo el nombre que
// usaba la version anterior).
export type TrackReferralRejection = ReferralRejection

/**
 * Registra que un usuario se ha registrado con el codigo `referralCode`.
 * Crea una fila en `referrals` con status='pending' tras pasar todos los
 * chequeos antifraude.
 *
 * Idempotente: si el referido ya esta registrado por otra fila previa,
 * devuelve `already_referred` sin modificar nada.
 *
 * Validaciones (en orden):
 *   1) El codigo existe en `profiles`
 *   2) No es self-referral
 *   3) Mismo email
 *   4) Mismo stripe_customer_id
 *   5) El referido no ha sido referido antes
 */
export async function applyReferral(params: {
  referralCode: string
  referredUserId: string
}): Promise<{ ok: true; referrerUserId: string } | { ok: false; reason: ReferralRejection }> {
  const admin = getSupabaseServiceRole()
  if (!admin) return { ok: false, reason: "db_error" }

  const code = (params.referralCode || "").trim().toUpperCase()
  if (!code) return { ok: false, reason: "invalid_code" }

  // 1) Resolver el referrer a partir del codigo.
  const { data: referrer } = await admin
    .from("profiles")
    .select("id, email, stripe_customer_id")
    .eq("referral_code", code)
    .maybeSingle()

  if (!referrer?.id) return { ok: false, reason: "invalid_code" }

  // 2) Cargar datos del referido para antifraude.
  const { data: referred } = await admin
    .from("profiles")
    .select("id, email, stripe_customer_id")
    .eq("id", params.referredUserId)
    .maybeSingle()

  // 3) Chequeos antifraude consolidados.
  const rejection = validateReferralAntifraud(referrer, referred, params.referredUserId)
  if (rejection) {
    console.warn("[v0] referral rejected:", rejection, {
      referrer: referrer.id,
      referred: params.referredUserId,
    })
    return { ok: false, reason: rejection }
  }

  // 4) Idempotencia: ya existe registro para este referido?
  const { data: existing } = await admin
    .from("referrals")
    .select("id")
    .eq("referred_user_id", params.referredUserId)
    .maybeSingle()
  if (existing?.id) return { ok: false, reason: "already_referred" }

  // 5) Insertar la fila pending cacheando el stripe_customer_id del referido.
  const { error } = await admin.from("referrals").insert({
    referrer_user_id: referrer.id,
    referred_user_id: params.referredUserId,
    referral_code: code,
    status: "pending",
    stripe_customer_id: referred?.stripe_customer_id ?? null,
  })

  if (error) {
    console.error("[v0] applyReferral insert error:", error)
    return { ok: false, reason: "db_error" }
  }

  return { ok: true, referrerUserId: referrer.id }
}

/**
 * Alias deprecated: callers antiguos que importen `trackReferralSignup`
 * siguen funcionando. Eliminar en una version futura cuando se haya
 * migrado todo el codigo a `applyReferral`.
 */
export const trackReferralSignup = applyReferral

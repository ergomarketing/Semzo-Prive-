// supabaseAdmin del proyecto es un wrapper, no un SupabaseClient completo.
type SupabaseLike = { from: (table: string) => any }

const CONCLUSIVE_STATUSES = ["verified", "approved", "rejected"]
const VERIFIED_STATUSES = ["verified", "approved"]

/**
 * Fuente de verdad de la identidad: la verificacion CONCLUYENTE mas reciente en
 * identity_verifications (verified, approved o rejected). Las sesiones
 * pendientes o en proceso se ignoran, para que una socia ya verificada que abre
 * otra sesion sin terminarla no pierda la verificacion.
 * profiles.identity_verified es solo una copia.
 */
export async function isIdentityVerified(supabase: SupabaseLike, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("identity_verifications")
    .select("status")
    .eq("user_id", userId)
    .in("status", CONCLUSIVE_STATUSES)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  return VERIFIED_STATUSES.includes(data?.status)
}

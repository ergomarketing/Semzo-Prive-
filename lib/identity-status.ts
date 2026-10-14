// supabaseAdmin del proyecto es un wrapper, no un SupabaseClient completo.
type SupabaseLike = { from: (table: string) => any }

/**
 * Fuente de verdad de la identidad: la verificacion MAS RECIENTE en
 * identity_verifications. profiles.identity_verified es solo una copia.
 */
export async function isIdentityVerified(supabase: SupabaseLike, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("identity_verifications")
    .select("status")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  return data?.status === "verified" || data?.status === "approved"
}

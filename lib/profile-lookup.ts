/**
 * Lee nombre y email de varios perfiles de una vez.
 *
 * Por que existe: user_memberships y membership_intents apuntan a auth.users,
 * no a profiles, asi que PostgREST no puede hacer el join "profiles(...)" y la
 * consulta entera falla. Se consultan aparte y se unen aqui.
 */
export interface ProfileContact {
  id: string
  full_name: string | null
  email: string | null
}

export async function fetchProfilesById(
  supabase: { from: (table: string) => any },
  userIds: Array<string | null | undefined>,
): Promise<Record<string, ProfileContact>> {
  const ids = Array.from(new Set(userIds.filter((id): id is string => !!id)))
  if (ids.length === 0) return {}

  const { data, error } = await supabase.from("profiles").select("id, full_name, email").in("id", ids)
  if (error) {
    console.error("[profile-lookup] No se pudieron leer los perfiles:", error.message)
    return {}
  }

  const byId: Record<string, ProfileContact> = {}
  for (const p of (data || []) as ProfileContact[]) byId[p.id] = p
  return byId
}

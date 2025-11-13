import { getSupabaseBrowser } from "../lib/supabaseClient"

export function useSupabase() {
  const supabase = getSupabaseBrowser()

  if (!supabase) {
    throw new Error("Supabase client no disponible. Verifica la configuración.")
  }

  return supabase
}

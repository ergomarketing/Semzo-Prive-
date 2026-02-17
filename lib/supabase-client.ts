// Re-export desde lib/supabase para compatibilidad
export {
  getSupabaseBrowser,
  getSupabaseServiceRole,
  supabase,
  supabaseAdmin,
  supabaseConfig,
  isSupabaseConfigured,
} from "./supabase"

// Alias adicionales para compatibilidad
export { getSupabaseServiceRole as createSupabaseServiceRoleClient } from "./supabase"

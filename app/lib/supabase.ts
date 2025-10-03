import { getSupabaseBrowser, getSupabaseServiceRole } from "./supabaseClient"

export interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  membership_type?: string
  created_at?: string
  updated_at?: string
}

export const supabase = getSupabaseBrowser()

// Export admin client
export const supabaseAdmin = getSupabaseServiceRole()

// Re-export utilities
export { getSupabaseBrowser, getSupabaseServiceRole } from "./supabaseClient"
export { getSupabaseServer } from "./supabaseServer"

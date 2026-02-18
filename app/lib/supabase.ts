import {
  getSupabaseBrowser,
  getSupabaseServiceRole,
  getSupabaseServer,
} from "@/lib/supabase"

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  membership_type?: string
  created_at: string
  updated_at: string
}

// Cliente público (browser)
export const supabase = getSupabaseBrowser()

// Cliente admin (service role)
export const supabaseAdmin = getSupabaseServiceRole()

// Re-export centralizado
export {
  getSupabaseBrowser,
  getSupabaseServiceRole,
  getSupabaseServer,
}

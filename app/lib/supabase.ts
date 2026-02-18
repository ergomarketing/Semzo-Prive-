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

export const supabase = getSupabaseBrowser()
export const supabaseAdmin = getSupabaseServiceRole()

export {
  getSupabaseBrowser,
  getSupabaseServiceRole,
  getSupabaseServer,
}

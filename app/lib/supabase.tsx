import { createClient } from "@supabase/supabase-js"

// Solo usar NEXT_PUBLIC_ para el frontend
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function isSupabaseConfigured(): boolean {
  return !!(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== "https://placeholder.supabase.co" &&
    supabaseAnonKey !== "placeholder-key"
  )
}

export type User = {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  membership_status: "free" | "premium" | "vip"
  created_at: string
  updated_at: string
  last_login?: string
}

export type AuthResponse = {
  success: boolean
  message: string
  user?: User
  session?: any
}

import { createClient } from "@supabase/supabase-js"

// Read credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase environment variables are missing. Using placeholder values.",
  )
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key",
)

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

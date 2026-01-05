import { createClient } from "@supabase/supabase-js"

// VALORES REALES DE TU SUPABASE
const supabaseUrl = "https://qehractznaktxhyaqqen.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlaHJhY3R6bmFrdHhoeWFxcWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NzgyNTgsImV4cCI6MjA2MjM1NDI1OH0.9CfIxbyJ3pLzWN2hDhCKGGAGAQ-JQoJUI8lQ9Kt1_kQ"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

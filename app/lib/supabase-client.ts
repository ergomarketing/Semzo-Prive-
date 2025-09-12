import { createClient } from "@supabase/supabase-js"

// Obtener variables de entorno directamente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Solo crear cliente si las variables existen
let supabase: any = null

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.error("Error creating Supabase client:", error)
  }
}

export { supabase }

export interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  membership_status?: string
  created_at?: string
  updated_at?: string
  last_login?: string
}

export interface AuthResponse {
  success: boolean
  message: string
  user?: User
  session?: any
}

export default supabase

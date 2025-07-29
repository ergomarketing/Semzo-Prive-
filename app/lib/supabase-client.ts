import { createClient } from "@supabase/supabase-js"

// PRIMERO: Declarar las variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// SEGUNDO: Crear cliente DESPUÉS de declarar las variables
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

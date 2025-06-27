import { createClient } from "@supabase/supabase-js"

// Verificar que las variables de entorno estén configuradas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Función para verificar si Supabase está configurado
export function isSupabaseConfigured(): { ok: boolean; reason?: string } {
  if (!supabaseUrl || !supabaseAnonKey) {
    return { ok: false, reason: "Faltan variables de entorno" };
  }
  if (supabaseUrl.includes("placeholder") || supabaseAnonKey.includes("placeholder")) {
    return { ok: false, reason: "Valores placeholder detectados" };
  }
  return { ok: true };
}
// Crear cliente con valores por defecto si no están configurados
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key",
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce', 
    }
  }
);

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
  session?: {
    access_token: string
    refresh_token: string
    expires_in?: number
  } // 
  error?: {
    code: string
    message: string
  } 
}

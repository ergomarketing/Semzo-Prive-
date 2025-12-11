import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_SUPABASE_URL

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_SUPABASE_ANON_KEY

const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Supabase environment variables not found", {
    supabaseUrl: !!supabaseUrl,
    supabaseAnonKey: !!supabaseAnonKey,
  })
}

let browserClient: ReturnType<typeof createBrowserClient> | null = null
let serviceRoleClient: SupabaseClient | null = null

export function getSupabaseBrowser() {
  if (typeof window === "undefined") {
    return null
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  // Return existing instance if available
  if (browserClient) {
    return browserClient
  }

  browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return browserClient
}

export function getSupabaseServiceRole() {
  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }

  // Return existing instance if available
  if (serviceRoleClient) {
    return serviceRoleClient
  }

  serviceRoleClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
  return serviceRoleClient
}

// Cliente principal para compatibilidad con código existente
export const supabase = getSupabaseBrowser()

// Cliente admin para compatibilidad
export const supabaseAdmin = getSupabaseServiceRole()

// Configuración
export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  hasServiceKey: !!supabaseServiceKey,
}

// Verificar configuración
export function isSupabaseConfigured(): boolean {
  return !!(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== "https://placeholder.supabase.co" &&
    supabaseAnonKey !== "placeholder-key" &&
    supabaseUrl.includes("supabase.co")
  )
}

import { createClient } from "@supabase/supabase-js"

console.log("[v0] Supabase config check:", {
  hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
  url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + "...",
})

// Validar variables de entorno con mejor manejo de errores
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl) {
  console.error("[v0] NEXT_PUBLIC_SUPABASE_URL is missing from environment variables")
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is required. Please check your environment variables.")
}

if (!supabaseAnonKey) {
  console.error("[v0] NEXT_PUBLIC_SUPABASE_ANON_KEY is missing from environment variables")
  throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is required. Please check your environment variables.")
}

// Cliente principal (público)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// Cliente admin (servidor)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

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

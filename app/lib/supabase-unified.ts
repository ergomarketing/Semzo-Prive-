import { createClient } from "@supabase/supabase-js"

console.log("[v0] Supabase config check:", {
  hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
  url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + "...",
})

// Vars públicas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is required")
}
if (!supabaseAnonKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is required")
}

// Cliente público (browser / server)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

/**
 * Admin (solo disponible en server). En cliente siempre será null.
 * Esto evita exponer accidentalmente la service key en el bundle.
 */
let _supabaseAdmin: ReturnType<typeof createClient> | null = null

export function getSupabaseAdmin() {
  if (typeof window !== "undefined") {
    return null
  }
  if (_supabaseAdmin) return _supabaseAdmin

  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  if (!serviceKey) {
    console.warn("[supabase-admin] SUPABASE_SERVICE_KEY no definida")
    return null
  }

  _supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  return _supabaseAdmin
}

// Compat para código existente que usaba supabaseAdmin directamente
export const supabaseAdmin = typeof window === "undefined" ? getSupabaseAdmin() : null

export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
}

export function isSupabaseConfigured(): boolean {
  return !!(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== "https://placeholder.supabase.co" &&
    supabaseAnonKey !== "placeholder-key" &&
    supabaseUrl.includes("supabase.co")
  )
}

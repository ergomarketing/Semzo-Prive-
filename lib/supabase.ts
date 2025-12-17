import { createClient } from "@supabase/supabase-js"
import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase environment variables not found")
}

// Singleton para el cliente del navegador
let browserClient: ReturnType<typeof createBrowserClient> | null = null

// Cliente para el navegador (cliente) - singleton para evitar múltiples instancias
export function getSupabaseBrowser() {
  if (typeof window === "undefined") {
    return null
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }

  return browserClient
}

export function createSupabaseBrowserClient() {
  const client = getSupabaseBrowser()
  if (!client) {
    throw new Error("Supabase client could not be initialized. Check environment variables.")
  }
  return client
}

export function getSupabaseServiceRole() {
  // Solo ejecutar en el servidor
  if (typeof window !== "undefined") {
    console.warn("getSupabaseServiceRole should only be called on the server")
    return null
  }

  // Obtener la key solo en el servidor
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Cliente principal para compatibilidad con código existente
export const supabase = typeof window !== "undefined" ? getSupabaseBrowser() : null

export const supabaseAdmin = null

// Configuración
export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  hasServiceKey: typeof window === "undefined" ? !!process.env.SUPABASE_SERVICE_KEY : false,
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

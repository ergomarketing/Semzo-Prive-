import { createBrowserClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase environment variables not found")
}

// Cliente para el navegador (cliente)
export function createSupabaseBrowserClient() {
  if (typeof window === "undefined") {
    return null
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

export function createSupabaseServiceRoleClient() {
  // Bloquear completamente en el cliente
  if (typeof window !== "undefined") {
    console.error("createSupabaseServiceRoleClient cannot be called from the browser")
    return null
  }

  // Solo acceder a SERVICE_KEY en el servidor
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

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

let browserClientInstance: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseBrowser() {
  if (typeof window === "undefined") {
    return null
  }

  if (browserClientInstance) {
    return browserClientInstance
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  browserClientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return browserClientInstance
}

let serviceRoleClientInstance: ReturnType<typeof createClient> | null = null

export function getSupabaseServiceRole() {
  if (typeof window !== "undefined") {
    return null
  }

  if (serviceRoleClientInstance) {
    return serviceRoleClientInstance
  }

  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }

  serviceRoleClientInstance = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return serviceRoleClientInstance
}

export const supabase = typeof window !== "undefined" ? getSupabaseBrowser() : null
export const supabaseAdmin = null // Solo usar getSupabaseServiceRole() en servidor

export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
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

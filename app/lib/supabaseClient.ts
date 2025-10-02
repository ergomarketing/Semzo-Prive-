import { createClient } from "@supabase/supabase-js"
import { createBrowserClient, createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase environment variables not found")
}

// Cliente para el navegador (cliente)
export function getSupabaseBrowser() {
  // Retorna null en SSR/prerender para evitar errores
  if (typeof window === "undefined") {
    return null
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Cliente para el servidor
export function getSupabaseServer() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  const cookieStore = cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })
}

// Cliente con rol de servicio (admin)
export function getSupabaseServiceRole() {
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

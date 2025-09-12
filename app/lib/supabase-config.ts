import { env } from "./env"

// Configuración sólo para cliente (NO incluye service role key)
export const supabaseClientConfig = {
  url: env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
}

// Acceso seguro a la Service Role Key (sólo en servidor)
export function getServiceRoleKey(): string | null {
  if (typeof window !== "undefined") return null
  return env.SUPABASE_SERVICE_KEY || null
}

// Validar configuración pública (cliente)
export function validateSupabaseClientConfig() {
  const errors: string[] = []

  if (!supabaseClientConfig.url) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL no está configurada")
  }

  if (!supabaseClientConfig.anonKey) {
    errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY no está configurada")
  }

  if (supabaseClientConfig.url && !supabaseClientConfig.url.includes("supabase.co")) {
    errors.push("URL de Supabase inválida")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// Validar configuración completa (servidor)
export function validateSupabaseServerConfig() {
  const clientValidation = validateSupabaseClientConfig()
  const errors = [...clientValidation.errors]

  if (!getServiceRoleKey()) {
    errors.push("SUPABASE_SERVICE_KEY no está configurada (sólo requerida en server)")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// Configuración centralizada de Supabase
export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
}

// Validar configuración
export function validateSupabaseConfig() {
  const errors: string[] = []

  if (!supabaseConfig.url) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL no está configurada")
  }

  if (!supabaseConfig.anonKey) {
    errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY no está configurada")
  }

  if (!supabaseConfig.url.includes("supabase.co")) {
    errors.push("URL de Supabase inválida")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// Validar configuración del servidor (incluye service role)
export function validateServerConfig() {
  const clientValidation = validateSupabaseConfig()
  const errors = [...clientValidation.errors]

  if (!supabaseConfig.serviceRoleKey) {
    errors.push("SUPABASE_SERVICE_ROLE_KEY no está configurada")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

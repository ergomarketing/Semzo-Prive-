// Configuración centralizada de variables de entorno con fallbacks seguros
function getEnvVar(name: string, fallback = ""): string {
  if (typeof window !== "undefined") {
    // En el cliente, solo las variables NEXT_PUBLIC_ están disponibles
    return (window as any).__ENV__?.[name] || process.env[name] || fallback
  }
  // En el servidor, todas las variables están disponibles
  return process.env[name] || fallback
}

export const env = {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: getEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_KEY: getEnvVar("SUPABASE_SERVICE_KEY"),

  // Site
  NEXT_PUBLIC_SITE_URL: getEnvVar("NEXT_PUBLIC_SITE_URL", "https://semzoprive.com"),

  // Email
  EMAIL_API_KEY: getEnvVar("EMAIL_API_KEY"),

  // Stripe
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: getEnvVar("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),
  STRIPE_SECRET_KEY: getEnvVar("STRIPE_SECRET_KEY"),
  STRIPE_WEBHOOK_SECRET: getEnvVar("STRIPE_WEBHOOK_SECRET"),
}

// Validaciones
export function validateClientEnv() {
  const errors: string[] = []

  if (!env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL is missing")
  }

  if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validateServerEnv() {
  const clientValidation = validateClientEnv()
  const errors = [...clientValidation.errors]

  if (!env.SUPABASE_SERVICE_KEY) {
    errors.push("SUPABASE_SERVICE_KEY is missing")
  }

  if (!env.EMAIL_API_KEY) {
    errors.push("EMAIL_API_KEY is missing")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// Debug function
export function debugEnv() {
  console.log("=== ENV DEBUG ===")
  console.log("NEXT_PUBLIC_SUPABASE_URL:", env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "MISSING")
  console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY:", env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "SET" : "MISSING")
  console.log("SUPABASE_SERVICE_KEY:", env.SUPABASE_SERVICE_KEY ? "SET" : "MISSING")
  console.log("EMAIL_API_KEY:", env.EMAIL_API_KEY ? "SET" : "MISSING")
  console.log("=================")
}

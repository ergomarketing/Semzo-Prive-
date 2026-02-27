function getEnvVar(name: string, fallback = ""): string {
  // Variables privadas (sin NEXT_PUBLIC_) solo disponibles en servidor
  const isPrivateVar = !name.startsWith("NEXT_PUBLIC_")

  if (typeof window !== "undefined" && isPrivateVar) {
    // En el cliente, retornar vacío para variables privadas
    return fallback
  }

  return process.env[name] || fallback
}

export const env = {
  // Supabase - públicas
  NEXT_PUBLIC_SUPABASE_URL: getEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY"),

  get SUPABASE_SERVICE_ROLE_KEY() {
    if (typeof window !== "undefined") {
      return ""
    }
    return process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  },

  // Site
  NEXT_PUBLIC_SITE_URL: getEnvVar("NEXT_PUBLIC_SITE_URL", "https://semzoprive.com"),

  get EMAIL_API_KEY() {
    if (typeof window !== "undefined") {
      return ""
    }
    return process.env.EMAIL_API_KEY || ""
  },

  // Stripe
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: getEnvVar("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),

  get STRIPE_SECRET_KEY() {
    if (typeof window !== "undefined") {
      return ""
    }
    return process.env.STRIPE_SECRET_KEY || ""
  },

  get STRIPE_WEBHOOK_SECRET() {
    if (typeof window !== "undefined") {
      return ""
    }
    return process.env.STRIPE_WEBHOOK_SECRET || ""
  },
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
  if (typeof window !== "undefined") {
    return { isValid: true, errors: [] }
  }

  const clientValidation = validateClientEnv()
  const errors = [...clientValidation.errors]

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    errors.push("SUPABASE_SERVICE_ROLE_KEY is missing")
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
  if (typeof window === "undefined") {
    console.log("SUPABASE_SERVICE_ROLE_KEY:", env.SUPABASE_SERVICE_ROLE_KEY ? "SET" : "MISSING")
    console.log("EMAIL_API_KEY:", env.EMAIL_API_KEY ? "SET" : "MISSING")
  }
  console.log("=================")
}

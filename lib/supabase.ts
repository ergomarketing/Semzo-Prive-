import { createClient } from "@supabase/supabase-js"
import { createBrowserClient } from "@supabase/ssr"

let browserClientInstance: ReturnType<typeof createBrowserClient> | null = null
let serviceRoleClientInstance: ReturnType<typeof createClient> | null = null

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_SUPABASE_URL

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_SUPABASE_ANON_KEY

function getServiceKey() {
  if (typeof window !== "undefined") {
    return null
  }
  return (
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export function getSupabaseBrowser() {
  if (typeof window === "undefined") {
    if (!supabaseUrl || !supabaseAnonKey) {
      return null
    }
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
  }

  if (browserClientInstance) {
    return browserClientInstance
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  browserClientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  })

  return browserClientInstance
}

export function createSupabaseBrowserClient() {
  const client = getSupabaseBrowser()
  if (!client) {
    throw new Error("Supabase client could not be initialized. Check environment variables.")
  }
  return client
}

export function getSupabaseServiceRole() {
  if (typeof window !== "undefined") {
    return null
  }

  if (serviceRoleClientInstance) {
    return serviceRoleClientInstance
  }

  const supabaseServiceKey = getServiceKey()

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

function createBrowserSingleton() {
  if (typeof window === "undefined") {
    // On server, return a proxy that will work when called
    return new Proxy({} as ReturnType<typeof createBrowserClient>, {
      get(_, prop) {
        const client = getSupabaseBrowser()
        if (!client) {
          throw new Error("Supabase client not initialized")
        }
        const value = (client as any)[prop]
        if (typeof value === "function") {
          return value.bind(client)
        }
        return value
      },
    })
  }

  // On browser, create immediately
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables not configured")
  }

  if (!browserClientInstance) {
    browserClientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  }

  return browserClientInstance
}

export const supabase = createBrowserSingleton()

export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient>, {
  get(_, prop) {
    const client = getSupabaseServiceRole()
    if (!client) {
      throw new Error("Supabase admin client not available (server-side only)")
    }
    const value = (client as any)[prop]
    if (typeof value === "function") {
      return value.bind(client)
    }
    return value
  },
})

export function getSupabaseConfig() {
  return { url: supabaseUrl, anonKey: supabaseAnonKey }
}

export const supabaseConfig = getSupabaseConfig()

export function isSupabaseConfigured(): boolean {
  return !!(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== "https://placeholder.supabase.co" &&
    supabaseAnonKey !== "placeholder-key" &&
    supabaseUrl.includes("supabase.co")
  )
}

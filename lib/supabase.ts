import { createClient } from "@supabase/supabase-js"
import { createBrowserClient } from "@supabase/ssr"

// Variables de entorno
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_SUPABASE_URL ||
  ""

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_SUPABASE_ANON_KEY ||
  ""

// Singleton a nivel de módulo
let browserClientInstance: ReturnType<typeof createBrowserClient> | null = null
let serviceClientInstance: ReturnType<typeof createClient> | null = null

// Obtener service key solo en servidor
function getServiceKey(): string | null {
  if (typeof window !== "undefined") return null
  return (
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    null
  )
}

// Cliente browser - singleton
export function getSupabaseBrowser() {
  if (!supabaseUrl || !supabaseAnonKey) return null

  if (typeof window === "undefined") {
    // En servidor, crear cliente sin persistencia
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
  }

  // En browser, usar singleton
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

// Cliente service role - solo servidor
export function getSupabaseServiceRole() {
  if (typeof window !== "undefined") return null

  const serviceKey = getServiceKey()
  if (!supabaseUrl || !serviceKey) return null

  if (!serviceClientInstance) {
    serviceClientInstance = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return serviceClientInstance
}

// Alias para compatibilidad
export const createSupabaseBrowserClient = getSupabaseBrowser

// Objeto supabase con getters lazy
export const supabase = {
  from(table: string) {
    const client = getSupabaseBrowser()
    if (!client) throw new Error("Supabase not initialized")
    return client.from(table)
  },
  auth: {
    onAuthStateChange(callback: Parameters<ReturnType<typeof createBrowserClient>["auth"]["onAuthStateChange"]>[0]) {
      const client = getSupabaseBrowser()
      if (!client) throw new Error("Supabase not initialized")
      return client.auth.onAuthStateChange(callback)
    },
    getSession() {
      const client = getSupabaseBrowser()
      if (!client) throw new Error("Supabase not initialized")
      return client.auth.getSession()
    },
    getUser() {
      const client = getSupabaseBrowser()
      if (!client) throw new Error("Supabase not initialized")
      return client.auth.getUser()
    },
    signInWithPassword(credentials: { email: string; password: string }) {
      const client = getSupabaseBrowser()
      if (!client) throw new Error("Supabase not initialized")
      return client.auth.signInWithPassword(credentials)
    },
    signUp(credentials: { email: string; password: string; options?: any }) {
      const client = getSupabaseBrowser()
      if (!client) throw new Error("Supabase not initialized")
      return client.auth.signUp(credentials)
    },
    signOut() {
      const client = getSupabaseBrowser()
      if (!client) throw new Error("Supabase not initialized")
      return client.auth.signOut()
    },
    resetPasswordForEmail(email: string, options?: any) {
      const client = getSupabaseBrowser()
      if (!client) throw new Error("Supabase not initialized")
      return client.auth.resetPasswordForEmail(email, options)
    },
    updateUser(attributes: any) {
      const client = getSupabaseBrowser()
      if (!client) throw new Error("Supabase not initialized")
      return client.auth.updateUser(attributes)
    },
  },
  storage: {
    from(bucket: string) {
      const client = getSupabaseBrowser()
      if (!client) throw new Error("Supabase not initialized")
      return client.storage.from(bucket)
    },
  },
  rpc(fn: string, params?: any) {
    const client = getSupabaseBrowser()
    if (!client) throw new Error("Supabase not initialized")
    return client.rpc(fn, params)
  },
}

// Objeto supabaseAdmin para servidor
export const supabaseAdmin = {
  from(table: string) {
    const client = getSupabaseServiceRole()
    if (!client) throw new Error("Supabase admin not available (server-side only)")
    return client.from(table)
  },
  auth: {
    admin: {
      deleteUser(userId: string) {
        const client = getSupabaseServiceRole()
        if (!client) throw new Error("Supabase admin not available")
        return client.auth.admin.deleteUser(userId)
      },
      listUsers(params?: any) {
        const client = getSupabaseServiceRole()
        if (!client) throw new Error("Supabase admin not available")
        return client.auth.admin.listUsers(params)
      },
      createUser(attributes: any) {
        const client = getSupabaseServiceRole()
        if (!client) throw new Error("Supabase admin not available")
        return client.auth.admin.createUser(attributes)
      },
      updateUserById(userId: string, attributes: any) {
        const client = getSupabaseServiceRole()
        if (!client) throw new Error("Supabase admin not available")
        return client.auth.admin.updateUserById(userId, attributes)
      },
    },
  },
  storage: {
    from(bucket: string) {
      const client = getSupabaseServiceRole()
      if (!client) throw new Error("Supabase admin not available")
      return client.storage.from(bucket)
    },
  },
  rpc(fn: string, params?: any) {
    const client = getSupabaseServiceRole()
    if (!client) throw new Error("Supabase admin not available")
    return client.rpc(fn, params)
  },
}

export const supabaseConfig = { url: supabaseUrl, anonKey: supabaseAnonKey }

export function getSupabaseConfig() {
  return supabaseConfig
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

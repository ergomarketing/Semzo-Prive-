import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { createBrowserClient, createServerClient } from "@supabase/ssr"
import type { cookies } from "next/headers"

/* =========================================================
   ENV CONFIG (limpio y sin duplicaciones innecesarias)
========================================================= */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  ""

/* =========================================================
   SINGLETONS
========================================================= */

const BROWSER_CLIENT = Symbol.for("supabase.browser")
const SERVICE_CLIENT = Symbol.for("supabase.service")

type GlobalWithSupabase = typeof globalThis & {
  [BROWSER_CLIENT]?: SupabaseClient
  [SERVICE_CLIENT]?: SupabaseClient
}

const globalRef = globalThis as GlobalWithSupabase

/* =========================================================
   SAFE FETCH (mantiene compatibilidad con tu sistema actual)
========================================================= */

const safeFetch: typeof fetch = async (input, init) => {
  try {
    return await fetch(input, init)
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return new Response(JSON.stringify({ data: null, error: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }
    throw err
  }
}

/* =========================================================
   CLIENTE BROWSER
========================================================= */

export function getSupabaseBrowser(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null

  if (typeof window !== "undefined") {
    if (!globalRef[BROWSER_CLIENT]) {
      globalRef[BROWSER_CLIENT] = createBrowserClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          global: { fetch: safeFetch },
        }
      )
    }
    return globalRef[BROWSER_CLIENT]
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    global: { fetch: safeFetch },
  })
}

/* =========================================================
   CLIENTE SERVICE ROLE (SERVER ONLY)
========================================================= */

export function getSupabaseServiceRole(): SupabaseClient | null {
  if (typeof window !== "undefined") return null
  if (!supabaseUrl || !supabaseServiceKey) return null

  if (!globalRef[SERVICE_CLIENT]) {
    globalRef[SERVICE_CLIENT] = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: { fetch: safeFetch },
      }
    )
  }

  return globalRef[SERVICE_CLIENT]
}

/* =========================================================
   WRAPPER CLIENTE (NO ROMPE TU CÓDIGO ACTUAL)
========================================================= */

export const supabase = {
  from(table: string) {
    const client = getSupabaseBrowser()
    if (!client) throw new Error("Supabase not initialized")
    return client.from(table)
  },
  auth: {
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

/* =========================================================
   WRAPPER ADMIN (SERVER)
========================================================= */

export const supabaseAdmin = {
  from(table: string) {
    const client = getSupabaseServiceRole()
    if (!client)
      throw new Error("Supabase admin not available (server only)")
    return client.from(table)
  },
  storage: {
    from(bucket: string) {
      const client = getSupabaseServiceRole()
      if (!client)
        throw new Error("Supabase admin not available (server only)")
      return client.storage.from(bucket)
    },
  },
  rpc(fn: string, params?: any) {
    const client = getSupabaseServiceRole()
    if (!client)
      throw new Error("Supabase admin not available (server only)")
    return client.rpc(fn, params)
  },
}

/* =========================================================
   SSR ROUTE HANDLER
========================================================= */

export async function createRouteHandlerClient({
  cookies: cookiesFn,
}: {
  cookies: typeof cookies
}) {
  const cookieStore = await cookiesFn()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch {}
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: "", ...options })
        } catch {}
      },
    },
    global: { fetch: safeFetch },
  })
}

/* =========================================================
   HELPERS
========================================================= */

export function isSupabaseConfigured(): boolean {
  return !!(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.includes("supabase.co")
  )
}
// ===============================
// COMPATIBILITY EXPORTS (LEGACY)
// ===============================

// Alias antiguo usado en componentes
export const createClient = getSupabaseBrowser

// Alias antiguo usado en dashboards/admin
export const createSupabaseBrowserClient = getSupabaseBrowser

// Alias antiguo usado en APIs
export const getSupabaseServer = getSupabaseServiceRole

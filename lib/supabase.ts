import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { createBrowserClient, createServerClient } from "@supabase/ssr"
import type { cookies } from "next/headers"

/* ======================================================
   ENVIRONMENT VARIABLES (Single Source of Truth)
====================================================== */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

/* ======================================================
   GLOBAL SINGLETON HANDLING
====================================================== */

const BROWSER_CLIENT_KEY = Symbol.for("supabase.browser.client")
const SERVICE_CLIENT_KEY = Symbol.for("supabase.service.client")

type GlobalWithSupabase = typeof globalThis & {
  [BROWSER_CLIENT_KEY]?: SupabaseClient
  [SERVICE_CLIENT_KEY]?: SupabaseClient
}

const globalRef = globalThis as GlobalWithSupabase

/* ======================================================
   SAFE FETCH WRAPPER
====================================================== */

const fetchWithAbortHandler = async (url: RequestInfo | URL, options?: RequestInit) => {
  try {
    return await fetch(url, options)
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

/* ======================================================
   BROWSER CLIENT
====================================================== */

export function getSupabaseBrowser(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null

  if (typeof window !== "undefined") {
    if (!globalRef[BROWSER_CLIENT_KEY]) {
      globalRef[BROWSER_CLIENT_KEY] = createBrowserClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
        global: {
          fetch: fetchWithAbortHandler,
        },
      })
    }
    return globalRef[BROWSER_CLIENT_KEY]
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

/* ======================================================
   SERVICE ROLE CLIENT (SERVER ONLY)
====================================================== */

export function getSupabaseServiceRole(): SupabaseClient | null {
  if (typeof window !== "undefined") return null
  if (!supabaseUrl || !supabaseServiceRoleKey) return null

  if (!globalRef[SERVICE_CLIENT_KEY]) {
    globalRef[SERVICE_CLIENT_KEY] = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        fetch: fetchWithAbortHandler,
      },
    })
  }

  return globalRef[SERVICE_CLIENT_KEY]
}

/* ======================================================
   BROWSER WRAPPER OBJECT
====================================================== */

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
  },
  storage: {
    from(bucket: string) {
      const client = getSupabaseBrowser()
      if (!client) throw new Error("Supabase not initialized")
      return client.storage.from(bucket)
    },
  },
}

/* ======================================================
   ADMIN WRAPPER (SERVER ONLY)
====================================================== */

export const supabaseAdmin = {
  from(table: string) {
    const client = getSupabaseServiceRole()
    if (!client) throw new Error("Supabase admin unavailable")
    return client.from(table)
  },
}

/* ======================================================
   ROUTE HANDLER CLIENT (SSR)
====================================================== */

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
  })
}

/* ======================================================
   CONFIG HELPERS
====================================================== */

export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey)
}

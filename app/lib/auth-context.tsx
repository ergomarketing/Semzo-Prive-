"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { supabase } from "@/app/lib/supabase-auth"

export interface AuthUser {
  id: string
  email: string | null
  [k: string]: any
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  initialized: boolean
  error: string | null
  refresh: () => Promise<void>
  signInWithOtp: (email: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  const loadSession = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        setError(error.message)
        setUser(null)
      } else {
        setError(null)
        setUser(data.session?.user || null)
      }
    } catch (e: any) {
      setError(e.message || "Error de sesión")
      setUser(null)
    } finally {
      if (mountedRef.current) {
        setLoading(false)
        setInitialized(true)
      }
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    loadSession()
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      setLoading(false)
      setInitialized(true)
    })
    return () => {
      mountedRef.current = false
      subscription.subscription.unsubscribe()
    }
  }, [loadSession])

  const signInWithOtp = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({ email })
      if (error) return { error: error.message }
      return { error: null }
    } catch (e: any) {
      return { error: e.message || "Error desconocido" }
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
    } catch {
      /* noop */
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      initialized,
      error,
      refresh: loadSession,
      signInWithOtp,
      signOut,
    }),
    [user, loading, initialized, error, loadSession, signInWithOtp, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuthContext debe usarse dentro de AuthProvider")
  return ctx
}

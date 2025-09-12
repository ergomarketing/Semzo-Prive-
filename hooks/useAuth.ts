"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { supabase } from "@/app/lib/supabase-unified"

interface UseAuthResult {
  user: User | null
  session: Session | null
  loading: boolean
  isAuthenticated: boolean
  signInWithPassword: (email: string, password: string) => Promise<{ error?: string }>
  signUpWithPassword: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ error?: string }>
  signOut: () => Promise<{ error?: string }>
  refreshSession: () => Promise<void>
  resetPasswordEmail: (email: string) => Promise<{ error?: string }>
  updateUserMetadata: (metadata: Record<string, any>) => Promise<{ error?: string }>
  signInWithOtp: (email: string) => Promise<{ error?: string }>
  signInWithProvider: (provider: "google" | "github" | string, redirectTo?: string) => Promise<{ error?: string }>
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const initialized = useRef(false)

  // Inicializa la sesión al montar
  useEffect(() => {
    let active = true

    const init = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()
        if (!active) return
        if (error) {
          console.warn("[useAuth] getSession error:", error.message)
        }
        setSession(session ?? null)
        setUser(session?.user ?? null)
      } finally {
        if (active) {
          setLoading(false)
          initialized.current = true
        }
      }
    }

    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      if (!initialized.current) {
        setLoading(false)
        initialized.current = true
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      console.error("[useAuth] signInWithPassword error:", error)
      return { error: error.message }
    }
    setSession(data.session)
    setUser(data.user)
    return {}
  }, [])

  const signUpWithPassword = useCallback(
    async (email: string, password: string, metadata: Record<string, any> = {}) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata },
      })
      if (error) {
        console.error("[useAuth] signUpWithPassword error:", error)
        return { error: error.message }
      }
      // Puede requerir confirmación de email, por lo que session podría venir null
      setSession(data.session)
      setUser(data.user)
      return {}
    },
    [],
  )

  const signInWithOtp = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      console.error("[useAuth] signInWithOtp error:", error)
      return { error: error.message }
    }
    return {}
  }, [])

  const signInWithProvider = useCallback(
    async (provider: "google" | "github" | string, redirectTo?: string) => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        console.error("[useAuth] signInWithProvider error:", error)
        return { error: error.message }
      }
      return {}
    },
    [],
  )

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("[useAuth] signOut error:", error)
      return { error: error.message }
    }
    setSession(null)
    setUser(null)
    return {}
  }, [])

  const refreshSession = useCallback(async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()
    if (error) console.error("[useAuth] refreshSession error:", error)
    setSession(session ?? null)
    setUser(session?.user ?? null)
  }, [])

  const resetPasswordEmail = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      console.error("[useAuth] resetPasswordEmail error:", error)
      return { error: error.message }
    }
    return {}
  }, [])

  const updateUserMetadata = useCallback(
    async (metadata: Record<string, any>) => {
      if (!user) return { error: "No user session" }
      const { data, error } = await supabase.auth.updateUser({
        data: {
          ...(user.user_metadata || {}),
          ...metadata,
        },
      })
      if (error) {
        console.error("[useAuth] updateUserMetadata error:", error)
        return { error: error.message }
      }
      if (data.user) {
        setUser(data.user)
        // session contiene el user; lo actualizamos localmente
        setSession((prev) => (prev ? { ...prev, user: data.user } : prev))
      }
      return {}
    },
    [user],
  )

  return {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    signInWithPassword,
    signUpWithPassword,
    signOut,
    refreshSession,
    resetPasswordEmail,
    updateUserMetadata,
    signInWithOtp,
    signInWithProvider,
  }
}

export default useAuth

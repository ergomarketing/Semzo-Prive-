"use client"

import React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

interface Profile {
  id: string
  full_name: string | null
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  avatar_url: string | null
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Verifica el perfil via endpoint server (admin) — asi no depende de RLS del
  // cliente del browser. Devuelve { exists, profile }.
  // - exists === false SOLO si el usuario fue eliminado de auth.users (token huerfano)
  // - Si hay error de red o timeout → asumimos que existe para no cerrar sesion valida
  const fetchProfile = async (
    userId: string,
  ): Promise<{ exists: boolean; profile: Profile | null }> => {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 4000)
      const res = await fetch(`/api/auth/verify-user?userId=${encodeURIComponent(userId)}`, {
        signal: controller.signal,
        cache: "no-store",
      })
      clearTimeout(timeout)

      if (!res.ok) {
        // Error de red: no cerrar sesion, asumir que existe
        setProfile(null)
        return { exists: true, profile: null }
      }

      const data = await res.json().catch(() => null)
      if (!data) {
        setProfile(null)
        return { exists: true, profile: null }
      }

      if (data.exists === false) {
        // Usuario eliminado de auth.users — token huerfano real
        setProfile(null)
        return { exists: false, profile: null }
      }

      setProfile(data.profile || null)
      return { exists: true, profile: data.profile || null }
    } catch {
      // Red/abort/fetch fallido: mantener sesion, solo sin profile
      setProfile(null)
      return { exists: true, profile: null }
    }
  }

  useEffect(() => {
    let isMounted = true

    // Safety timeout: en webviews (Instagram, FB) getSession puede colgar indefinidamente
    // si las cookies están bloqueadas. Forzar loading=false tras 5s para que la UI reaccione.
    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn("[Auth] Safety timeout: forzando loading=false tras 5s")
        setLoading(false)
      }
    }, 5000)

    const loadSession = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        if (!isMounted) return

        const sessionUser = data.session?.user ?? null
        if (sessionUser) {
          // Fijamos user inmediatamente para desbloquear la UI; la verificacion
          // del perfil corre en paralelo y solo cerrara sesion si el usuario fue
          // realmente eliminado de auth.users.
          setUser(sessionUser)
          const { exists } = await fetchProfile(sessionUser.id)
          if (!exists && isMounted) {
            await supabase.auth.signOut()
            setUser(null)
          }
        } else {
          setUser(null)
        }
        clearTimeout(safetyTimeout)
        setLoading(false)
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          console.error("[Auth] Error getting session:", e)
        }
        if (isMounted) {
          setUser(null)
          clearTimeout(safetyTimeout)
          setLoading(false)
        }
      }
    }

    loadSession()

    const {
      data: { subscription },
    } =     supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return
      const sessionUser = session?.user ?? null
      if (sessionUser) {
        setUser(sessionUser)
        const { exists } = await fetchProfile(sessionUser.id)
        if (!exists && isMounted) {
          await supabase.auth.signOut()
          setUser(null)
        }
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      isMounted = false
      clearTimeout(safetyTimeout)
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return <AuthContext.Provider value={{ user, profile, loading, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

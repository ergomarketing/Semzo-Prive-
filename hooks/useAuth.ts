"use client"

import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/app/lib/supabase-unified"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user && session?.expires_at && new Date(session.expires_at * 1000) > new Date()) {
          setUser(session.user)
        } else {
          // Clear any invalid/expired sessions
          if (session) {
            await supabase.auth.signOut()
          }
          setUser(null)
        }
      } catch (error) {
        console.error("Error getting initial session:", error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email)

      if (event === "SIGNED_OUT") {
        setUser(null)
      } else if (session?.user && session?.expires_at && new Date(session.expires_at * 1000) > new Date()) {
        setUser(session.user)
      } else {
        setUser(null)
      }

      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    try {
      await supabase.auth.signOut({ scope: "global" })

      // Limpiar manualmente el localStorage de Supabase
      const keys = Object.keys(localStorage)
      keys.forEach((key) => {
        if (key.startsWith("sb-") || key.includes("supabase")) {
          localStorage.removeItem(key)
        }
      })

      // Limpiar sessionStorage también
      const sessionKeys = Object.keys(sessionStorage)
      sessionKeys.forEach((key) => {
        if (key.startsWith("sb-") || key.includes("supabase")) {
          sessionStorage.removeItem(key)
        }
      })

      setUser(null)

      // Forzar recarga de la página para limpiar cualquier estado residual
      window.location.href = "/"
    } catch (error) {
      console.error("Error signing out:", error)
      // Force clear user state even if signOut fails
      setUser(null)
      // Limpiar localStorage incluso si hay error
      const keys = Object.keys(localStorage)
      keys.forEach((key) => {
        if (key.startsWith("sb-") || key.includes("supabase")) {
          localStorage.removeItem(key)
        }
      })
      window.location.href = "/"
    }
  }

  return {
    user,
    loading,
    signOut,
    isAuthenticated: !!user,
  }
}

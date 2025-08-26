"use client"

import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/app/lib/supabase-unified"

const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const clearAuthStorage = () => {
    try {
      // Clear localStorage
      const keys = Object.keys(localStorage)
      keys.forEach((key) => {
        if (
          key.startsWith("sb-") ||
          key.includes("supabase") ||
          key.startsWith("supabase.") ||
          key.includes("auth-token") ||
          key.includes("access_token") ||
          key.includes("refresh_token")
        ) {
          localStorage.removeItem(key)
        }
      })

      // Clear sessionStorage
      const sessionKeys = Object.keys(sessionStorage)
      sessionKeys.forEach((key) => {
        if (
          key.startsWith("sb-") ||
          key.includes("supabase") ||
          key.startsWith("supabase.") ||
          key.includes("auth-token") ||
          key.includes("access_token") ||
          key.includes("refresh_token")
        ) {
          sessionStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.error("Error clearing auth storage:", error)
    }
  }

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

        if (error.message?.includes("Invalid Refresh Token") || error.message?.includes("Refresh Token Not Found")) {
          console.log("Clearing invalid refresh token")
          clearAuthStorage()
        }

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

      if (event === "TOKEN_REFRESHED" && !session) {
        console.log("Token refresh failed, clearing storage")
        clearAuthStorage()
        setUser(null)
        setLoading(false)
        return
      }

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

      clearAuthStorage()

      // Limpiar cookies relacionadas con Supabase si es posible
      document.cookie.split(";").forEach((cookie) => {
        const eqPos = cookie.indexOf("=")
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
        if (name.startsWith("sb-") || name.includes("supabase") || name.includes("auth-token")) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
        }
      })

      setUser(null)

      // Pequeño delay para asegurar que las operaciones de limpieza se completen
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Usar replace en lugar de href para evitar historial
      window.location.replace("/")
    } catch (error) {
      console.error("Error signing out:", error)
      // Force clear user state even if signOut fails
      setUser(null)

      try {
        clearAuthStorage()
      } catch (cleanupError) {
        console.error("Error during cleanup:", cleanupError)
      }

      // Forzar recarga incluso si hay errores
      setTimeout(() => {
        window.location.replace("/")
      }, 100)
    }
  }

  return {
    user,
    loading,
    signOut,
    isAuthenticated: !!user,
  }
}

export default useAuth
export { useAuth }

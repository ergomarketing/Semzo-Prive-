"use client"

import { useEffect, useState, useRef } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/app/lib/supabase-unified"

let globalAuthState: { user: User | null; loading: boolean } = { user: null, loading: true }
let globalAuthListeners: Array<(state: typeof globalAuthState) => void> = []

const useAuth = () => {
  const [user, setUser] = useState<User | null>(globalAuthState.user)
  const [loading, setLoading] = useState(globalAuthState.loading)
  const isSigningOut = useRef(false)
  const hasInitialized = useRef(false)

  const updateGlobalState = (newUser: User | null, newLoading: boolean) => {
    globalAuthState = { user: newUser, loading: newLoading }
    globalAuthListeners.forEach((listener) => listener(globalAuthState))
  }

  useEffect(() => {
    const listener = (state: typeof globalAuthState) => {
      setUser(state.user)
      setLoading(state.loading)
    }

    globalAuthListeners.push(listener)

    return () => {
      globalAuthListeners = globalAuthListeners.filter((l) => l !== listener)
    }
  }, [])

  const clearAuthStorage = () => {
    try {
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

      document.cookie.split(";").forEach((cookie) => {
        const eqPos = cookie.indexOf("=")
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
        if (name.startsWith("sb-") || name.includes("supabase") || name.includes("auth-token")) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`
        }
      })
    } catch (error) {
      console.error("Error clearing auth storage:", error)
    }
  }

  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email)

      if (isSigningOut.current && event !== "SIGNED_OUT") {
        return
      }

      if (event === "TOKEN_REFRESHED" && !session) {
        console.log("Token refresh failed, clearing storage")
        clearAuthStorage()
        updateGlobalState(null, false)
        return
      }

      if (event === "SIGNED_OUT") {
        updateGlobalState(null, false)
        isSigningOut.current = false
      } else if (session?.user && session?.expires_at && new Date(session.expires_at * 1000) > new Date()) {
        updateGlobalState(session.user, false)
      } else {
        updateGlobalState(null, false)
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && session?.expires_at && new Date(session.expires_at * 1000) > new Date()) {
        updateGlobalState(session.user, false)
      } else {
        updateGlobalState(null, false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    try {
      console.log("[v0] Navbar - Logout clicked")
      isSigningOut.current = true
      updateGlobalState(null, true)

      await supabase.auth.signOut({ scope: "global" })

      await new Promise((resolve) => setTimeout(resolve, 200))

      clearAuthStorage()

      console.log("[v0] Navbar - After signOut, redirecting to /")

      await new Promise((resolve) => setTimeout(resolve, 300))

      window.location.href = "/"
    } catch (error) {
      console.error("Error signing out:", error)
      updateGlobalState(null, false)
      isSigningOut.current = false

      try {
        clearAuthStorage()
      } catch (cleanupError) {
        console.error("Error during cleanup:", cleanupError)
      }

      setTimeout(() => {
        window.location.href = "/"
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

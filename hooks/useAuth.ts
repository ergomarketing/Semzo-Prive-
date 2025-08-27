"use client"

import { useEffect, useState, useRef } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/app/lib/supabase-unified"

const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const isSigningOut = useRef(false)
  const hasInitialized = useRef(false)

  const clearAuthStorage = () => {
    try {
      if (typeof window === "undefined") return

      // Clear localStorage
      const localKeys = Object.keys(localStorage)
      localKeys.forEach((key) => {
        if (key.startsWith("sb-") || key.includes("supabase")) {
          try {
            localStorage.removeItem(key)
          } catch (e) {
            // Ignore individual key errors
          }
        }
      })

      // Clear sessionStorage
      const sessionKeys = Object.keys(sessionStorage)
      sessionKeys.forEach((key) => {
        if (key.startsWith("sb-") || key.includes("supabase")) {
          try {
            sessionStorage.removeItem(key)
          } catch (e) {
            // Ignore individual key errors
          }
        }
      })
    } catch (error) {
      console.error("[v0] Error clearing auth storage:", error)
    }
  }

  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    let mounted = true

    const initAuth = async () => {
      try {
        // Get initial session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (!mounted) return

        if (error) {
          console.error("[v0] Error getting session:", error)
          setUser(null)
          setLoading(false)
          return
        }

        if (session?.user && session?.expires_at && new Date(session.expires_at * 1000) > new Date()) {
          setUser(session.user)
        } else {
          setUser(null)
        }
        setLoading(false)
      } catch (error) {
        console.error("[v0] Error initializing auth:", error)
        if (mounted) {
          setUser(null)
          setLoading(false)
        }
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      try {
        console.log("[v0] Auth state changed:", event, session?.user?.email)

        if (isSigningOut.current && event !== "SIGNED_OUT") {
          return
        }

        if (event === "SIGNED_OUT") {
          setUser(null)
          setLoading(false)
          isSigningOut.current = false
        } else if (session?.user && session?.expires_at && new Date(session.expires_at * 1000) > new Date()) {
          setUser(session.user)
          setLoading(false)
        } else {
          setUser(null)
          setLoading(false)
        }
      } catch (error) {
        console.error("[v0] Error in auth state change:", error)
        if (mounted) {
          setUser(null)
          setLoading(false)
        }
      }
    })

    initAuth()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    try {
      console.log("[v0] Logout clicked")
      isSigningOut.current = true
      setLoading(true)

      await supabase.auth.signOut({ scope: "global" })

      clearAuthStorage()

      setUser(null)
      setLoading(false)

      console.log("[v0] After signOut, redirecting to /")
      window.location.href = "/"
    } catch (error) {
      console.error("[v0] Error signing out:", error)
      isSigningOut.current = false
      setLoading(false)

      // Force redirect even if signOut fails
      clearAuthStorage()
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

export default useAuth
export { useAuth }

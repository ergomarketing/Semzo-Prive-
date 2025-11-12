"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef } from "react"
import { getSupabaseBrowser } from "../lib/supabaseClient"

export interface AuthUser {
  id: string
  email: string
  phone?: string
  metadata?: any
  emailVerified: boolean
  lastSignIn?: string
}

export interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  refreshSession: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const supabaseRef = useRef(getSupabaseBrowser())
  const initRef = useRef(false)

  useEffect(() => {
    console.log("[v0] 🔐 AuthProvider - Starting initialization")
    console.log("[v0] 🌐 Window defined:", typeof window !== "undefined")
    console.log("[v0] ✅ Supabase client exists:", !!supabaseRef.current)

    if (initRef.current) {
      console.log("[v0] ⏭️ Already initialized, skipping")
      return
    }

    if (typeof window === "undefined") {
      console.log("[v0] 🖥️ SSR detected, setting loading to false")
      setLoading(false)
      return
    }

    if (!supabaseRef.current) {
      console.error("[v0] ❌ Supabase client is null, check environment variables")
      setLoading(false)
      return
    }

    initRef.current = true
    const supabase = supabaseRef.current

    const getInitialSession = async () => {
      try {
        console.log("[v0] 🔍 Getting initial session")
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("[v0] ❌ Error getting session:", error.message)
          if (
            error.message.includes("refresh_token_not_found") ||
            error.message.includes("Invalid Refresh Token") ||
            error.message.includes("session_not_found")
          ) {
            console.log("[v0] 🔄 Clearing invalid session")
            await supabase.auth.signOut()
          }
          setUser(null)
        } else if (session?.user) {
          console.log("[v0] ✅ Session found:", {
            email: session.user.email,
            verified: session.user.email_confirmed_at ? "✓" : "✗",
          })
          setUser({
            id: session.user.id,
            email: session.user.email || "",
            phone: session.user.phone,
            metadata: session.user.user_metadata,
            emailVerified: !!session.user.email_confirmed_at,
            lastSignIn: session.user.last_sign_in_at,
          })
        } else {
          console.log("[v0] ℹ️ No session found")
          setUser(null)
        }
      } catch (error) {
        console.error("[v0] ❌ Error getting initial session:", error)
        setUser(null)
      } finally {
        console.log("[v0] ✓ Setting loading to false")
        setLoading(false)
      }
    }

    getInitialSession()

    console.log("[v0] 👂 Setting up auth state listener")
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[v0] 🔔 Auth state changed:", event)

      if (event === "SIGNED_OUT") {
        console.log("[v0] 👋 User signed out")
        setUser(null)
      } else if (event === "TOKEN_REFRESHED") {
        console.log("[v0] 🔄 Token refreshed successfully")
      } else if (event === "USER_UPDATED") {
        console.log("[v0] 👤 User updated")
      }

      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          phone: session.user.phone,
          metadata: session.user.user_metadata,
          emailVerified: !!session.user.email_confirmed_at,
          lastSignIn: session.user.last_sign_in_at,
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => {
      console.log("[v0] 🧹 Cleaning up subscription")
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    console.log("[v0] 🚪 Signing out user")
    if (supabaseRef.current) {
      await supabaseRef.current.auth.signOut()
      setUser(null)
    }
  }

  const refreshSession = async () => {
    console.log("[v0] 🔄 Manually refreshing session")
    if (supabaseRef.current) {
      const {
        data: { session },
        error,
      } = await supabaseRef.current.auth.refreshSession()
      if (error) {
        console.error("[v0] ❌ Error refreshing session:", error.message)
      } else if (session?.user) {
        console.log("[v0] ✅ Session refreshed successfully")
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          phone: session.user.phone,
          metadata: session.user.user_metadata,
          emailVerified: !!session.user.email_confirmed_at,
          lastSignIn: session.user.last_sign_in_at,
        })
      }
    }
  }

  return <AuthContext.Provider value={{ user, loading, signOut, refreshSession }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

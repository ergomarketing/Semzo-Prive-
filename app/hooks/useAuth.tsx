"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef } from "react"
import { getSupabaseBrowser } from "../lib/supabaseClient"

export interface AuthUser {
  id: string
  email: string
  phone?: string
  metadata?: any
}

export interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const supabaseRef = useRef(getSupabaseBrowser())
  const initRef = useRef(false)

  useEffect(() => {
    console.log("[v0] AuthProvider - Starting initialization")
    console.log("[v0] AuthProvider - Window defined:", typeof window !== "undefined")
    console.log("[v0] AuthProvider - Supabase client exists:", !!supabaseRef.current)

    // Prevent double initialization
    if (initRef.current) {
      console.log("[v0] AuthProvider - Already initialized, skipping")
      return
    }

    if (typeof window === "undefined") {
      console.log("[v0] AuthProvider - SSR detected, setting loading to false")
      setLoading(false)
      return
    }

    if (!supabaseRef.current) {
      console.error("[v0] AuthProvider - Supabase client is null, check environment variables")
      setLoading(false)
      return
    }

    initRef.current = true
    const supabase = supabaseRef.current

    const getInitialSession = async () => {
      try {
        console.log("[v0] AuthProvider - Getting initial session")
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("[v0] AuthProvider - Error getting session:", error)
          if (error.message.includes("refresh_token_not_found") || error.message.includes("Invalid Refresh Token")) {
            await supabase.auth.signOut()
          }
          setUser(null)
        } else if (session?.user) {
          console.log("[v0] AuthProvider - Session found, user:", session.user.email)
          setUser({
            id: session.user.id,
            email: session.user.email || "",
            phone: session.user.phone,
            metadata: session.user.user_metadata,
          })
        } else {
          console.log("[v0] AuthProvider - No session found")
          setUser(null)
        }
      } catch (error) {
        console.error("[v0] AuthProvider - Error getting initial session:", error)
        setUser(null)
      } finally {
        console.log("[v0] AuthProvider - Setting loading to false")
        setLoading(false)
      }
    }

    getInitialSession()

    console.log("[v0] AuthProvider - Setting up auth state listener")
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[v0] AuthProvider - Auth state changed:", event)
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          phone: session.user.phone,
          metadata: session.user.user_metadata,
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => {
      console.log("[v0] AuthProvider - Cleaning up subscription")
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    if (supabaseRef.current) {
      await supabaseRef.current.auth.signOut()
    }
  }

  return <AuthContext.Provider value={{ user, loading, signOut }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

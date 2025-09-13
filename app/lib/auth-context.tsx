"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "./supabase-unified"

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

  useEffect(() => {
    console.log("[v0] AuthProvider - Initializing")

    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("[v0] Error getting session:", error)
          if (error.message.includes("refresh_token_not_found") || error.message.includes("Invalid Refresh Token")) {
            await supabase.auth.signOut()
          }
          setUser(null)
        } else if (session?.user) {
          console.log("[v0] AuthProvider - Initial session found")
          setUser({
            id: session.user.id,
            email: session.user.email || "",
            phone: session.user.phone,
            metadata: session.user.user_metadata,
          })
        } else {
          console.log("[v0] AuthProvider - No initial session")
          setUser(null)
        }
      } catch (error) {
        console.error("[v0] Error getting initial session:", error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[v0] AuthProvider - Auth state change:", event, !!session?.user)

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
      subscription.unsubscribe()
    }
  }, []) // Array de dependencias vacío para evitar re-ejecuciones

  const signOut = async () => {
    await supabase.auth.signOut()
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

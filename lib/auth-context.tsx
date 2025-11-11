"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef } from "react"
import { getSupabaseBrowser } from "@/lib/supabase"

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

  useEffect(() => {
    if (typeof window === "undefined" || !supabaseRef.current) {
      setLoading(false)
      return
    }

    const supabase = supabaseRef.current

    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
          if (error.message.includes("refresh_token_not_found") || error.message.includes("Invalid Refresh Token")) {
            await supabase.auth.signOut()
          }
          setUser(null)
        } else if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || "",
            phone: session.user.phone,
            metadata: session.user.user_metadata,
          })
        } else {
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

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
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

"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef } from "react"
import { getSupabaseBrowser } from "@/lib/supabase"
import type { AuthUser, AuthContextType } from "@/app/hooks/useAuth"

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProviderWrapper({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const supabaseRef = useRef(getSupabaseBrowser())

  const loadUserProfile = async (userId: string) => {
    try {
      const supabase = supabaseRef.current
      if (!supabase) return null

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, first_name, last_name")
        .eq("id", userId)
        .single()

      return profile
    } catch (error) {
      console.error("Error loading profile:", error)
      return null
    }
  }

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
          const profile = await loadUserProfile(session.user.id)

          setUser({
            id: session.user.id,
            email: session.user.email || "",
            phone: session.user.phone,
            metadata: session.user.user_metadata,
            profile: profile || undefined,
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
        const profile = await loadUserProfile(session.user.id)

        setUser({
          id: session.user.id,
          email: session.user.email || "",
          phone: session.user.phone,
          metadata: session.user.user_metadata,
          profile: profile || undefined,
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

export const useAuthWrapper = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuthWrapper must be used within an AuthProviderWrapper")
  }
  return context
}

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

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, first_name, last_name, email, phone, avatar_url")
        .eq("id", userId)
        .maybeSingle()
      setProfile(data ?? null)
    } catch {
      setProfile(null)
    }
  }

  useEffect(() => {
    let isMounted = true

    const loadSession = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        if (!isMounted) return

        const sessionUser = data.session?.user ?? null
        setUser(sessionUser)
        if (sessionUser) {
          // No bloqueamos la UI por fetchProfile: corre en paralelo
          fetchProfile(sessionUser.id)
        }
      } catch (e) {
        console.error("[Auth] Error getting session:", e)
        if (isMounted) setUser(null)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return
      const sessionUser = session?.user ?? null
      setUser(sessionUser)
      if (sessionUser) {
        fetchProfile(sessionUser.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      isMounted = false
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

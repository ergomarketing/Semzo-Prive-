"use client"
import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react"
import { getSupabaseBrowser } from "@/lib/supabase"
import type { User, Session } from "@supabase/supabase-js"

export interface AuthUser {
  id: string
  email: string
  phone?: string
  metadata?: Record<string, unknown>
  profile?: {
    full_name?: string
    first_name?: string
    last_name?: string
  }
}

export interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const initialized = useRef(false)
  const supabaseRef = useRef(getSupabaseBrowser())

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const supabase = supabaseRef.current
    if (!supabase) {
      setLoading(false)
      return
    }

    const getSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          // Handle invalid refresh token
          if (error.message?.includes("refresh_token") || error.message?.includes("Invalid")) {
            await supabase.auth.signOut()
          }
          setSession(null)
          setUser(null)
          setLoading(false)
          return
        }

        setSession(session)
        setUser(session?.user ?? null)
      } catch {
        setSession(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    const supabase = supabaseRef.current
    if (!supabase) return
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }

  const signIn = async (email: string, password: string) => {
    const supabase = supabaseRef.current
    if (!supabase) return { error: null }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error as Error | null }
  }

  const signUp = async (email: string, password: string) => {
    const supabase = supabaseRef.current
    if (!supabase) return { error: null }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
      },
    })
    return { error: error as Error | null }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, signIn, signUp }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

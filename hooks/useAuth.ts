"use client"

import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/app/lib/supabase-unified"

const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log("[v0] Auth - Initializing useAuth hook")

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[v0] Auth state changed:", event, session?.user?.email || "none")

      if (session?.user) {
        console.log("[v0] User authenticated:", session.user.email)
        setUser(session.user)
      } else {
        console.log("[v0] No user session")
        setUser(null)
      }

      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
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

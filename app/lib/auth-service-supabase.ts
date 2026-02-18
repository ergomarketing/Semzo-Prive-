import { getSupabaseBrowser } from "@/lib/supabase"
import type { User } from "./supabase"

export class AuthServiceSupabase {
  static async getCurrentUser(): Promise<User | null> {
    try {
      const supabase = getSupabaseBrowser()
      if (!supabase) {
        console.error("[AuthServiceSupabase] Supabase client not available")
        return null
      }

      // Get current session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("[AuthServiceSupabase] Error getting session:", sessionError)
        return null
      }

      if (!session?.user) {
        return null
      }

      // Get user profile from users table
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single()

      if (profileError) {
        console.error("[AuthServiceSupabase] Error getting profile:", profileError)
        // Return basic user info from session if profile doesn't exist
        return {
          id: session.user.id,
          email: session.user.email || "",
          first_name: session.user.user_metadata?.first_name,
          last_name: session.user.user_metadata?.last_name,
          phone: session.user.phone,
        }
      }

      return profile as User
    } catch (error) {
      console.error("[AuthServiceSupabase] Error in getCurrentUser:", error)
      return null
    }
  }

  static async logout(): Promise<void> {
    try {
      const supabase = getSupabaseBrowser()
      if (!supabase) {
        console.error("[AuthServiceSupabase] Supabase client not available")
        return
      }

      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("[AuthServiceSupabase] Error signing out:", error)
        throw error
      }
    } catch (error) {
      console.error("[AuthServiceSupabase] Error in logout:", error)
      throw error
    }
  }

  static async getSession() {
    try {
      const supabase = getSupabaseBrowser()
      if (!supabase) {
        return null
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()
      return session
    } catch (error) {
      console.error("[AuthServiceSupabase] Error getting session:", error)
      return null
    }
  }
}

export const authServiceSupabase = new AuthServiceSupabase()

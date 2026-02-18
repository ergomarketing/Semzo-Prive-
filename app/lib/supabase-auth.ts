import { getSupabaseServiceRole } from "@/lib/supabase"
import type { User } from "./supabase"

interface AuthUser {
  id: string
  email: string
  user_metadata?: any
  email_confirmed_at?: string
  created_at?: string
  updated_at?: string
  last_sign_in_at?: string
}

interface CreateProfileResult {
  success: boolean
  message: string
  user?: User
  error?: string
}

class SupabaseAuthService {
  async createProfileFromAuthUser(authUser: AuthUser): Promise<CreateProfileResult> {
    try {
      console.log("[SupabaseAuthService] Creating profile for user:", authUser.id)

      const supabase = getSupabaseServiceRole()
      if (!supabase) {
        return {
          success: false,
          message: "Supabase service role client not available",
          error: "SUPABASE_NOT_CONFIGURED",
        }
      }

      // Check if profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single()

      if (existingProfile) {
        console.log("[SupabaseAuthService] Profile already exists:", existingProfile.id)
        return {
          success: true,
          message: "Profile already exists",
          user: existingProfile as User,
        }
      }

      // Create new profile
      const newProfile = {
        id: authUser.id,
        email: authUser.email,
        first_name: authUser.user_metadata?.first_name || "",
        last_name: authUser.user_metadata?.last_name || "",
        phone: authUser.user_metadata?.phone || "",
        membership_type: "free",
        created_at: authUser.created_at || new Date().toISOString(),
        updated_at: authUser.updated_at || new Date().toISOString(),
      }

      const { data: createdProfile, error: createError } = await supabase
        .from("users")
        .insert(newProfile)
        .select()
        .single()

      if (createError) {
        console.error("[SupabaseAuthService] Error creating profile:", createError)
        return {
          success: false,
          message: "Error creating profile",
          error: createError.message,
        }
      }

      console.log("[SupabaseAuthService] Profile created successfully:", createdProfile.id)
      return {
        success: true,
        message: "Profile created successfully",
        user: createdProfile as User,
      }
    } catch (error) {
      console.error("[SupabaseAuthService] Error in createProfileFromAuthUser:", error)
      return {
        success: false,
        message: "Internal error creating profile",
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async getProfile(userId: string): Promise<User | null> {
    try {
      const supabase = getSupabaseServiceRole()
      if (!supabase) {
        return null
      }

      const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

      if (error) {
        console.error("[SupabaseAuthService] Error getting profile:", error)
        return null
      }

      return data as User
    } catch (error) {
      console.error("[SupabaseAuthService] Error in getProfile:", error)
      return null
    }
  }

  async updateProfile(userId: string, updates: Partial<User>): Promise<CreateProfileResult> {
    try {
      const supabase = getSupabaseServiceRole()
      if (!supabase) {
        return {
          success: false,
          message: "Supabase service role client not available",
        }
      }

      const { data, error } = await supabase
        .from("users")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single()

      if (error) {
        console.error("[SupabaseAuthService] Error updating profile:", error)
        return {
          success: false,
          message: "Error updating profile",
          error: error.message,
        }
      }

      return {
        success: true,
        message: "Profile updated successfully",
        user: data as User,
      }
    } catch (error) {
      console.error("[SupabaseAuthService] Error in updateProfile:", error)
      return {
        success: false,
        message: "Internal error updating profile",
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }
}

// Export singleton instance
const authService = new SupabaseAuthService()
export { authService }

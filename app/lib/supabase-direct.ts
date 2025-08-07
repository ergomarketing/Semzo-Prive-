import { createClient } from "@supabase/supabase-js"
import { env, validateServerEnv } from "./env"

// Validar variables de entorno del servidor
const validation = validateServerEnv()
if (!validation.isValid) {
  console.error("Supabase server configuration errors:", validation.errors)
  throw new Error(`Supabase server configuration missing: ${validation.errors.join(", ")}`)
}

export const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
export const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  membership_status?: string
  created_at?: string
  updated_at?: string
  last_login?: string
}

export class SupabaseService {
  static async createUser(userData: {
    email: string
    firstName: string
    lastName: string
    phone?: string
  }): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const { data, error } = await supabase
        .from("users")
        .insert({
          email: userData.email.toLowerCase(),
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone || null,
          membership_status: "free",
        })
        .select()
        .single()

      if (error) {
        return {
          success: false,
          message: error.message,
        }
      }

      return {
        success: true,
        message: "Usuario creado exitosamente",
        user: data,
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      }
    }
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const { data, error } = await supabase.from("users").select("*").eq("email", email.toLowerCase()).single()

      if (error) {
        return null
      }

      return data
    } catch (error) {
      return null
    }
  }

  static async updateLastLogin(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("users").update({ last_login: new Date().toISOString() }).eq("id", userId)

      return !error
    } catch (error) {
      return false
    }
  }
}

export async function testConnection() {
  try {
    const { data, error } = await supabase.from("users").select("count").single()
    return { success: !error, error }
  } catch (error) {
    return { success: false, error }
  }
}

export default supabaseAdmin

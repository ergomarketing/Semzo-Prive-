
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export class AuthServiceSupabase {
  static async registerUser(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            phone: userData.phone || null,
          }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error("Usuario no creado en Auth")

      const { error: profileError } = await supabase
        .from("users")
        .insert({
          id: authData.user.id,
          email: userData.email.toLowerCase(),
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone || null,
          membership_status: "free"
        })

      if (profileError) throw profileError

      return {
        success: true,
        message: "Usuario creado exitosamente.",
        user: {
          id: authData.user.id,
          email: userData.email,
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone || null,
          membership_status: "free"
        }
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error en el registro"
      }
    }
  }
}

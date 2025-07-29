import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
}

interface LoginData {
  email: string
  password: string
}

export const authService = {
  async register(data: RegisterData) {
    console.log("🔥 [AUTH SERVICE] Iniciando registro...")
    console.log("📝 [AUTH SERVICE] Datos:", {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      hasPhone: !!data.phone,
    })

    try {
      // Registrar usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone,
          },
        },
      })

      console.log("📊 [AUTH SERVICE] Resultado de signUp:", {
        success: !authError,
        userId: authData.user?.id,
        needsConfirmation: !authData.session,
        error: authError?.message,
      })

      if (authError) {
        console.error("❌ [AUTH SERVICE] Error en signUp:", authError)
        return {
          success: false,
          message: authError.message,
        }
      }

      if (!authData.user) {
        console.error("❌ [AUTH SERVICE] No se obtuvo usuario")
        return {
          success: false,
          message: "Error al crear usuario",
        }
      }

      console.log("✅ [AUTH SERVICE] Usuario registrado exitosamente")

      return {
        success: true,
        message: "Cuenta creada exitosamente. Revisa tu email para confirmar tu cuenta.",
        user: authData.user,
      }
    } catch (error: any) {
      console.error("💥 [AUTH SERVICE] Error inesperado:", error)
      return {
        success: false,
        message: "Error inesperado durante el registro",
      }
    }
  },

  async login(data: LoginData) {
    console.log("🔥 [AUTH SERVICE] Iniciando login...")
    console.log("📝 [AUTH SERVICE] Email:", data.email)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      console.log("📊 [AUTH SERVICE] Respuesta del API:", {
        status: response.status,
        success: result.success,
        message: result.message,
      })

      return result
    } catch (error: any) {
      console.error("💥 [AUTH SERVICE] Error en login:", error)
      return {
        success: false,
        message: "Error de conexión",
      }
    }
  },

  async logout() {
    console.log("🔥 [AUTH SERVICE] Cerrando sesión...")

    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error("❌ [AUTH SERVICE] Error en logout:", error)
        return { success: false, message: error.message }
      }

      console.log("✅ [AUTH SERVICE] Sesión cerrada exitosamente")
      return { success: true, message: "Sesión cerrada" }
    } catch (error: any) {
      console.error("💥 [AUTH SERVICE] Error inesperado en logout:", error)
      return { success: false, message: "Error al cerrar sesión" }
    }
  },
}

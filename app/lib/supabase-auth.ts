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
    try {
      console.log("=== CLIENTE: Enviando registro ===")
      console.log("Datos a enviar:", {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone ? "***" : null,
      })

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      console.log("Respuesta del servidor:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      })

      const result = await response.json()
      console.log("Resultado parseado:", result)

      return result
    } catch (error: any) {
      console.error("Error en authService.register:", error)
      return {
        success: false,
        message: "Error inesperado durante el registro",
      }
    }
  },

  async login(data: LoginData) {
    try {
      console.log("=== CLIENTE: Enviando login ===")
      console.log("Email:", data.email)

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      console.log("Respuesta del servidor:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      })

      const result = await response.json()
      console.log("Resultado parseado:", result)

      return result
    } catch (error: any) {
      console.error("Error en authService.login:", error)
      return {
        success: false,
        message: "Error de conexión",
      }
    }
  },

  async logout() {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        return { success: false, message: error.message }
      }

      return { success: true, message: "Sesión cerrada" }
    } catch (error: any) {
      return { success: false, message: "Error al cerrar sesión" }
    }
  },
}

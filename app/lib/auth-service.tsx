import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  membershipStatus: string
}

export interface AuthResponse {
  success: boolean
  message: string
  user?: AuthUser
  error?: string
}

export class AuthService {
  static async register(userData: {
    email: string
    password: string
    firstName: string
    lastName: string
    phone?: string
  }): Promise<AuthResponse> {
    try {
      console.log("[AuthService] Iniciando registro para:", userData.email)

      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            firstName: userData.firstName,
            lastName: userData.lastName,
            phone: userData.phone || "",
          },
        },
      })

      if (error) {
        console.error("[AuthService] Error en registro:", error)
        return {
          success: false,
          message: error.message,
          error: error.message,
        }
      }

      if (!data.user) {
        return {
          success: false,
          message: "No se pudo crear el usuario",
          error: "NO_USER_CREATED",
        }
      }

      console.log("[AuthService] Usuario registrado exitosamente:", data.user.email)

      return {
        success: true,
        message: "Usuario registrado exitosamente. Revisa tu email para confirmar tu cuenta.",
        user: {
          id: data.user.id,
          email: data.user.email!,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          membershipStatus: "free",
        },
      }
    } catch (error: any) {
      console.error("[AuthService] Error general en registro:", error)
      return {
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      }
    }
  }

  static async login(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log("[AuthService] Iniciando login para:", email)

      // Limpiar cualquier sesión anterior
      if (typeof window !== "undefined") {
        localStorage.removeItem("user")
        localStorage.removeItem("session")
        localStorage.removeItem("isLoggedIn")
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("[AuthService] Error en login:", error)
        return {
          success: false,
          message: "Credenciales inválidas o usuario no confirmado",
          error: error.message,
        }
      }

      if (!data.user || !data.session) {
        return {
          success: false,
          message: "No se pudo autenticar el usuario",
          error: "NO_USER_AUTHENTICATED",
        }
      }

      console.log("[AuthService] Login exitoso para:", data.user.email)

      // Obtener datos del perfil
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

      const userData: AuthUser = {
        id: data.user.id,
        email: data.user.email!,
        firstName: profile?.first_name || data.user.user_metadata?.firstName || "",
        lastName: profile?.last_name || data.user.user_metadata?.lastName || "",
        phone: profile?.phone || data.user.user_metadata?.phone || "",
        membershipStatus: profile?.membership_status || "free",
      }

      // Guardar en localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(userData))
        localStorage.setItem("session", JSON.stringify(data.session))
        localStorage.setItem("isLoggedIn", "true")
      }

      return {
        success: true,
        message: "Login exitoso",
        user: userData,
      }
    } catch (error: any) {
      console.error("[AuthService] Error general en login:", error)
      return {
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      }
    }
  }

  static async logout(): Promise<AuthResponse> {
    try {
      console.log("[AuthService] Cerrando sesión...")

      // Limpiar localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("user")
        localStorage.removeItem("session")
        localStorage.removeItem("isLoggedIn")
      }

      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error("[AuthService] Error cerrando sesión:", error)
        return {
          success: false,
          message: "Error cerrando sesión",
          error: error.message,
        }
      }

      console.log("[AuthService] Sesión cerrada exitosamente")

      return {
        success: true,
        message: "Sesión cerrada exitosamente",
      }
    } catch (error: any) {
      console.error("[AuthService] Error general cerrando sesión:", error)
      return {
        success: false,
        message: "Error interno",
        error: error.message,
      }
    }
  }

  static getCurrentUser(): AuthUser | null {
    if (typeof window === "undefined") return null

    try {
      const userStr = localStorage.getItem("user")
      const isLoggedIn = localStorage.getItem("isLoggedIn")

      if (!userStr || isLoggedIn !== "true") {
        return null
      }

      return JSON.parse(userStr)
    } catch (error) {
      console.error("[AuthService] Error obteniendo usuario actual:", error)
      return null
    }
  }

  static isLoggedIn(): boolean {
    if (typeof window === "undefined") return false

    const isLoggedIn = localStorage.getItem("isLoggedIn")
    const user = localStorage.getItem("user")

    return isLoggedIn === "true" && !!user
  }
}

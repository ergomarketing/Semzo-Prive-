import { createClient } from "@supabase/supabase-js"
import { ADMIN_CONFIG } from "@/app/config/email-config"

// Validar variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is required")
}

if (!supabaseAnonKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is required")
}

// Cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos
export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  website: string | null
  bio: string | null
  phone: string | null
  updated_at: string
}

export interface AuthUser {
  id: string
  email: string
  email_confirmed_at: string | null
  user_metadata: any
}

export interface AuthResponse {
  success: boolean
  message: string
  user?: AuthUser
  profile?: Profile
  error?: string
}

// Servicio de autenticación simple
export class SimpleAuthService {
  // Registrar usuario
  async register(email: string, password: string, fullName?: string): Promise<AuthResponse> {
    try {
      console.log("🔄 Registrando usuario:", email)

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || "",
          },
        },
      })

      if (error) {
        console.error("❌ Error en registro:", error)
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

      console.log("✅ Usuario registrado:", data.user.id)

      return {
        success: true,
        message: "Usuario registrado exitosamente. Revisa tu email para confirmar tu cuenta.",
        user: {
          id: data.user.id,
          email: data.user.email!,
          email_confirmed_at: data.user.email_confirmed_at,
          user_metadata: data.user.user_metadata,
        },
      }
    } catch (error) {
      console.error("❌ Error en registro:", error)
      return {
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  // Iniciar sesión
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log("🔄 Iniciando sesión:", email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("❌ Error en login:", error)
        return {
          success: false,
          message: error.message,
          error: error.message,
        }
      }

      if (!data.user) {
        return {
          success: false,
          message: "No se pudo autenticar el usuario",
          error: "NO_USER_AUTHENTICATED",
        }
      }

      console.log("✅ Login exitoso:", data.user.email)

      // Obtener perfil
      const profile = await this.getProfile(data.user.id)

      return {
        success: true,
        message: "Login exitoso",
        user: {
          id: data.user.id,
          email: data.user.email!,
          email_confirmed_at: data.user.email_confirmed_at,
          user_metadata: data.user.user_metadata,
        },
        profile: profile || undefined,
      }
    } catch (error) {
      console.error("❌ Error en login:", error)
      return {
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  // Obtener perfil
  async getProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) {
        console.error("Error obteniendo perfil:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error obteniendo perfil:", error)
      return null
    }
  }

  // Obtener sesión actual
  async getCurrentSession() {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error("Error obteniendo sesión:", error)
        return null
      }

      return session
    } catch (error) {
      console.error("Error obteniendo sesión:", error)
      return null
    }
  }

  // Obtener usuario actual
  async getCurrentUser() {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error) {
        console.error("Error obteniendo usuario:", error)
        return null
      }

      return user
    } catch (error) {
      console.error("Error obteniendo usuario:", error)
      return null
    }
  }

  // Cerrar sesión
  async logout(): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        return {
          success: false,
          message: error.message,
          error: error.message,
        }
      }

      return {
        success: true,
        message: "Sesión cerrada exitosamente",
      }
    } catch (error) {
      return {
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  // Escuchar cambios de autenticación
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }

  // Login de admin
  async adminLogin(username: string, password: string): Promise<AuthResponse> {
    try {
      console.log("🔄 Validando credenciales de admin:", username)

      // Validar contra configuración de admin
      if (username === ADMIN_CONFIG.username && password === ADMIN_CONFIG.password) {
        console.log("✅ Credenciales de admin válidas")
        return {
          success: true,
          message: "Login de admin exitoso",
          user: {
            id: "admin",
            email: "admin@semzoprive.com",
            email_confirmed_at: new Date().toISOString(),
            user_metadata: { role: "admin" },
          },
        }
      } else {
        console.log("❌ Credenciales de admin inválidas")
        return {
          success: false,
          message: "Usuario o contraseña incorrectos",
          error: "INVALID_ADMIN_CREDENTIALS",
        }
      }
    } catch (error) {
      console.error("❌ Error en login de admin:", error)
      return {
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }
}

// Instancia del servicio
export const authService = new SimpleAuthService()

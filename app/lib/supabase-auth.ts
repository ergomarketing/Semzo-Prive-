import { createClient } from "@supabase/supabase-js"

// Obtener variables de entorno de forma segura
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ''

// Validar que las variables existan
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables are missing')
}

// Cliente público
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null

// Cliente admin
export const supabaseAdmin = supabaseServiceKey && supabaseUrl
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

export interface User {
  id: string
  email: string
  full_name?: string
  first_name?: string
  last_name?: string
  phone?: string
  is_active?: boolean
  email_confirmed_at?: string
  created_at?: string
  updated_at?: string
}

export interface AuthResponse {
  success: boolean
  message: string
  user?: User
  error?: string
  details?: any
}

class AuthService {
  async register(data: {
    email: string
    password: string
    full_name?: string
    first_name?: string
    last_name?: string
    phone?: string
  }): Promise<AuthResponse> {
    try {
      console.log("🔄 Iniciando registro para:", data.email)

      if (!supabase) {
        return {
          success: false,
          message: "Supabase no está configurado correctamente",
          error: "SUPABASE_NOT_CONFIGURED"
        }
      }

      // 1. Crear usuario en auth.users
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name || `${data.first_name || ""} ${data.last_name || ""}`.trim(),
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            phone: data.phone || "",
          },
        },
      })

      if (authError) {
        console.error("❌ Error en auth.signUp:", authError)
        return {
          success: false,
          message: "Error al crear usuario: " + authError.message,
          error: authError.message,
        }
      }

      if (!authData.user) {
        return {
          success: false,
          message: "No se pudo crear el usuario",
          error: "NO_USER_CREATED",
        }
      }

      console.log("✅ Usuario creado en auth.users:", authData.user.id)

      // 2. Enviar email de bienvenida con link de confirmación
      try {
        const emailResponse = await fetch('/api/emails/send-welcome', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: data.email,
            firstName: data.first_name || data.full_name?.split(' ')[0] || 'Usuario',
            confirmationUrl: `${window.location.origin}/auth/callback?token_hash=${authData.user.id}&type=signup&next=/dashboard`
          }),
        })

        const emailResult = await emailResponse.json()
        
        if (!emailResponse.ok) {
          console.warn("⚠️ Error enviando email de bienvenida:", emailResult)
        } else {
          console.log("✅ Email de bienvenida enviado")
        }
      } catch (emailError) {
        console.warn("⚠️ Error enviando email:", emailError)
      }

      return {
        success: true,
        message: "Usuario registrado exitosamente. Revisa tu email para confirmar tu cuenta.",
        user: {
          id: authData.user.id,
          email: authData.user.email || data.email,
          full_name: data.full_name,
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          is_active: true,
        }
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

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    try {
      console.log("🔄 Iniciando login para:", data.email)

      if (!supabase) {
        return {
          success: false,
          message: "Supabase no está configurado correctamente",
          error: "SUPABASE_NOT_CONFIGURED"
        }
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (authError) {
        console.error("❌ Error en login:", authError)
        return {
          success: false,
          message: "Credenciales inválidas o usuario no confirmado",
          error: authError.message,
        }
      }

      if (!authData.user) {
        return {
          success: false,
          message: "No se pudo autenticar el usuario",
          error: "NO_USER_AUTHENTICATED",
        }
      }

      console.log("✅ Login exitoso para:", authData.user.email)

      return {
        success: true,
        message: "Login exitoso",
        user: {
          id: authData.user.id,
          email: authData.user.email || data.email,
          full_name: authData.user.user_metadata?.full_name || "",
          first_name: authData.user.user_metadata?.first_name || "",
          last_name: authData.user.user_metadata?.last_name || "",
          phone: authData.user.user_metadata?.phone || "",
          is_active: true,
          email_confirmed_at: authData.user.email_confirmed_at,
        }
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

  async getCurrentSession() {
    try {
      if (!supabase) return null
      
      const { data: { session }, error } = await supabase.auth.getSession()
      
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

  async logout(): Promise<AuthResponse> {
    try {
      if (!supabase) {
        return {
          success: false,
          message: "Supabase no está configurado",
          error: "SUPABASE_NOT_CONFIGURED"
        }
      }

      const { error } = await supabase.auth.signOut()

      if (error) {
        return {
          success: false,
          message: "Error cerrando sesión: " + error.message,
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
        message: "Error interno",
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }
}

export const authService = new AuthService()
export { AuthService }

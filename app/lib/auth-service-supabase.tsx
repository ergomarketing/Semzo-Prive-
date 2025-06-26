import { supabase, type User, type AuthResponse } from "./supabase"

export class AuthServiceSupabase {
  // Registrar usuario
  static async registerUser(userData: {
    email: string
    password: string
    firstName: string
    lastName: string
    phone?: string
  }): Promise<AuthResponse> {
    try {
      // 1. Verificar si el usuario ya existe
      const { data: existingUser } = await supabase
        .from("users")
        .select("email")
        .eq("email", userData.email.toLowerCase())
        .single()

      if (existingUser) {
        return {
          success: false,
          message: "Este email ya está registrado. Intenta iniciar sesión.",
        }
      }

      // 2. Registrar en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      })

      if (authError) {
        return {
          success: false,
          message: "Error al crear la cuenta: " + authError.message,
        }
      }

      if (!authData.user) {
        return {
          success: false,
          message: "Error al crear la cuenta",
        }
      }

      // 3. Crear perfil de usuario en nuestra tabla
      const { data: profileData, error: profileError } = await supabase
        .from("users")
      .insert([
  {
    email: formData.email,
    first_name: formData.firstname,
    last_name: formData.lastname,
    phone: formData.phone,
    membership_status: "free",
  },
])
 
        .select()
        .single()

      if (profileError) {
        console.error("Error creando perfil:", profileError)
        return {
          success: false,
          message: "Error al crear el perfil de usuario",
        }
      }

      return {
        success: true,
        message: "Usuario registrado exitosamente",
        user: profileData,
        session: authData.session,
      }
    } catch (error) {
      console.error("Error en registro:", error)
      return {
        success: false,
        message: "Error interno del servidor",
      }
    }
  }

  // Iniciar sesión
  static async loginUser(email: string, password: string): Promise<AuthResponse> {
    try {
      // 1. Autenticar con Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      })

      if (authError) {
        return {
          success: false,
          message: "Credenciales incorrectas. Verifica tu email y contraseña.",
        }
      }

      if (!authData.user) {
        return {
          success: false,
          message: "Error al iniciar sesión",
        }
      }

      // 2. Obtener perfil del usuario
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single()

      if (userError || !userData) {
        return {
          success: false,
          message: "Error al obtener datos del usuario",
        }
      }

      // 3. Actualizar último login
      await supabase
        .from("users")
        .update({
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", authData.user.id)

      return {
        success: true,
        message: "Login exitoso",
        user: userData,
        session: authData.session,
      }
    } catch (error) {
      console.error("Error en login:", error)
      return {
        success: false,
        message: "Error interno del servidor",
      }
    }
  }

  // Obtener usuario actual
  static async getCurrentUser(): Promise<User | null> {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) return null

      const { data: userData, error } = await supabase.from("users").select("*").eq("id", authUser.id).single()

      if (error || !userData) return null

      return userData
    } catch (error) {
      console.error("Error obteniendo usuario:", error)
      return null
    }
  }

  // Cerrar sesión
  static async logout(): Promise<void> {
    await supabase.auth.signOut()
  }

  // Verificar si está autenticado
  static async isAuthenticated(): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return !!user
  }
}

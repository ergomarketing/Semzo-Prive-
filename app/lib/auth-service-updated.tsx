import { supabase } from './supabase'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  membershipStatus: string
}

export class AuthService {
  // Registro usando Supabase Auth nativo
  static async register(userData: {
    email: string
    password: string
    firstName: string
    lastName: string
    phone?: string
  }) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: `${userData.firstName} ${userData.lastName}`,
            first_name: userData.firstName,
            last_name: userData.lastName,
            phone: userData.phone || ''
          }
        }
      })

      if (error) {
        return {
          success: false,
          message: error.message
        }
      }

      return {
        success: true,
        message: 'Usuario registrado exitosamente. Revisa tu email para confirmar tu cuenta.',
        user: data.user
      }
    } catch (error) {
      return {
        success: false,
        message: 'Error interno del servidor'
      }
    }
  }

  // Login usando Supabase Auth nativo
  static async login(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      })

      if (error) {
        return {
          success: false,
          message: error.message
        }
      }

      return {
        success: true,
        message: 'Login exitoso',
        user: data.user
      }
    } catch (error) {
      return {
        success: false,
        message: 'Error interno del servidor'
      }
    }
  }

  // Obtener usuario actual desde Supabase
  static getCurrentUser(): User | null {
    // Esta función ahora es obsoleta, usar useAuth hook en su lugar
    return null
  }

  // Verificar si está logueado
  static isLoggedIn(): boolean {
    // Esta función ahora es obsoleta, usar useAuth hook en su lugar
    return false
  }

  // Logout
  static async logout() {
    await supabase.auth.signOut()
  }
}

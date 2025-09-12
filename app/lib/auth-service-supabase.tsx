"use client"

import { supabase } from "./supabase"

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  membershipStatus?: string
}

export interface AuthResponse {
  success: boolean
  message: string
  user?: User
}

class AuthServiceSupabase {
  // Registrar nuevo usuario
  static async register(userData: {
    email: string
    password: string
    firstName: string
    lastName: string
    phone?: string
  }): Promise<AuthResponse> {
    try {
      // Llamar a la API de registro
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      const result = await response.json()
      return result
    } catch (error: any) {
      return {
        success: false,
        message: `Error de conexión: ${error.message}`,
      }
    }
  }

  // Iniciar sesión
  static async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()
      return result
    } catch (error: any) {
      return {
        success: false,
        message: `Error de conexión: ${error.message}`,
      }
    }
  }

  // Cerrar sesión
  static async logout(): Promise<void> {
    await supabase.auth.signOut()
  }

  // Obtener usuario actual desde Supabase
  static async getCurrentUser(): Promise<User | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return null

      // Obtener perfil completo desde la tabla profiles
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      return {
        id: user.id,
        email: user.email || "",
        firstName: profile?.first_name || "",
        lastName: profile?.last_name || "",
        phone: profile?.phone || "",
        membershipStatus: profile?.membership_status || "free",
      }
    } catch (error) {
      console.error("Error getting current user:", error)
      return null
    }
  }

  // Verificar si está autenticado
  static async isAuthenticated(): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return !!user
  }

  // Verificar conexión con Supabase
  static async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.from("profiles").select("count").limit(1)

      if (error) {
        return {
          success: false,
          message: `Error de conexión: ${error.message}`,
        }
      }

      return {
        success: true,
        message: "Conexión exitosa con Supabase",
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Error: ${error.message}`,
      }
    }
  }
}

export { AuthServiceSupabase }
export default AuthServiceSupabase

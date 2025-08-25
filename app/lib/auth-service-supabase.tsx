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
  private static readonly STORAGE_KEY = "semzo_user"

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

      if (result.success && result.user) {
        // Guardar usuario en localStorage
        this.setUser(result.user)
      }

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

      if (result.success && result.user) {
        // Guardar usuario en localStorage
        this.setUser(result.user)
      }

      return result
    } catch (error: any) {
      return {
        success: false,
        message: `Error de conexión: ${error.message}`,
      }
    }
  }

  static async logout(): Promise<void> {
    try {
      // Cerrar sesión en Supabase primero
      await supabase.auth.signOut()
    } catch (error) {
      console.error("Error cerrando sesión en Supabase:", error)
    }

    // Limpiar localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.STORAGE_KEY)
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    if (typeof window === "undefined") return null

    try {
      // Verificar sesión de Supabase primero
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error || !session) {
        // Si no hay sesión válida en Supabase, limpiar localStorage
        localStorage.removeItem(this.STORAGE_KEY)
        return null
      }

      // Si hay sesión válida, obtener datos del localStorage
      const userData = localStorage.getItem(this.STORAGE_KEY)
      if (userData) {
        return JSON.parse(userData)
      }

      // Si no hay datos en localStorage pero sí sesión, crear usuario básico
      return {
        id: session.user.id,
        email: session.user.email || "",
        firstName: session.user.user_metadata?.firstName || "",
        lastName: session.user.user_metadata?.lastName || "",
        phone: session.user.user_metadata?.phone || "",
        membershipStatus: "free",
      }
    } catch (error) {
      console.error("Error obteniendo usuario:", error)
      return null
    }
  }

  static async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser()
    return user !== null
  }

  // Guardar usuario en localStorage
  private static setUser(user: User): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user))
    }
  }

  // Actualizar datos del usuario
  static updateUser(userData: Partial<User>): void {
    const userData_local = localStorage.getItem(this.STORAGE_KEY)
    if (userData_local) {
      const currentUser = JSON.parse(userData_local)
      const updatedUser = { ...currentUser, ...userData }
      this.setUser(updatedUser)
    }
  }

  // Verificar conexión con Supabase
  static async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.from("users").select("count").limit(1)

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

export default AuthServiceSupabase

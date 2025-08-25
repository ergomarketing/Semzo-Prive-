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

  // Cerrar sesión
  static logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.STORAGE_KEY)
    }
  }

  // Obtener usuario actual
  static getCurrentUser(): User | null {
    if (typeof window === "undefined") return null

    try {
      const userData = localStorage.getItem(this.STORAGE_KEY)
      return userData ? JSON.parse(userData) : null
    } catch (error) {
      console.error("Error parsing user data:", error)
      return null
    }
  }

  // Verificar si está autenticado
  static isAuthenticated(): boolean {
    return this.getCurrentUser() !== null
  }

  // Guardar usuario en localStorage
  private static setUser(user: User): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user))
    }
  }

  // Actualizar datos del usuario
  static updateUser(userData: Partial<User>): void {
    const currentUser = this.getCurrentUser()
    if (currentUser) {
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

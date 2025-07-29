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

export class AuthService {
  static async register(userData: {
    email: string
    firstName: string
    lastName: string
    phone?: string
  }): Promise<AuthResponse> {
    try {
      console.log("[AuthService] Enviando datos de registro:", userData)

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()
      console.log("[AuthService] Respuesta del servidor:", data)

      if (!response.ok) {
        return {
          success: false,
          message: data.message || "Error en el registro",
        }
      }

      // Guardar usuario en localStorage si el registro fue exitoso
      if (data.success && data.user) {
        localStorage.setItem("user", JSON.stringify(data.user))
        localStorage.setItem("isLoggedIn", "true")
      }

      return data
    } catch (error: any) {
      console.error("[AuthService] Error en registro:", error)
      return {
        success: false,
        message: "Error de conexión",
      }
    }
  }

  static async login(email: string): Promise<AuthResponse> {
    try {
      console.log("[AuthService] Enviando datos de login:", { email })

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      console.log("[AuthService] Respuesta del servidor:", data)

      if (!response.ok) {
        return {
          success: false,
          message: data.message || "Error en el login",
        }
      }

      // Guardar usuario en localStorage si el login fue exitoso
      if (data.success && data.user) {
        localStorage.setItem("user", JSON.stringify(data.user))
        localStorage.setItem("isLoggedIn", "true")
      }

      return data
    } catch (error: any) {
      console.error("[AuthService] Error en login:", error)
      return {
        success: false,
        message: "Error de conexión",
      }
    }
  }

  static logout(): void {
    localStorage.removeItem("user")
    localStorage.removeItem("isLoggedIn")
  }

  static getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem("user")
      return userStr ? JSON.parse(userStr) : null
    } catch (error) {
      console.error("[AuthService] Error obteniendo usuario:", error)
      return null
    }
  }

  static isLoggedIn(): boolean {
    return localStorage.getItem("isLoggedIn") === "true"
  }
}

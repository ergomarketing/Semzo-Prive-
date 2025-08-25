export interface User {
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
  user?: User
  session?: any
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

      return data
    } catch (error: any) {
      console.error("[AuthService] Error en registro:", error)
      return {
        success: false,
        message: "Error de conexión",
      }
    }
  }

  static async login(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log("[AuthService] Enviando datos de login:", { email, password: "***" })

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      console.log("[AuthService] Respuesta del servidor:", data)

      if (!response.ok) {
        return {
          success: false,
          message: data.message || "Error en el login",
        }
      }

      // Limpiar datos anteriores antes de guardar nuevos
      this.logout()

      // Guardar usuario en localStorage si el login fue exitoso
      if (data.success && data.user) {
        localStorage.setItem("user", JSON.stringify(data.user))
        localStorage.setItem("session", JSON.stringify(data.session))
        localStorage.setItem("isLoggedIn", "true")
        console.log("[AuthService] Datos guardados en localStorage:", data.user)
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
    console.log("[AuthService] Cerrando sesión...")
    localStorage.removeItem("user")
    localStorage.removeItem("session")
    localStorage.removeItem("isLoggedIn")

    // Limpiar también cualquier cookie de sesión
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=")
      const name = eqPos > -1 ? c.substr(0, eqPos) : c
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
    })
  }

  static getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem("user")
      const user = userStr ? JSON.parse(userStr) : null
      console.log("[AuthService] Usuario actual:", user)
      return user
    } catch (error) {
      console.error("[AuthService] Error obteniendo usuario:", error)
      return null
    }
  }

  static getSession(): any | null {
    try {
      const sessionStr = localStorage.getItem("session")
      return sessionStr ? JSON.parse(sessionStr) : null
    } catch (error) {
      console.error("[AuthService] Error obteniendo sesión:", error)
      return null
    }
  }

  static isLoggedIn(): boolean {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
    const user = this.getCurrentUser()
    console.log("[AuthService] Estado de login:", { isLoggedIn, hasUser: !!user })
    return isLoggedIn && !!user
  }
}

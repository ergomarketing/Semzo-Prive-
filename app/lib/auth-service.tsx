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

      // Limpiar datos anteriores
      this.clearStorage()

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

      // Guardar usuario en localStorage si el login fue exitoso
      if (data.success && data.user) {
        console.log("[AuthService] Guardando datos en localStorage:", data.user)
        localStorage.setItem("user", JSON.stringify(data.user))
        localStorage.setItem("session", JSON.stringify(data.session))
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

  static clearStorage(): void {
    console.log("[AuthService] Limpiando localStorage...")
    localStorage.removeItem("user")
    localStorage.removeItem("session")
    localStorage.removeItem("isLoggedIn")
  }

  static logout(): void {
    console.log("[AuthService] Cerrando sesión...")
    this.clearStorage()

    // Limpiar cookies también
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=")
      const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim()
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
    })
  }

  static getCurrentUser(): User | null {
    try {
      if (typeof window === "undefined") return null

      const userStr = localStorage.getItem("user")
      const user = userStr ? JSON.parse(userStr) : null
      console.log("[AuthService] Usuario actual desde localStorage:", user)
      return user
    } catch (error) {
      console.error("[AuthService] Error obteniendo usuario:", error)
      return null
    }
  }

  static getSession(): any | null {
    try {
      if (typeof window === "undefined") return null

      const sessionStr = localStorage.getItem("session")
      return sessionStr ? JSON.parse(sessionStr) : null
    } catch (error) {
      console.error("[AuthService] Error obteniendo sesión:", error)
      return null
    }
  }

  static isLoggedIn(): boolean {
    if (typeof window === "undefined") return false

    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
    const user = this.getCurrentUser()
    const result = isLoggedIn && !!user
    console.log("[AuthService] Estado de login:", { isLoggedIn, hasUser: !!user, result })
    return result
  }
}

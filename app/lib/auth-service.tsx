// Servicio de autenticación mejorado con persistencia
import { DBService } from "./db-service"

export class AuthService {
  private static readonly STORAGE_KEYS = {
    IS_AUTHENTICATED: "semzo_authenticated",
    USER_EMAIL: "semzo_user_email",
    USER_NAME: "semzo_user_name",
    USER_ID: "semzo_user_id",
    MEMBERSHIP_STATUS: "semzo_membership_status",
    SESSION_TOKEN: "semzo_session_token",
  }

  static setUserSession(userData: {
    email: string
    name: string
    id: string
    membershipStatus: string
    sessionToken: string
  }) {
    if (typeof window === "undefined") return

    localStorage.setItem(this.STORAGE_KEYS.IS_AUTHENTICATED, "true")
    localStorage.setItem(this.STORAGE_KEYS.USER_EMAIL, userData.email)
    localStorage.setItem(this.STORAGE_KEYS.USER_NAME, userData.name)
    localStorage.setItem(this.STORAGE_KEYS.USER_ID, userData.id)
    localStorage.setItem(this.STORAGE_KEYS.MEMBERSHIP_STATUS, userData.membershipStatus)
    localStorage.setItem(this.STORAGE_KEYS.SESSION_TOKEN, userData.sessionToken)

    // Guardar la última sesión en la base de datos
    try {
      const user = DBService.findUserByEmail(userData.email)
      if (user) {
        DBService.updateUser(user.id, {
          lastLogin: new Date().toISOString(),
          sessionToken: userData.sessionToken,
        })
      }
    } catch (error) {
      console.error("Error actualizando sesión:", error)
    }
  }

  static getUserSession() {
    if (typeof window === "undefined") return null

    const isAuthenticated = localStorage.getItem(this.STORAGE_KEYS.IS_AUTHENTICATED)
    if (isAuthenticated !== "true") return null

    return {
      email: localStorage.getItem(this.STORAGE_KEYS.USER_EMAIL) || "",
      name: localStorage.getItem(this.STORAGE_KEYS.USER_NAME) || "",
      id: localStorage.getItem(this.STORAGE_KEYS.USER_ID) || "",
      membershipStatus: localStorage.getItem(this.STORAGE_KEYS.MEMBERSHIP_STATUS) || "free",
      sessionToken: localStorage.getItem(this.STORAGE_KEYS.SESSION_TOKEN) || "",
    }
  }

  static clearSession() {
    if (typeof window === "undefined") return

    Object.values(this.STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key)
    })
  }

  static isAuthenticated(): boolean {
    if (typeof window === "undefined") return false
    return localStorage.getItem(this.STORAGE_KEYS.IS_AUTHENTICATED) === "true"
  }

  static async registerUser(userData: {
    email: string
    password: string
    firstName: string
    lastName: string
  }) {
    try {
      // Verificar si el usuario ya existe
      const existingUser = DBService.findUserByEmail(userData.email)
      if (existingUser) {
        return {
          success: false,
          message: "Este email ya está registrado",
        }
      }

      // Crear nuevo usuario
      const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const newUser = DBService.createUser({
        email: userData.email,
        // En producción, hashear la contraseña
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        membershipStatus: "free",
        sessionToken,
        lastLogin: new Date().toISOString(),
      })

      // Establecer sesión
      this.setUserSession({
        email: newUser.email,
        name: `${newUser.firstName} ${newUser.lastName}`,
        id: newUser.id,
        membershipStatus: newUser.membershipStatus,
        sessionToken,
      })

      return {
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: `${newUser.firstName} ${newUser.lastName}`,
          membershipStatus: newUser.membershipStatus,
        },
      }
    } catch (error) {
      console.error("Error en registro:", error)
      return {
        success: false,
        message: "Error al registrar usuario",
      }
    }
  }

  static async loginUser(email: string, password: string) {
    try {
      // Buscar usuario
      const user = DBService.findUserByEmail(email)

      if (!user) {
        return {
          success: false,
          message: "Usuario no encontrado",
        }
      }

      // Verificar contraseña (en producción, comparar hash)
      if (user.password !== password) {
        return {
          success: false,
          message: "Contraseña incorrecta",
        }
      }

      // Generar nuevo token de sesión
      const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Actualizar usuario
      DBService.updateUser(user.id, {
        sessionToken,
        lastLogin: new Date().toISOString(),
      })

      // Establecer sesión
      this.setUserSession({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        id: user.id,
        membershipStatus: user.membershipStatus,
        sessionToken,
      })

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          membershipStatus: user.membershipStatus,
        },
      }
    } catch (error) {
      console.error("Error en login:", error)
      return {
        success: false,
        message: "Error al iniciar sesión",
      }
    }
  }
}

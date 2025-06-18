// Servicio de base de datos simulada pero persistente
export class DBService {
  private static readonly STORAGE_PREFIX = "semzo_db_"

  // Colecciones
  private static readonly COLLECTIONS = {
    USERS: "users",
  }

  // Obtener una colección completa
  static getCollection(collection: string): any[] {
    if (typeof window === "undefined") return []

    const storageKey = this.STORAGE_PREFIX + collection
    const data = localStorage.getItem(storageKey)
    return data ? JSON.parse(data) : []
  }

  // Guardar una colección completa
  static saveCollection(collection: string, data: any[]): void {
    if (typeof window === "undefined") return

    const storageKey = this.STORAGE_PREFIX + collection
    localStorage.setItem(storageKey, JSON.stringify(data))
  }

  // Usuarios
  static getUsers(): any[] {
    return this.getCollection(this.COLLECTIONS.USERS)
  }

  static saveUsers(users: any[]): void {
    this.saveCollection(this.COLLECTIONS.USERS, users)
  }

  static findUserByEmail(email: string): any | null {
    const users = this.getUsers()
    return users.find((user) => user.email.toLowerCase() === email.toLowerCase()) || null
  }

  static createUser(userData: any): any {
    const users = this.getUsers()

    // Verificar si el usuario ya existe
    if (users.some((user) => user.email.toLowerCase() === userData.email.toLowerCase())) {
      throw new Error("El usuario ya existe")
    }

    // Crear nuevo usuario con ID único
    const newUser = {
      ...userData,
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString(),
    }

    // Guardar
    users.push(newUser)
    this.saveUsers(users)

    return newUser
  }

  static updateUser(userId: string, updates: any): any {
    const users = this.getUsers()
    const userIndex = users.findIndex((user) => user.id === userId)

    if (userIndex === -1) {
      throw new Error("Usuario no encontrado")
    }

    // Actualizar usuario
    users[userIndex] = {
      ...users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    this.saveUsers(users)
    return users[userIndex]
  }
}

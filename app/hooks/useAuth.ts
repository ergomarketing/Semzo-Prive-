"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"

// Definición de tipos simplificada para el contexto de Auth
export interface AuthContextType {
  user: { email: string } | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ email: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Lógica de inicialización de sesión de administrador
    const token = localStorage.getItem("admin_session_token")
    const email = localStorage.getItem("admin_email")

    if (token === "valid_admin_token" && email) {
      setUser({ email })
    } else {
      setUser(null)
    }
    setLoading(false)
  }, [])

  const signOut = async () => {
    // Llamar a la API de logout para limpiar las cookies
    await fetch("/api/admin/logout", { method: "POST" })
    
    localStorage.removeItem("admin_session_token")
    localStorage.removeItem("admin_email")
    setUser(null)
    router.push("/admin/login")
  }

  return <AuthContext.Provider value={{ user, loading, signOut }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    // Este error solo debería ocurrir si se usa useAuth fuera de AuthProvider
    // En el caso del admin, el layout ya maneja la lógica de isAdmin directamente
    // pero mantenemos el hook para compatibilidad con el layout.
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

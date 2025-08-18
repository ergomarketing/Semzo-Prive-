"use client"
import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ADMIN_CONFIG } from "../config/email-config"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== "undefined") {
        const session = localStorage.getItem("admin_session")
        const loginTime = localStorage.getItem("admin_login_time")
        if (!session || session !== "authenticated") {
          setIsAuthenticated(false)
          setLoading(false)
          router.replace("/admin/login")
          return // detener ejecución
        }
        if (loginTime) {
          const elapsed = Date.now() - Number.parseInt(loginTime)
          if (elapsed > ADMIN_CONFIG.sessionTimeout) {
            localStorage.removeItem("admin_session")
            localStorage.removeItem("admin_login_time")
            setIsAuthenticated(false)
            setLoading(false)
            router.replace("/admin/login")
            return
          }
        }
        setIsAuthenticated(true)
        setLoading(false)
      } else {
        setLoading(false)
      }
    }
    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-rose-nude flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-dark mx-auto"></div>
          <p className="mt-2 text-slate-600">Verificando acceso...</p>
        </div>
      </div>
    )
  }

  // Opcional: Mostrar mensaje o redirigir de otra forma si no autenticado.

  if (!isAuthenticated) {
    // Aquí solo retornamos null porque acabamos de redirigir
    return null
  }

  return <>{children}</>
}

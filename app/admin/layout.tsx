"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { ADMIN_CONFIG } from "../config/email-config"
import Link from "next/link"
import { LogOut, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const isLoginPage = pathname === "/admin/login"

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false)
      setIsAuthenticated(true)
      return
    }

    const checkAuth = () => {
      if (typeof window !== "undefined") {
        const session = localStorage.getItem("admin_session")
        const loginTime = localStorage.getItem("admin_login_time")

        if (!session || session !== "authenticated") {
          router.push("/admin/login")
          return
        }

        if (loginTime) {
          const elapsed = Date.now() - Number.parseInt(loginTime)
          if (elapsed > ADMIN_CONFIG.sessionTimeout) {
            localStorage.removeItem("admin_session")
            localStorage.removeItem("admin_login_time")
            router.push("/admin/login")
            return
          }
        }

        setIsAuthenticated(true)
      }
      setLoading(false)
    }

    checkAuth()
  }, [router, isLoginPage])

  const handleLogout = () => {
    localStorage.removeItem("admin_session")
    localStorage.removeItem("admin_login_time")
    router.push("/admin/login")
  }

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

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Admin Header */}
      {!isLoginPage && (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link href="/admin" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">SP</span>
                </div>
                <div>
                  <h1 className="font-serif text-xl font-bold text-slate-900">Semzo Privé</h1>
                  <p className="text-xs text-slate-500">Panel de Administración</p>
                </div>
              </Link>

              {/* Actions */}
              <div className="flex items-center space-x-4">
                <Link href="/" target="_blank">
                  <Button variant="outline" size="sm" className="space-x-2 bg-transparent">
                    <Home className="w-4 h-4" />
                    <span>Ver Sitio</span>
                  </Button>
                </Link>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </Button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Content */}
      <main>{children}</main>
    </div>
  )
}

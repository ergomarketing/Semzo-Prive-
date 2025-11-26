"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  LayoutDashboard,
  Package,
  Calendar,
  Users,
  CreditCard,
  MapPin,
  BarChart3,
  Mail,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Truck,
  AlertCircle,
} from "lucide-react"

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: string
}

const colors = {
  primary: "#1a2c4e",
  accent: "#fff1f2", // rosa muy pálido (equivalente a bg-rose-50)
  accentText: "#1a2c4e", // texto sobre el acento
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [adminEmail, setAdminEmail] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    if (pathname === "/admin/login") {
      setIsAdmin(false)
      return
    }
    const token = localStorage.getItem("admin_session_token")
    const email = localStorage.getItem("admin_email")
    if (token === "valid_admin_token" && email) {
      setIsAdmin(true)
      setAdminEmail(email)
    } else {
      setIsAdmin(false)
      setAdminEmail(null)
    }
  }, [pathname])

  useEffect(() => {
    const handleStorage = () => {
      const token = localStorage.getItem("admin_session_token")
      const email = localStorage.getItem("admin_email")
      if (token === "valid_admin_token" && email) {
        setIsAdmin(true)
        setAdminEmail(email)
      } else {
        setIsAdmin(false)
        setAdminEmail(null)
      }
    }
    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  const handleSignOut = () => {
    localStorage.removeItem("admin_session_token")
    localStorage.removeItem("admin_email")
    localStorage.removeItem("admin_login_time")
    setIsAdmin(false)
    setAdminEmail(null)
    window.location.href = "/admin/login"
  }

  const navItems: NavItem[] = [
    { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: "Inventario", href: "/admin/inventory", icon: <Package className="h-5 w-5" /> },
    { label: "Reservas", href: "/admin/reservations", icon: <Calendar className="h-5 w-5" /> },
    { label: "Miembros", href: "/admin/members", icon: <Users className="h-5 w-5" /> },
    { label: "Pagos", href: "/admin/payments", icon: <CreditCard className="h-5 w-5" /> },
    { label: "Envíos", href: "/admin/shipping", icon: <MapPin className="h-5 w-5" /> },
    { label: "Logística", href: "/admin/logistics", icon: <Truck className="h-5 w-5" /> },
    { label: "Análisis", href: "/admin/analytics", icon: <BarChart3 className="h-5 w-5" /> },
    { label: "Newsletter", href: "/admin/newsletter", icon: <Mail className="h-5 w-5" /> },
    { label: "Email Logs", href: "/admin/email-logs", icon: <Mail className="h-5 w-5" /> },
    { label: "Chat", href: "/admin/chat", icon: <MessageSquare className="h-5 w-5" /> },
  ]

  if (pathname === "/admin/login") {
    return <>{children}</>
  }

  if (isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "#faf8f7" }}>
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: colors.primary }}
          ></div>
          <p style={{ color: colors.primary }}>Verificando acceso...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "#faf8f7" }}>
        <Card className="w-full max-w-md border-0 shadow-lg">
          <div className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" style={{ color: "#d4a5a5" }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: colors.primary }}>
              Acceso Requerido
            </h3>
            <p className="mb-4" style={{ color: "#666" }}>
              Debes iniciar sesión como administrador.
            </p>
            <Button
              onClick={() => (window.location.href = "/admin/login")}
              className="w-full text-white"
              style={{ backgroundColor: colors.primary }}
            >
              Iniciar Sesión
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-screen" style={{ backgroundColor: "#faf8f7" }}>
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-20"} transition-all duration-300 overflow-y-auto flex flex-col`}
        style={{ backgroundColor: colors.primary }}
      >
        <div className="p-6 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <div className="flex items-center justify-between">
            {sidebarOpen && <h1 className="text-xl font-bold text-white">Semzo Privé</h1>}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 rounded-lg transition-colors text-white hover:bg-white/10"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`))
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors"
                  style={{
                    backgroundColor: isActive ? colors.accent : "transparent",
                    color: isActive ? colors.primary : "rgba(255,255,255,0.7)",
                  }}
                >
                  {item.icon}
                  {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                </div>
              </Link>
            )
          })}
        </nav>

        <div className="border-t p-3 space-y-2" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          {sidebarOpen && (
            <div className="px-4 py-2 text-sm">
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                Conectado como:
              </p>
              <p className="text-white font-medium truncate">{adminEmail}</p>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            <LogOut className="h-5 w-5" />
            {sidebarOpen && <span className="text-sm font-medium">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div
          className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10"
          style={{ borderColor: "#e5e5e5" }}
        >
          <div>
            <h2 className="text-2xl font-bold" style={{ color: colors.primary }}>
              Panel de Administración
            </h2>
            <p className="text-sm" style={{ color: "#888" }}>
              Gestión de Semzo Privé
            </p>
          </div>
        </div>
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}

"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "../hooks/useAuth"
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Verificar si el usuario está logueado como admin (sistema de credenciales fijas)
    const token = localStorage.getItem("admin_session_token")
    const email = localStorage.getItem("admin_email")
    if (token === "valid_admin_token" && email) {
      setIsAdmin(true)
    } else {
      setIsAdmin(false)
    }
  }, [user]) // Re-evaluar si el usuario de Supabase cambia (aunque ya no se usa)
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleSignOut = async () => {
    // Cerrar sesión del sistema de credenciales fijas
    localStorage.removeItem("admin_session_token")
    localStorage.removeItem("admin_email")
    setIsAdmin(false)
    router.push("/")
  }

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/admin",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      label: "Inventario",
      href: "/admin/inventory",
      icon: <Package className="h-5 w-5" />,
    },
    {
      label: "Reservas",
      href: "/admin/reservations",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      label: "Miembros",
      href: "/admin/members",
      icon: <Users className="h-5 w-5" />,
    },
    {
      label: "Pagos",
      href: "/admin/payments",
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      label: "Envíos",
      href: "/admin/shipping",
      icon: <MapPin className="h-5 w-5" />,
    },
    {
      label: "Logística",
      href: "/admin/logistics",
      icon: <Truck className="h-5 w-5" />,
      badge: "Nuevo",
    },
    {
      label: "Análisis",
      href: "/admin/analytics",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      label: "Email Logs",
      href: "/admin/email-logs",
      icon: <Mail className="h-5 w-5" />,
    },
    {
      label: "Chat",
      href: "/admin/chat",
      icon: <MessageSquare className="h-5 w-5" />,
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  // Si estamos en la página de login, no aplicar el layout de protección
  // Si estamos en la página de login, no aplicar el layout de navegación
  if (pathname === "/admin/login") {
    return <>{children}</>
  }

  // Si no hay sesión de admin, redirigir a login
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <div className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Acceso Requerido</h3>
            <p className="text-gray-600 mb-4">Debes iniciar sesión como administrador.</p>
            <Button onClick={() => router.push("/admin/login")} className="bg-blue-600 hover:bg-blue-700 w-full">
              Iniciar Sesión
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-slate-900 text-white transition-all duration-300 overflow-y-auto flex flex-col`}
      >
        {/* Logo / Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            {sidebarOpen && <h1 className="text-xl font-bold">Semzo Admin</h1>}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {item.icon}
                  {sidebarOpen && (
                    <div className="flex-1">
                      <span className="text-sm font-medium">{item.label}</span>
                      {item.badge && (
                        <span className="ml-2 inline-block px-2 py-1 text-xs bg-green-600 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-slate-700 p-3 space-y-2">
          {sidebarOpen && (
            <div className="px-4 py-2 text-sm">
              <p className="text-gray-400 text-xs">Conectado como:</p>
              <p className="text-white font-medium truncate">{localStorage.getItem("admin_email")}</p>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LogOut className="h-5 w-5" />
            {sidebarOpen && <span className="text-sm font-medium">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Panel de Administración</h2>
            <p className="text-sm text-gray-600">Gestión de Semzo Privé</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{localStorage.getItem("admin_email")}</p>
              <p className="text-xs text-gray-500">Administrador</p>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}

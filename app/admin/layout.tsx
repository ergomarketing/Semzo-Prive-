"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
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
  RefreshCw,
  Gift,
  FileText,
  Bell,
  ChevronDown,
} from "lucide-react"

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: string
  category?: string
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [adminEmail, setAdminEmail] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["general", "content", "operations"])

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

  const navCategories = {
    general: {
      title: "General",
      items: [
        { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="h-4 w-4" /> },
        { label: "Análisis", href: "/admin/analytics", icon: <BarChart3 className="h-4 w-4" /> },
        { label: "Reportes", href: "/admin/reports", icon: <FileText className="h-4 w-4" /> },
      ],
    },
    inventory: {
      title: "Inventario & Reservas",
      items: [
        { label: "Inventario", href: "/admin/inventory", icon: <Package className="h-4 w-4" /> },
        { label: "Reservas", href: "/admin/reservations", icon: <Calendar className="h-4 w-4" /> },
        { label: "Logística", href: "/admin/logistics", icon: <Truck className="h-4 w-4" /> },
        { label: "Envíos", href: "/admin/shipping", icon: <MapPin className="h-4 w-4" /> },
      ],
    },
    members: {
      title: "Miembros & Pagos",
      items: [
        { label: "Miembros", href: "/admin/members", icon: <Users className="h-4 w-4" /> },
        { label: "Suscripciones", href: "/admin/subscriptions", icon: <RefreshCw className="h-4 w-4" /> },
        { label: "Pagos", href: "/admin/payments", icon: <CreditCard className="h-4 w-4" /> },
        { label: "Gift Cards", href: "/admin/gift-cards", icon: <Gift className="h-4 w-4" /> },
      ],
    },
    content: {
      title: "Contenido & Comunicación",
      items: [
        { label: "Blog", href: "/admin/blog", icon: <FileText className="h-4 w-4" /> },
        { label: "Newsletter", href: "/admin/newsletter", icon: <Mail className="h-4 w-4" /> },
        { label: "Email Logs", href: "/admin/email-logs", icon: <Mail className="h-4 w-4" /> },
        { label: "Chat", href: "/admin/chat", icon: <MessageSquare className="h-4 w-4" /> },
      ],
    },
    system: {
      title: "Sistema",
      items: [
        { label: "Alertas", href: "/admin/alerts", icon: <Bell className="h-4 w-4" /> },
        { label: "Auditoría", href: "/admin/audit-logs", icon: <FileText className="h-4 w-4" /> },
      ],
    },
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }

  if (pathname === "/admin/login") {
    return <>{children}</>
  }

  if (isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando acceso...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md shadow-xl border-border bg-card">
          <div className="p-8 text-center">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-destructive" />
            <h3 className="text-xl font-semibold mb-3 text-foreground">Acceso Requerido</h3>
            <p className="mb-6 text-muted-foreground">Debes iniciar sesión como administrador.</p>
            <Button onClick={() => (window.location.href = "/admin/login")} className="w-full" size="lg">
              Iniciar Sesión
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-72" : "w-20"} transition-all duration-300 border-r border-border bg-card flex flex-col shadow-sm`}
      >
        {/* Header del sidebar */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            {sidebarOpen ? (
              <div className="flex items-center gap-3">
                <Image
                  src="/images/logo-20semzo-20prive.png"
                  alt="Semzo Privé"
                  width={40}
                  height={50}
                  className="object-contain"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">Semzo Privé</span>
                  <span className="text-xs text-muted-foreground">Admin Panel</span>
                </div>
              </div>
            ) : (
              <Image
                src="/images/logo-20semzo-20prive.png"
                alt="SP"
                width={32}
                height={40}
                className="object-contain mx-auto"
              />
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg transition-colors hover:bg-accent text-muted-foreground hover:text-foreground"
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Navegación con categorías */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {Object.entries(navCategories).map(([categoryKey, category]) => {
            const isExpanded = expandedCategories.includes(categoryKey)
            return (
              <div key={categoryKey} className="mb-2">
                {sidebarOpen && (
                  <button
                    onClick={() => toggleCategory(categoryKey)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                  >
                    <span>{category.title}</span>
                    <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </button>
                )}
                {(isExpanded || !sidebarOpen) && (
                  <div className="space-y-0.5 mt-1">
                    {category.items.map((item) => {
                      const isActive =
                        pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`))
                      return (
                        <Link key={item.href} href={item.href}>
                          <div
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                              isActive
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                            }`}
                          >
                            <span
                              className={`${isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"}`}
                            >
                              {item.icon}
                            </span>
                            {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-border p-4 bg-muted/30">
          {sidebarOpen && (
            <div className="px-2 py-2 mb-2">
              <p className="text-xs text-muted-foreground mb-1">Conectado como</p>
              <p className="text-sm font-medium text-foreground truncate">{adminEmail}</p>
            </div>
          )}
          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            size="sm"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {sidebarOpen && <span>Cerrar Sesión</span>}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <header className="bg-card border-b border-border px-8 py-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Panel de Administración</h2>
              <p className="text-sm text-muted-foreground">Gestión de Semzo Privé</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/" target="_blank">
                Ver Sitio Web
              </Link>
            </Button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8 bg-background">{children}</div>
      </main>
    </div>
  )
}

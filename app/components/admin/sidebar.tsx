"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard,
  Package,
  Calendar,
  Users,
  CreditCard,
  Receipt,
  Gift,
  Truck,
  BoxIcon,
  BarChart3,
  Mail,
  MessageSquare,
  FileText,
} from "lucide-react"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/inventory", label: "Inventario", icon: Package },
  { href: "/admin/reservations", label: "Reservas", icon: Calendar },
  { href: "/admin/members", label: "Miembros", icon: Users },
  { href: "/admin/payments", label: "Pagos", icon: CreditCard },
  { href: "/admin/subscriptions", label: "Suscripciones", icon: Receipt },
  { href: "/admin/gift-cards", label: "Gift Cards", icon: Gift },
  { href: "/admin/shipping", label: "Envíos", icon: Truck },
  { href: "/admin/logistics", label: "Logística", icon: BoxIcon },
  { href: "/admin/analytics", label: "Análisis", icon: BarChart3 },
  { href: "/admin/blog", label: "Blog", icon: FileText },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
  { href: "/admin/chat", label: "Chat", icon: MessageSquare },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-4">
        <Link href="/admin" className="flex items-center space-x-2">
          <span className="font-serif text-xl text-indigo-dark">Semzo Privé</span>
        </Link>
      </div>
      <nav className="mt-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 text-sm transition-colors ${
                isActive
                  ? "bg-rose-nude text-indigo-dark font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

export default AdminSidebar

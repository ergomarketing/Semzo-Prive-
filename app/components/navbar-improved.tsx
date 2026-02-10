"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuthServiceSupabase } from "../lib/auth-service-supabase"
import type { User as UserType } from "../lib/supabase"

export default function NavbarImproved() {
  const [user, setUser] = useState<UserType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const currentUser = await AuthServiceSupabase.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error("Error verificando autenticación:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await AuthServiceSupabase.logout()
      setUser(null)
      router.push("/")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  const navItems = [
    { name: "COLECCIÓN", path: "/catalog" },
    { name: "MEMBRESÍAS", path: "/membership-signup" },
    { name: "PROCESO", path: "/proceso" },
    { name: "MAGAZINE", path: "/magazine" },
    { name: "TESTIMONIOS", path: "/testimonios" },
  ]

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <Link href="/" className="font-serif text-2xl text-slate-900">
            Semzo Privé
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.path}
                className={`text-sm ${
                  pathname === item.path ? "text-indigo-dark font-medium" : "text-slate-600 hover:text-indigo-dark"
                } transition-colors`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center">
            {isLoading ? (
              <div className="w-20 h-8 bg-slate-200 animate-pulse rounded"></div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-slate-600" />
                  <span className="text-sm text-slate-600">
                    Hola, {user.first_name} {user.last_name}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50 bg-transparent"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Salir
                </Button>
              </div>
            ) : (
              <Link href="/auth/login">
                <Button className="bg-indigo-dark text-white hover:bg-indigo-dark/90">ACCESO</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

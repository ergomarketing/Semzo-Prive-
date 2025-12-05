"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useAuth } from "../hooks/useAuth"
import { User, LogOut, ShoppingBag } from "lucide-react"
import { useCart } from "@/app/contexts/cart-context"
import { usePathname } from "next/navigation"

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const { user, loading, signOut } = useAuth()
  const { itemCount } = useCart()
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith("/admin")
  const isDashboardRoute = pathname?.startsWith("/dashboard")

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    if (window.location.pathname !== "/") {
      window.location.href = `/#${sectionId}`
      return
    }

    setTimeout(() => {
      const element = document.getElementById(sectionId)
      if (element) {
        const headerOffset = 80
        const elementPosition = element.offsetTop
        const offsetPosition = elementPosition - headerOffset

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        })
      }
    }, 100)
  }

  const handleLogout = async () => {
    await signOut()
    window.location.href = "/"
  }

  if (isAdminRoute || isDashboardRoute) {
    return null
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/95 backdrop-blur-sm shadow-sm" : "bg-white/80 backdrop-blur-sm"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center flex-shrink-0">
            <span
              className="text-lg sm:text-xl tracking-[0.15em] font-light"
              style={{
                color: "#1a2c4e",
                fontFamily: "var(--font-playfair), Playfair Display, Georgia, serif",
              }}
            >
              SEMZO
            </span>
            <Image
              src="/images/sp-monogram-v2.png"
              alt="SP Monogram"
              width={40}
              height={50}
              className="w-8 h-10 sm:w-10 sm:h-12 mx-1 sm:mx-2 object-contain"
              style={{
                filter:
                  "brightness(0) saturate(100%) invert(12%) sepia(25%) saturate(1500%) hue-rotate(185deg) brightness(95%)",
              }}
              priority
            />
            <span
              className="text-lg sm:text-xl tracking-[0.15em] font-light"
              style={{
                color: "#1a2c4e",
                fontFamily: "var(--font-playfair), Playfair Display, Georgia, serif",
              }}
            >
              PRIVÉ
            </span>
          </Link>

          <div className="flex-1 mx-4 sm:mx-8">
            <nav className="hidden md:flex items-center justify-center space-x-6 lg:space-x-10">
              <NavLink href="/catalog">Colección</NavLink>
              <button
                onClick={() => scrollToSection("membresias")}
                className="text-xs uppercase tracking-widest font-medium transition-colors hover:opacity-80 text-slate-600 hover:text-slate-900 whitespace-nowrap"
              >
                Membresías
              </button>
              <button
                onClick={() => scrollToSection("como-funciona")}
                className="text-xs uppercase tracking-widest font-medium transition-colors hover:opacity-80 text-slate-600 hover:text-slate-900 whitespace-nowrap"
              >
                Proceso
              </button>
              <button
                onClick={() => scrollToSection("magazine")}
                className="text-xs uppercase tracking-widest font-medium transition-colors hover:opacity-80 text-slate-600 hover:text-slate-900 whitespace-nowrap"
              >
                Magazine
              </button>
              <button
                onClick={() => scrollToSection("testimonios")}
                className="text-xs uppercase tracking-widest font-medium transition-colors hover:opacity-80 text-slate-600 hover:text-slate-900 whitespace-nowrap"
              >
                Testimonios
              </button>
            </nav>
          </div>

          <div className="flex-shrink-0">
            <div className="flex items-center space-x-2">
              <Link href="/cart" className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-none px-2 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                >
                  <ShoppingBag className="w-4 h-4" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-nude text-slate-900 text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                      {itemCount > 0 ? 1 : 0}
                    </span>
                  )}
                </Button>
              </Link>

              {loading ? (
                <Button className="rounded-none px-3 sm:px-6 py-2 text-xs uppercase tracking-widest font-medium bg-slate-400 text-white cursor-not-allowed">
                  ...
                </Button>
              ) : user ? (
                <div className="flex items-center space-x-2">
                  <Link href="/dashboard">
                    <Button className="rounded-none px-3 sm:px-4 py-2 text-xs uppercase tracking-widest font-medium transition-all duration-300 bg-slate-800 text-white hover:bg-slate-700 flex items-center space-x-2">
                      <User className="w-3 h-3" />
                      <span className="hidden sm:inline">
                        {user.profile?.full_name ||
                          (user.profile?.first_name && user.profile?.last_name
                            ? `${user.profile.first_name} ${user.profile.last_name}`
                            : null) ||
                          (user.metadata?.first_name && user.metadata?.last_name
                            ? `${user.metadata.first_name} ${user.metadata.last_name}`
                            : null) ||
                          user.email?.split("@")[0] ||
                          "Usuario"}
                      </span>
                      <span className="sm:hidden">
                        {user.profile?.first_name ||
                          user.metadata?.first_name ||
                          user.email?.split("@")[0]?.slice(0, 8) ||
                          "Usuario"}
                      </span>
                    </Button>
                  </Link>
                  <Button
                    onClick={handleLogout}
                    className="rounded-none px-2 py-2 text-xs bg-slate-600 text-white hover:bg-slate-500 transition-all duration-300"
                    title="Cerrar Sesión"
                  >
                    <LogOut className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <Link href="/auth/login">
                  <Button className="rounded-none px-3 sm:px-6 py-2 text-xs uppercase tracking-widest font-medium transition-all duration-300 bg-slate-900 text-white hover:bg-slate-800">
                    Acceso
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-xs uppercase tracking-widest font-medium transition-colors hover:opacity-80 text-slate-600 hover:text-slate-900 whitespace-nowrap"
    >
      {children}
    </Link>
  )
}

export { Navbar }

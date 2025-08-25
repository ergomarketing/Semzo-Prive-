"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    // Si no estamos en la página principal, ir allí primero
    if (window.location.pathname !== "/") {
      window.location.href = `/#${sectionId}`
      return
    }

    // Esperar un poco para que la página cargue si es necesario
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

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/95 backdrop-blur-sm border-b border-slate-200" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center flex-shrink-0">
            <span className="font-serif text-lg sm:text-2xl text-slate-900">Semzo Privé</span>
          </Link>

          {/* Flexible Navigation - Scroll horizontal en móvil */}
          <div className="flex-1 mx-2 sm:mx-4">
            <nav className="flex items-center justify-center overflow-x-auto scrollbar-hide space-x-2 sm:space-x-6 lg:space-x-12 pb-1">
              <NavLink href="/catalog">Colección</NavLink>
              <button
                onClick={() => scrollToSection("membresias")}
                className="text-xs uppercase tracking-widest font-medium transition-colors hover:opacity-80 text-slate-600 hover:text-slate-900 whitespace-nowrap flex-shrink-0"
              >
                Membresías
              </button>
              <button
                onClick={() => scrollToSection("como-funciona")}
                className="text-xs uppercase tracking-widest font-medium transition-colors hover:opacity-80 text-slate-600 hover:text-slate-900 whitespace-nowrap flex-shrink-0"
              >
                Proceso
              </button>
              <button
                onClick={() => scrollToSection("magazine")}
                className="text-xs uppercase tracking-widest font-medium transition-colors hover:opacity-80 text-slate-600 hover:text-slate-900 whitespace-nowrap flex-shrink-0"
              >
                Magazine
              </button>
              <button
                onClick={() => scrollToSection("testimonios")}
                className="text-xs uppercase tracking-widest font-medium transition-colors hover:opacity-80 text-slate-600 hover:text-slate-900 whitespace-nowrap flex-shrink-0"
              >
                Testimonios
              </button>
            </nav>
          </div>

          {/* Always Visible CTA */}
          <div className="flex-shrink-0">
            <Link href="/login">
              <Button className="rounded-none px-3 sm:px-6 py-2 text-xs uppercase tracking-widest font-medium transition-all duration-300 bg-indigo-dark text-white hover:bg-indigo-dark/90">
                Acceso
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <style jsx global>{`
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
    `}</style>
    </header>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-xs uppercase tracking-widest font-medium transition-colors hover:opacity-80 text-slate-600 hover:text-slate-900 whitespace-nowrap flex-shrink-0"
    >
      {children}
    </Link>
  )
}

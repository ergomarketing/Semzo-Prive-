"use client"

import type React from "react"
import Navbar from "./components/navbar"
import Footer from "./components/footer"
import CookieConsent from "./components/cookie-consent"
import { CartProvider } from "./components/cart-context"
import { AuthProvider } from "./hooks/useAuth"
import { usePathname } from "next/navigation"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  // <CHANGE> Detectar si estamos en una ruta de admin para ocultar Navbar/Footer
  const isAdminRoute = pathname?.startsWith("/admin")

  return (
    <AuthProvider>
      <CartProvider>
        {/* <CHANGE> Solo mostrar Navbar y Footer si NO es ruta de admin */}
        {!isAdminRoute && <Navbar />}
        {children}
        {!isAdminRoute && <Footer />}
        {!isAdminRoute && <CookieConsent />}
      </CartProvider>
    </AuthProvider>
  )
}

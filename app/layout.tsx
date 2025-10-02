import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Navbar from "./components/navbar"
import Footer from "./components/footer"
import CookieConsent from "./components/cookie-consent"
import { CartProvider } from "./components/cart-context"
import { AuthProvider } from "./hooks/useAuth"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "Semzo Privé - Alquiler de Bolsos de Lujo",
  description: "Accede a los bolsos más exclusivos del mundo con nuestro servicio de alquiler por suscripción.",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <CartProvider>
            <Navbar />
            {children}
            <Footer />
            <CookieConsent />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

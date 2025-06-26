'use client'

import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"
import Navbar from "./components/navbar"
import Footer from "./components/footer"
import CookieConsent from "./components/cookie-consent"
import SupabaseProvider from "./supabase-provider"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" })

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
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <SupabaseProvider>
          <Navbar />
          {children}
          <Footer />
          <CookieConsent />
        </SupabaseProvider>
      </body>
    </html>
  )
}


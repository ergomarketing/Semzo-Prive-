import type React from "react"
import type { Metadata } from "next"
import { Inter, Playfair_Display } from 'next/font/google'
import Script from "next/script"
import TikTokPixel from "@/components/TikTokPixel"
import "./globals.css"
import Navbar from "./components/navbar"
import Footer from "./components/footer"
import CookieConsent from "./components/cookie-consent"
import { CartProvider } from "./contexts/cart-context" // Corregido import del CartProvider a la ubicación correcta
import { AuthProvider } from "./hooks/useAuth"

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
      <head>
        <TikTokPixel />
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-0BMNYQLWLZ" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-0BMNYQLWLZ');
          `}
        </Script>

        <Script src="https://www.googletagmanager.com/gtag/js?id=AW-17660150279" strategy="afterInteractive" />
        <Script id="google-ads" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-17660150279');
          `}
        </Script>
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
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

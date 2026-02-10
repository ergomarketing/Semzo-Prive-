import type React from "react"
import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import Script from "next/script"
import TikTokPixel from "@/components/TikTokPixel"
import "./globals.css"
import Navbar from "./components/navbar"
import Footer from "./components/footer"
import CookieConsent from "./components/cookie-consent"
import { CartProvider } from "./contexts/cart-context"
import { AuthProvider } from "./hooks/useAuth"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
})
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  preload: true,
})

export const metadata: Metadata = {
  metadataBase: new URL("https://semzoprive.com"),
  title: {
    default: "Semzo Privé - Alquiler de Bolsos de Lujo por Suscripción",
    template: "%s | Semzo Privé",
  },
  description:
    "Accede a bolsos de lujo de Chanel, Dior, Louis Vuitton y más marcas exclusivas por suscripción. Desde 59€/mes. Envío gratis, seguro incluido y cambios ilimitados.",
  keywords: [
    "alquiler bolsos lujo",
    "bolsos lujo suscripción",
    "chanel alquiler",
    "dior alquiler",
    "louis vuitton alquiler",
    "bolsos diseñador",
    "fashion rental",
    "luxury handbag rental",
  ],
  authors: [{ name: "Semzo Privé" }],
  creator: "Semzo Privé",
  publisher: "Semzo Privé",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://semzoprive.com",
    title: "Semzo Privé - Alquiler de Bolsos de Lujo por Suscripción",
    description:
      "Accede a bolsos de lujo de Chanel, Dior, Louis Vuitton y más. Desde 59€/mes con envío gratis y seguro incluido.",
    siteName: "Semzo Privé",
    images: [
      {
        url: "/images/hero-luxury-bags.jpeg",
        width: 1200,
        height: 630,
        alt: "Colección de bolsos de lujo Semzo Privé",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Semzo Privé - Alquiler de Bolsos de Lujo",
    description: "Bolsos de lujo desde 59€/mes. Chanel, Dior, Louis Vuitton y más.",
    images: ["/images/hero-luxury-bags.jpeg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "G-0BMNYQLWLZ",
    other: {
      "p:domain_verify": "a98e3be6d7a4e44ba4587bc1cdba9e61",
    },
  },
  alternates: {
    canonical: "https://semzoprive.com",
  },
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Semzo Privé",
    description: "Servicio de alquiler de bolsos de lujo por suscripción",
    url: "https://semzoprive.com",
    logo: "https://semzoprive.com/images/semzo-prive-logo.png",
    image: "https://semzoprive.com/images/hero-luxury-bags.jpeg",
    email: "mailbox@semzoprive.com",
    sameAs: ["https://www.instagram.com/semzoprive", "https://www.tiktok.com/@semzoprive"],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "mailbox@semzoprive.com",
      availableLanguage: ["es", "en"],
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "ES",
    },
  }

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Semzo Privé",
    url: "https://semzoprive.com",
    description: "Alquiler de bolsos de lujo por suscripción",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://semzoprive.com/catalog?search={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  }

  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />

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
            <Toaster />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

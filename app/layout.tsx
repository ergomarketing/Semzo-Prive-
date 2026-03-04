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

  alternates: {
    canonical: "https://semzoprive.com",
    languages: {
      "es-ES": "https://semzoprive.com",
    },
  },

  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://semzoprive.com",
    siteName: "Semzo Privé",
    title: "Semzo Privé - Alquiler de Bolsos de Lujo por Suscripción",
    description:
      "Accede a bolsos de lujo de Chanel, Dior y más. Desde 59€/mes con envío gratis y seguro incluido.",
    images: [
      {
        url: "https://semzoprive.com/images/hero-luxury-bags.jpeg",
        width: 1200,
        height: 630,
        alt: "Colección de bolsos de lujo Semzo Privé",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Semzo Privé - Alquiler de Bolsos de Lujo",
    description:
      "Bolsos de lujo desde 59€/mes. Chanel, Dior, Louis Vuitton y más.",
    images: ["https://semzoprive.com/images/hero-luxury-bags.jpeg"],
  },

  robots: {
    index: true,
    follow: true,
    nocache: false,
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

  category: "fashion",
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
    url: "https://semzoprive.com",
    logo: "https://semzoprive.com/images/semzo-prive-logo.png",
    sameAs: [
      "https://www.instagram.com/semzoprive",
      "https://www.tiktok.com/@semzoprive",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "mailbox@semzoprive.com",
      availableLanguage: ["es", "en"],
    },
  }

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Semzo Privé",
    url: "https://semzoprive.com",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://semzoprive.com/catalog?search={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: "https://semzoprive.com",
      },
    ],
  }

  return (
    <html lang="es">
      <head>

        {/* Preconnect Performance */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />

        {/* TikTok Pixel */}
        <TikTokPixel />

        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-0BMNYQLWLZ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-0BMNYQLWLZ', {
              anonymize_ip: true,
              send_page_view: true
            });
          `}
        </Script>

        {/* Google Ads */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-17660150279"
          strategy="afterInteractive"
        />
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

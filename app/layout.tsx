// SSR cache invalidation: 2026-05-11T14:52 (footer restructure)
import type React from "react"
import type { Metadata } from "next"
import { Playfair_Display } from "next/font/google"
import Script from "next/script"
import { TRACKING_LOADER_SCRIPT } from "@/lib/tracking-loader"
import "./globals.css"
import Navbar from "./components/navbar"
import Footer from "./components/footer"
import CookieConsent from "./components/cookie-consent"
import PartnerCapture from "./components/partner-capture"
import AttributionCapture from "./components/attribution-capture"
import { CartProvider } from "./contexts/cart-context"
import { AuthProvider } from "./hooks/useAuth"
import { Toaster } from "@/components/ui/toaster"
import IntlProvider from "@/providers/IntlProvider"
// Solo el idioma por defecto (es) entra en el bundle inicial. El inglés se
// carga bajo demanda dentro de IntlProvider (import() -> chunk aparte).
import esMessages from "@/messages/es.json"

/*
 * Fuentes:
 * - next/font/google auto-hospeda los archivos en /_next/static/media (NO hace
 *   petición a fonts.googleapis.com), inyecta el @font-face inline y añade
 *   <link rel="preload"> — nunca bloquea el render.
 * - display: "swap" -> el texto se pinta ya con la fuente fallback y cambia a
 *   Playfair cuando carga (sin FOIT).
 * - adjustFontFallback + fallback: ajustan las métricas de la fuente de sistema
 *   para minimizar el salto (CLS) al intercambiar.
 * - Inter se eliminó: --font-inter no se referenciaba en ningún sitio (el body
 *   usa font-sans = stack del sistema). Era una descarga y un preload inútiles.
 * - Playfair solo se usa en el wordmark del navbar; el resto de titulares
 *   (.font-serif) ya usan Georgia por decisión de diseño en globals.css.
 */
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
  fallback: ["Georgia", "Times New Roman", "serif"],
})

export const metadata: Metadata = {
  metadataBase: new URL("https://semzoprive.com"),

  title: {
    default: "Alquiler de Bolsos de Lujo en España | Chanel, Dior, Louis Vuitton | Semzo Privé",
    template: "%s | Semzo Privé",
  },

  description:
    "Alquila bolsos de lujo Chanel, Dior y Louis Vuitton en Madrid y Marbella. Membresía exclusiva desde 59€/mes. Bolsos para invitadas, eventos y ocasiones especiales. Envío 24-48h.",

  keywords: [
    "alquiler bolsos lujo",
    "alquiler bolsos lujo madrid",
    "alquiler bolsos marbella",
    "bolsos invitadas alquiler",
    "alquiler bolsos diseñador",
    "bolsos lujo eventos",
    "chanel alquiler",
    "dior alquiler",
    "louis vuitton alquiler",
    "hermès alquiler",
    "membresía bolsos lujo",
    "moda sostenible españa",
    "bolsos premium suscripción",
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
    title: "Alquiler de Bolsos de Lujo | Chanel, Dior, Louis Vuitton | Semzo Privé",
    description:
      "Alquila bolsos de lujo Chanel, Dior y Louis Vuitton en Madrid y Marbella. Membresía exclusiva desde 59€/mes.",
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
    title: "Alquiler de Bolsos de Lujo | Chanel, Dior, Louis Vuitton | Semzo Privé",
    description:
      "Alquila bolsos de lujo en Madrid y Marbella. Membresía desde 59€/mes. Envío 24-48h.",
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

  // Verificacion de Google Search Console se hace via Google Analytics (servicio asociado).
  // No se necesita meta tag aqui. Si en el futuro quieres anadir verificacion HTML,
  // pega el content del meta tag "google-site-verification" en google: "..."
  verification: {
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
    logo: "https://semzoprive.com/images/sp-monogram-v2.png",
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
    knowsAbout: [
      "alquiler de bolsos de lujo",
      "bolsos de diseñador",
      "suscripción de bolsos",
      "club de bolsos de lujo",
      "moda sostenible",
      "Chanel",
      "Dior",
      "Louis Vuitton",
      "Hermès",
    ],
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

        {/*
         * Tracking (Google Tag Manager + pixel de TikTok) — ver lib/tracking-loader.ts.
         * Un unico script inline afterInteractive decide cuando cargarlos:
         *  - INMEDIATO (como antes) si la visita trae senal de anuncio/campaña (gclid,
         *    utm_*, fbclid, ttclid...), si es una landing /lp/* o una pagina del embudo
         *    (signup, cart, checkout, dashboard...): las conversiones no se ven afectadas.
         *  - DIFERIDO (1a interaccion o 4 s) solo en paginas de contenido (/, /blog*,
         *    /proceso, /membresias, /colecciona) para visitas sin senal. GTM + TikTok
         *    eran ~70 % del Total Blocking Time movil.
         * NO usar beforeInteractive: bloquearia el render.
         */}
        <Script id="tracking-loader" strategy="afterInteractive">
          {TRACKING_LOADER_SCRIPT}
        </Script>

        {/*
         * Structured Data (JSON-LD) movido al final del <body> para evitar
         * conflicto de hidratacion con el script de sandbox de v0 que se
         * inyecta dinamicamente en <head> en el entorno de preview.
         * Google indexa el JSON-LD igual este en head o body.
         */}

        {/* Pixel de TikTok: lo carga tracking-loader junto a GTM (antes dos <Script> lazyOnload aqui). */}

        {/*
         * Google Analytics (G-0BMNYQLWLZ) y Google Ads (AW-17660150279) migrados
         * a Google Tag Manager (GTM-K3C577WM). Configurar dentro del contenedor GTM:
         *   - Etiqueta "Google Tag" / GA4 Configuration con ID G-0BMNYQLWLZ
         *     (equivalente al antiguo gtag config: anonymize_ip + page_view en All Pages)
         *   - Etiqueta de conversión de Google Ads con ID de conversión AW-17660150279
         *     y "Conversion Linker" en All Pages
         *   - Conversión "Envío de formulario clientes potenciales":
         *     send_to AW-17660150279/_FLwCMPl4K4bEIeEguVB, value 1.0, currency EUR,
         *     con un trigger de envío de formulario real (antes se disparaba en cada carga).
         */}

      </head>

      <body className={`${playfair.variable} font-sans antialiased`}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-K3C577WM"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        <IntlProvider defaultMessages={esMessages}>
          <AuthProvider>
            <CartProvider>
              <Navbar />
              {children}
              <Footer />
              <CookieConsent />
              <PartnerCapture />
              <AttributionCapture />
              <Toaster />
            </CartProvider>
          </AuthProvider>
        </IntlProvider>

        {/* Structured Data al final del body (valido para Google y evita hydration mismatch con script de sandbox en head) */}
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
      </body>
    </html>
  )
}

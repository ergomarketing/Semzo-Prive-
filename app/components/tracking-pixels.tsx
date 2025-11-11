"use client"

import { useEffect } from "react"
import Script from "next/script"
import { usePathname, useSearchParams } from "next/navigation"

// Tipos para los eventos de Facebook Pixel
declare global {
  interface Window {
    fbq: any
    gtag: any
    dataLayer: any
  }
}

export default function TrackingPixels() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Inicializar Facebook Pixel
  useEffect(() => {
    // Verificar que estamos en el navegador
    if (typeof window === "undefined") return

    // Facebook Pixel Code
    window.fbq =
      window.fbq ||
      (() => {
        ;(window.fbq.push = window.fbq.push || []).push(arguments)
      })
    window.fbq.loaded = true
    window.fbq.version = "2.0"
    window.fbq.queue = []

    const t = document.createElement("script")
    t.async = true
    t.src = "https://connect.facebook.net/en_US/fbevents.js"
    const s = document.getElementsByTagName("script")[0]
    if (s.parentNode) {
      s.parentNode.insertBefore(t, s)
    }

    // Inicializar con tu ID (usará una variable de entorno en producción)
    const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || "DEMO_PIXEL_ID"
    window.fbq("init", FB_PIXEL_ID)

    // Trackear la página vista inicial
    window.fbq("track", "PageView")
  }, [])

  // Trackear cambios de página
  useEffect(() => {
    // Verificar que estamos en el navegador
    if (typeof window === "undefined") return

    if (pathname) {
      // Facebook Pixel - trackear cambio de página
      if (window.fbq) {
        window.fbq("track", "PageView")
      }

      // Google Analytics - trackear cambio de página
      if (window.gtag) {
        window.gtag("event", "page_view", {
          page_path: pathname,
        })
      }
    }
  }, [pathname, searchParams])

  return (
    <>
      {/* Facebook Pixel */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || "DEMO_PIXEL_ID"}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>

      {/* Google Analytics */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || "DEMO_GA_ID"}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || "DEMO_GA_ID"}');
        `}
      </Script>
    </>
  )
}

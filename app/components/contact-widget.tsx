"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { Cormorant_Garamond } from "next/font/google"
import { Mail, MessageSquare } from "lucide-react"
import { useTranslations } from "next-intl"

/*
 * Cormorant Garamond solo se usa dentro del panel, que se monta unicamente al
 * abrirlo: con preload:false el navegador no descarga la fuente hasta que el
 * visitante abre el widget (cero coste en la carga inicial / PageSpeed).
 */
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  preload: false,
})

const WHATSAPP_URL = "https://wa.me/34624239394?text=Hola%2C%20tengo%20una%20pregunta%20sobre%20SEMZO%20PRIV%C3%89"
const EMAIL_URL = "mailto:soporte@semzoprive.com?subject=Consulta%20sobre%20membres%C3%ADa%20SEMZO%20PRIV%C3%89"

const NAVY = "#1a1a4b"
const ROSE = "#f4c4cc"

/** Icono de WhatsApp minimalista de trazo (no el logotipo verde oficial). */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M3 21l1.65-4.85A8.5 8.5 0 1 1 8.1 19.4L3 21z" />
      <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.25-2-1-.75.75c-.9-.4-1.6-1.1-2-2l.75-.75-1-2L9 9.5z" />
    </svg>
  )
}

/**
 * Widget de contacto flotante (todas las paginas salvo las landings /lp/*).
 * Montado en app/layout.tsx. Los estilos van en linea porque los valores son
 * exactos de diseno y no forman parte del sistema de tokens.
 */
export default function ContactWidget() {
  const t = useTranslations("contactWidget")
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // Cierra al navegar a otra pagina.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Clic/toque fuera del widget o tecla Escape -> cerrar.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  // Landings de anuncios: sin distracciones (mismo criterio que navbar y footer).
  if (pathname?.startsWith("/lp/")) return null

  return (
    // z-40: por debajo del banner de cookies (z-50) para no tapar sus botones.
    <div
      ref={rootRef}
      className="fixed z-40"
      style={{ right: 24, bottom: "calc(24px + env(safe-area-inset-bottom, 0px))" }}
    >
      {open && (
        <div
          id="contact-widget-panel"
          role="dialog"
          aria-label={t("eyebrow")}
          className="contact-widget-panel absolute right-0"
          style={{
            bottom: 52 + 12,
            width: "min(280px, calc(100vw - 48px))",
            backgroundColor: NAVY,
            borderRadius: 0,
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          }}
        >
          <div style={{ padding: "24px 24px 20px" }}>
            <p
              style={{
                color: ROSE,
                fontSize: 10,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                fontWeight: 500,
                margin: 0,
              }}
            >
              {t("eyebrow")}
            </p>
            <p
              className={cormorant.className}
              style={{ color: "#ffffff", fontSize: 24, lineHeight: 1.2, fontWeight: 400, margin: "10px 0 0" }}
            >
              {t("headline")}
            </p>
          </div>

          <div style={{ height: 1, backgroundColor: ROSE, opacity: 0.2, margin: "0 24px" }} />

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="contact-widget-row"
          >
            <WhatsAppIcon className="h-5 w-5 flex-shrink-0" />
            <span>{t("whatsapp")}</span>
          </a>

          <div style={{ height: 1, backgroundColor: "#ffffff", opacity: 0.1, margin: "0 24px" }} />

          <a href={EMAIL_URL} className="contact-widget-row">
            <Mail className="h-5 w-5 flex-shrink-0" strokeWidth={1.5} aria-hidden="true" />
            <span>{t("email")}</span>
          </a>

          <p
            style={{
              color: ROSE,
              opacity: 0.7,
              fontSize: 10,
              letterSpacing: "0.04em",
              textAlign: "center",
              margin: 0,
              padding: "6px 24px 18px",
            }}
          >
            {t("footer")}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("buttonLabel")}
        aria-expanded={open}
        aria-controls="contact-widget-panel"
        className="flex items-center justify-center transition-transform duration-200 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{
          width: 52,
          height: 52,
          borderRadius: "9999px",
          backgroundColor: NAVY,
          color: ROSE,
          boxShadow: "0 4px 16px rgba(26,26,75,0.25)",
          outlineColor: NAVY,
          border: 0,
          cursor: "pointer",
        }}
      >
        <MessageSquare className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" />
      </button>
    </div>
  )
}

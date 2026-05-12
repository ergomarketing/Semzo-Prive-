"use client"

// Build: 2026-05-11T16:35 (orto + sin payment methods + marquee final)
/*
 * Footer Semzo Prive - rediseno completo.
 *
 * Cambios respecto a version anterior:
 *  - Ortografia corregida en todo el copy (tildes, n con tilde).
 *  - Eliminados los logos de metodos de pago (no aportaban autoridad
 *    y rompian la estetica luxe del footer).
 *  - Restaurado el marquee deslizante en la zona inferior con copy de
 *    autoridad sobre autenticidad y servicio premium.
 *
 * Newsletter conectado al endpoint REAL /api/newsletter/subscribe que
 * guarda los leads en `newsletter_subscriptions` y notifica al admin.
 */

import Link from "next/link"
import { Instagram, Facebook, ArrowRight, Check } from "lucide-react"
import { useState, type FormEvent } from "react"

// ---- Datos estaticos del footer (extraidos para legibilidad) -------------
// Los labels usan tildes y enes correctas para SEO y respeto a la lengua.

const COMPANY_LINKS = [
  { label: "Sobre Nosotros", href: "/#nuestra-vision" },
  { label: "Membresías", href: "/#membresias" },
  { label: "Colección", href: "/catalog" },
  { label: "Cómo Funciona", href: "/proceso" },
  { label: "Magazine", href: "/blog" },
  { label: "Tarjetas Regalo", href: "/gift-cards" },
]

const CUSTOMER_LINKS = [
  { label: "Centro de Soporte", href: "/support" },
  { label: "Preguntas Frecuentes", href: "/support#faq" },
  { label: "Envíos y Devoluciones", href: "/support#envios" },
  { label: "Términos y Condiciones", href: "/legal/terms" },
  { label: "Política de Privacidad", href: "/legal/privacy" },
  { label: "Política de Cookies", href: "/legal/cookies" },
]

const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/semzoprive/",
    icon: Instagram,
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/semzoprive",
    icon: Facebook,
  },
] as const

// Copy del marquee final: copyright largo exacto como en produccion.
// Se construye dinamicamente para que el año siempre sea correcto.
const CURRENT_YEAR = new Date().getFullYear()
const MARQUEE_PHRASES = [
  `© ${CURRENT_YEAR} Semzo Privé — Marca y plataforma de servicio premium de alquiler de bolsos de lujo auténticos y certificados. Todas nuestras piezas son verificadas por expertos para garantizar autenticidad.`,
] as const

// ---- Sub-componente: Newsletter signup -----------------------------------

function NewsletterForm() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setStatus("loading")
    setMessage("")

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setStatus("error")
        setMessage(data.message || "No pudimos suscribirte, inténtalo de nuevo.")
        return
      }

      setStatus("success")
      setMessage(data.message || "Te has unido al club. Pronto recibirás novedades.")
      setEmail("")
    } catch {
      setStatus("error")
      setMessage("Error de conexión. Inténtalo de nuevo en un momento.")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md" noValidate>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <label htmlFor="footer-newsletter-email" className="sr-only">
          Correo electrónico
        </label>
        <div className="flex-1 relative">
          <input
            id="footer-newsletter-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Tu correo electrónico"
            disabled={status === "loading"}
            className="w-full bg-white text-indigo-dark placeholder:text-indigo-dark/50 px-5 py-3.5 pr-14 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-rose-pastel disabled:opacity-60"
            aria-describedby="footer-newsletter-status"
          />
          <button
            type="submit"
            disabled={status === "loading" || !email.trim()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-indigo-dark text-white flex items-center justify-center hover:bg-indigo-dark/85 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Suscribirse al newsletter"
          >
            {status === "success" ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mensaje de estado: accesible (aria-live) y visualmente discreto */}
      <p
        id="footer-newsletter-status"
        role="status"
        aria-live="polite"
        className={`mt-3 text-xs min-h-[1.25rem] ${
          status === "error"
            ? "text-rose-pastel"
            : status === "success"
              ? "text-rose-nude"
              : "text-white/60"
        }`}
      >
        {status === "idle"
          ? "Recibe novedades, lanzamientos y ofertas exclusivas. Sin spam."
          : message}
      </p>
    </form>
  )
}

// ---- Sub-componente: Marquee de autoridad --------------------------------
// Banda deslizante en la zona inferior del footer. Reemplaza a los logos de
// metodos de pago que rompian la estetica luxe. Reutiliza la clase global
// .marquee-track de globals.css que ya pausa al hover y respeta
// prefers-reduced-motion.

function FooterMarquee() {
  // Repetimos 6 veces para garantizar continuidad del scroll sin "saltos".
  const phrases = Array.from({ length: 6 }).flatMap(() => MARQUEE_PHRASES)
  return (
    // Marquee FUERA del bloque indigo, sobre fondo claro (como en produccion).
    // Texto en indigo-dark/40 para legibilidad real sobre blanco manteniendo
    // un look suave. Antes usaba text-rose-nude que es casi blanco (#fff0f3)
    // y resultaba invisible.
    <div
      className="overflow-hidden bg-[#f5f4f2] py-4 border-t border-slate-200"
      aria-label="Copyright Semzo Privé"
    >
      <div className="marquee-track">
        {phrases.map((phrase, i) => (
          <span
            key={i}
            className="text-xs text-slate-500 font-light px-12 whitespace-nowrap"
          >
            {phrase}
          </span>
        ))}
      </div>
    </div>
  )
}

// ---- Footer principal ----------------------------------------------------

export default function Footer() {
  return (
    <footer>
      {/* ====== BLOQUE INDIGO: marca + newsletter + columnas ====== */}
      <div className="bg-indigo-dark text-white">
      {/* Bloque superior: marca + newsletter ------------------------------ */}
      <div className="container mx-auto px-4 pt-16 pb-12">
        <div className="grid md:grid-cols-12 gap-10 md:gap-8">
          {/* Marca + claim */}
          <div className="md:col-span-5">
            <Link
              href="/"
              className="font-serif text-3xl md:text-4xl tracking-wider mb-4 inline-block"
              aria-label="Semzo Privé - Inicio"
            >
              SEMZO <span className="text-rose-pastel">PRIVÉ</span>
            </Link>
            <p className="text-white/75 font-light leading-relaxed max-w-md text-sm md:text-base">
              Accede a bolsos de lujo autenticados con la membresía de Semzo Privé.
              Hermès, Chanel, Louis Vuitton y más marcas exclusivas, sin compromiso
              de compra. Tu armario de ensueño, a un solo paso.
            </p>
          </div>

          {/* Newsletter */}
          <div className="md:col-span-7">
            <h2 className="font-serif text-2xl md:text-3xl mb-4 leading-tight">
              Únete al <span className="text-rose-pastel">club</span>
            </h2>
            <NewsletterForm />
          </div>
        </div>
      </div>

      {/* Separador sutil */}
      <div className="border-t border-white/10" />

      {/* Bloque medio: columnas + redes ---------------------------------- */}
      {/* En movil: 2 cols (Compania | Atencion) + Contacto ancho completo.
       * En desktop: 3 cols iguales. Igual que el patron de Cocoon. */}
      <div className="container mx-auto px-4 py-10 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-8 md:gap-8">
          {/* Columna: Compania */}
          <div className="col-span-1 md:col-span-4">
            <h3 className="font-serif text-xs uppercase tracking-[0.25em] text-white mb-4">
              Compañía
            </h3>
            <ul className="space-y-2.5">
              {COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 hover:text-rose-pastel transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna: Atencion al cliente */}
          <div className="col-span-1 md:col-span-4">
            <h3 className="font-serif text-xs uppercase tracking-[0.25em] text-white mb-4">
              Atención al Cliente
            </h3>
            <ul className="space-y-2.5">
              {CUSTOMER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 hover:text-rose-pastel transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna: Contacto + redes — ancho completo en movil */}
          <div className="col-span-2 md:col-span-4">
            <h3 className="font-serif text-xs uppercase tracking-[0.25em] text-white mb-5">
              Contacto
            </h3>
            <ul className="space-y-3 text-sm text-white/70 mb-6">
              <li>
                <a
                  href="mailto:info@semzoprive.com"
                  className="hover:text-rose-pastel transition-colors"
                >
                  info@semzoprive.com
                </a>
              </li>
              <li>
                <a
                  href="tel:+34624239394"
                  className="hover:text-rose-pastel transition-colors"
                >
                  +34 624 23 9394
                </a>
              </li>
              <li>
                <address className="not-italic leading-relaxed">
                  Av. Bulevar Príncipe Alfonso de Hohenlohe, s/n
                  <br />
                  Marbella, Málaga - España
                </address>
              </li>
            </ul>

            {/* Redes sociales */}
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="h-10 w-10 rounded-full border border-white/20 flex items-center justify-center text-white/80 hover:text-indigo-dark hover:bg-rose-pastel hover:border-rose-pastel transition-all"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </a>
              ))}
              {/* TikTok - SVG inline (no esta en lucide) */}
              <a
                href="https://www.tiktok.com/@semzoprive"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="h-10 w-10 rounded-full border border-white/20 flex items-center justify-center text-white/80 hover:text-indigo-dark hover:bg-rose-pastel hover:border-rose-pastel transition-all"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                </svg>
              </a>
              {/* Pinterest */}
              <a
                href="https://www.pinterest.com/semzoprive"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Pinterest"
                className="h-10 w-10 rounded-full border border-white/20 flex items-center justify-center text-white/80 hover:text-indigo-dark hover:bg-rose-pastel hover:border-rose-pastel transition-all"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 0a12 12 0 00-4.37 23.17c-.06-.56-.12-1.42 0-2 .12-.56.72-3.07.72-3.07a4.41 4.41 0 01-.36-1.84c0-1.73 1-3 2.26-3a1.56 1.56 0 011.58 1.76c0 1.07-.68 2.67-1 4.15a1.81 1.81 0 001.83 2.25c2.2 0 3.89-2.32 3.89-5.66a4.75 4.75 0 00-5-4.89 5.26 5.26 0 00-5.47 5.27 4.76 4.76 0 001 2.87.34.34 0 01.08.33c-.09.37-.29 1.16-.33 1.32a.25.25 0 01-.36.18c-1.36-.63-2.21-2.61-2.21-4.21 0-3.42 2.49-6.57 7.18-6.57 3.77 0 6.7 2.69 6.7 6.28 0 3.75-2.36 6.76-5.64 6.76a2.91 2.91 0 01-2.49-1.24l-.68 2.59a11 11 0 01-1.26 2.67A12 12 0 1012 0z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      </div>
      {/* ====== FIN BLOQUE INDIGO ====== */}

      {/* Marquee con copyright largo — cierra la web fuera del bloque indigo */}
      <FooterMarquee />
    </footer>
  )
}

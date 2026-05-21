"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect } from "react"
import { ArrowRight, Check, ShieldCheck, Truck, Repeat, Sparkles } from "lucide-react"

/**
 * Landing exclusiva para Google Ads.
 * - Sin header/footer principal (cero distracciones, regla de Ads).
 * - Un unico CTA hero + cards de membresia + CTA final.
 * - Imagenes editoriales reales del proyecto, paleta Semzo (indigo-dark + rose-nude).
 * - noindex/nofollow se aplica en page.tsx (metadata).
 * - Eventos GA4 por dataLayer (compatibles con la implementacion ya existente del sitio).
 */

const memberships = [
  {
    id: "petite",
    name: "Petite",
    price: "19,99€",
    period: "/mes",
    tagline: "Acceso flexible con pases sueltos",
    description: "Hasta 4 pases mensuales. Tu puerta de entrada al universo Semzo.",
    image: "/images/membership-petite.jpg",
    href: "/signup?plan=petite&utm_source=google&utm_medium=cpc&utm_campaign=lp_membresia",
    highlight: false,
  },
  {
    id: "essentiel",
    name: "Essentiel",
    price: "59€",
    period: "/mes",
    tagline: "Un bolso al mes",
    description: "Iconos como Louis Vuitton Speedy, Prada Saffiano o Dior Saddle.",
    image: "/images/membership-essentiel.jpeg",
    href: "/signup?plan=essentiel&utm_source=google&utm_medium=cpc&utm_campaign=lp_membresia",
    highlight: false,
  },
  {
    id: "signature",
    name: "Signature",
    price: "129€",
    period: "/mes",
    tagline: "Marcas premium cada mes",
    description: "Chanel WOC, Fendi Peekaboo, Loewe Puzzle. La curacion mas codiciada.",
    image: "/images/membership-signature.jpg",
    href: "/signup?plan=signature&utm_source=google&utm_medium=cpc&utm_campaign=lp_membresia",
    highlight: true,
  },
  {
    id: "prive",
    name: "Prive",
    price: "279€",
    period: "/mes",
    tagline: "La coleccion mas exclusiva",
    description: "Hermes, Chanel Classic Flap, Dior Lady. Acceso prioritario y concierge.",
    image: "/images/membership-prive.jpg",
    href: "/signup?plan=prive&utm_source=google&utm_medium=cpc&utm_campaign=lp_membresia",
    highlight: false,
  },
]

const trustItems = [
  { icon: ShieldCheck, label: "100% autenticos" },
  { icon: Repeat, label: "Cambio flexible" },
  { icon: Truck, label: "Envio gratuito" },
  { icon: Sparkles, label: "Opcion de adquisicion" },
]

const steps = [
  { n: "01", title: "Elige tu membresia", text: "4 niveles segun el lujo que buscas." },
  { n: "02", title: "Recibe tu bolso", text: "En 24-48h, perfectamente cuidado." },
  { n: "03", title: "Cambialo o hazlo tuyo", text: "Sin compromiso. Tu decides." },
]

const testimonials = [
  {
    quote: "Llevo seis meses y ya he disfrutado tres bolsos que jamas me habria comprado. Una experiencia increible.",
    author: "Lucia M., Madrid",
  },
  {
    quote: "El servicio es impecable. Cambio mi bolso cada mes y siempre llega como nuevo.",
    author: "Carmen R., Barcelona",
  },
]

function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return
  const w = window as unknown as { dataLayer?: unknown[] }
  w.dataLayer = w.dataLayer || []
  w.dataLayer.push({ event: name, ...params })
}

export default function LandingMembresia() {
  useEffect(() => {
    trackEvent("view_landing_lp_membresia")
  }, [])

  return (
    <main className="min-h-screen bg-rose-nude font-serif text-indigo-dark">
      {/* Barra superior minima: solo logo + un CTA secundario */}
      <header className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-6 py-5 md:px-10">
        <Link href="/" className="text-sm tracking-[0.3em] text-white">
          SEMZO PRIVE
        </Link>
        <Link
          href="#membresias"
          onClick={() => trackEvent("cta_header_click")}
          className="hidden text-xs tracking-[0.25em] text-white/90 underline-offset-4 hover:underline md:inline"
        >
          VER MEMBRESIAS
        </Link>
      </header>

      {/* HERO */}
      <section className="relative h-[90vh] min-h-[600px] w-full overflow-hidden">
        <Image
          src="/images/prada-hero-street.jpeg"
          alt="Mujer con bolso Prada en escena editorial"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/60" />

        <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col items-start justify-end px-6 pb-20 md:px-10 md:pb-28">
          <p className="mb-4 text-xs tracking-[0.4em] text-white/80 md:text-sm">MEMBRESIA DE BOLSOS DE LUJO</p>
          <h1 className="max-w-3xl text-balance font-serif text-4xl leading-[1.05] text-white md:text-6xl lg:text-7xl">
            Bolsos iconicos.
            <br />
            <span className="italic text-rose-pastel">Sin comprarlos.</span>
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-white/90 md:text-lg">
            Membresia mensual desde 59€. Cambialos cuando quieras. Hazlos tuyos si te enamoras.
          </p>

          <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <a
              href="#membresias"
              onClick={() => trackEvent("cta_hero_click")}
              className="group inline-flex items-center gap-2 bg-white px-8 py-4 text-sm tracking-[0.2em] text-indigo-dark transition hover:bg-rose-pastel"
            >
              DESCUBRIR MEMBRESIAS
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </a>
            <Link
              href="/catalog"
              onClick={() => trackEvent("cta_hero_secondary_click")}
              className="text-sm tracking-[0.2em] text-white underline-offset-4 hover:underline"
            >
              Ver coleccion
            </Link>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-y border-indigo-dark/10 bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-8 md:grid-cols-4 md:px-10">
          {trustItems.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <item.icon className="h-5 w-5 text-indigo-dark" strokeWidth={1.4} />
              <span className="text-sm tracking-wide text-indigo-dark/80">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="bg-rose-nude py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs tracking-[0.4em] text-indigo-dark/60">EL PROCESO</p>
            <h2 className="text-balance font-serif text-3xl leading-tight md:text-5xl">
              Tres pasos para acceder al lujo.
            </h2>
          </div>

          <div className="grid gap-12 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.n} className="border-t border-indigo-dark/20 pt-6">
                <p className="mb-4 font-serif text-5xl text-indigo-dark/80 md:text-6xl">{step.n}</p>
                <h3 className="mb-2 font-serif text-xl md:text-2xl">{step.title}</h3>
                <p className="text-sm leading-relaxed text-indigo-dark/70">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MEMBRESIAS */}
      <section id="membresias" className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs tracking-[0.4em] text-indigo-dark/60">CUATRO NIVELES</p>
            <h2 className="text-balance font-serif text-3xl leading-tight md:text-5xl">
              Elige tu membresia.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-indigo-dark/70 md:text-base">
              Desde el acceso flexible Petite hasta la coleccion mas exclusiva Prive. Cambia, pausa o cancela cuando
              quieras.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {memberships.map((m) => (
              <article
                key={m.id}
                className={`group flex flex-col overflow-hidden border ${
                  m.highlight ? "border-indigo-dark" : "border-indigo-dark/15"
                } bg-white transition hover:shadow-xl`}
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-rose-nude">
                  <Image
                    src={m.image || "/placeholder.svg"}
                    alt={`Membresia ${m.name}`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />
                  {m.highlight ? (
                    <span className="absolute right-4 top-4 bg-indigo-dark px-3 py-1 text-[10px] tracking-[0.3em] text-white">
                      MAS ELEGIDA
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-serif text-2xl">{m.name}</h3>
                  <p className="mt-1 text-xs tracking-[0.2em] text-indigo-dark/60">{m.tagline.toUpperCase()}</p>

                  <div className="my-5 flex items-baseline gap-1">
                    <span className="font-serif text-3xl">{m.price}</span>
                    <span className="text-sm text-indigo-dark/60">{m.period}</span>
                  </div>

                  <p className="mb-6 flex-1 text-sm leading-relaxed text-indigo-dark/75">{m.description}</p>

                  <Link
                    href={m.href}
                    onClick={() => trackEvent("cta_membership_click", { plan: m.id })}
                    className={`group/btn inline-flex items-center justify-center gap-2 px-6 py-3 text-xs tracking-[0.25em] transition ${
                      m.highlight
                        ? "bg-indigo-dark text-white hover:bg-indigo-dark/90"
                        : "border border-indigo-dark text-indigo-dark hover:bg-indigo-dark hover:text-white"
                    }`}
                  >
                    ELEGIR {m.name.toUpperCase()}
                    <ArrowRight className="h-3.5 w-3.5 transition group-hover/btn:translate-x-1" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL + TESTIMONIOS */}
      <section className="relative overflow-hidden bg-indigo-dark py-20 text-white md:py-28">
        <div className="absolute inset-0 opacity-20">
          <Image src="/images/luxury-closet-hero.jpg" alt="" fill sizes="100vw" className="object-cover" />
        </div>
        <div className="absolute inset-0 bg-indigo-dark/70" />

        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center md:px-10">
          <p className="mb-4 text-xs tracking-[0.4em] text-rose-pastel">VOCES DE LA COMUNIDAD</p>

          <div className="mx-auto mb-12 grid max-w-4xl gap-8 md:grid-cols-2">
            {testimonials.map((t) => (
              <blockquote key={t.author} className="text-pretty">
                <p className="font-serif text-lg italic leading-relaxed md:text-xl">&ldquo;{t.quote}&rdquo;</p>
                <footer className="mt-4 text-xs tracking-[0.25em] text-rose-pastel">— {t.author}</footer>
              </blockquote>
            ))}
          </div>

          <div className="mx-auto h-px w-24 bg-white/20" />

          <h2 className="mt-12 text-balance font-serif text-3xl leading-tight md:text-5xl">
            Empieza tu acceso al lujo.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-sm leading-relaxed text-white/80 md:text-base">
            Cambia de bolso cuando te apetezca. Hazlo tuyo cuando estes lista. Sin compromiso.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-6">
            <a
              href="#membresias"
              onClick={() => trackEvent("cta_final_click")}
              className="group inline-flex items-center gap-2 bg-white px-10 py-4 text-sm tracking-[0.25em] text-indigo-dark transition hover:bg-rose-pastel"
            >
              ELEGIR MI MEMBRESIA
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </a>
          </div>

          <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/70">
            <li className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5" /> Sin permanencia
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5" /> Cancela cuando quieras
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5" /> Pago seguro
            </li>
          </ul>
        </div>
      </section>

      {/* Footer minimo de landing */}
      <footer className="border-t border-indigo-dark/10 bg-rose-nude px-6 py-6 md:px-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs text-indigo-dark/60 md:flex-row">
          <p>© {new Date().getFullYear()} Semzo Prive. Todos los derechos reservados.</p>
          <div className="flex items-center gap-5">
            <Link href="/legal/privacy" className="hover:text-indigo-dark">
              Privacidad
            </Link>
            <Link href="/legal/terms" className="hover:text-indigo-dark">
              Terminos
            </Link>
            <Link href="/support" className="hover:text-indigo-dark">
              Contacto
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}

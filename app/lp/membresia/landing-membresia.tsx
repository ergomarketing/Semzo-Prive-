"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect } from "react"
import { ArrowRight } from "lucide-react"

/**
 * Landing exclusiva para Google Ads (/lp/membresia).
 * Estructura compacta: hero editorial fullscreen, trust, proceso, membresias, CTA final.
 */

const memberships = [
  {
    id: "petite",
    name: "Petite",
    price: "19,99€",
    period: "/mes",
    tagline: "Pases sueltos",
    image: "/images/membership-petite.svg",
    href: "/signup?plan=petite&utm_source=google&utm_medium=cpc&utm_campaign=lp_membresia",
    highlight: false,
  },
  {
    id: "essentiel",
    name: "Essentiel",
    price: "59€",
    period: "/mes",
    tagline: "Un bolso al mes",
    image: "/images/membership-essentiel.jpeg",
    href: "/signup?plan=essentiel&utm_source=google&utm_medium=cpc&utm_campaign=lp_membresia",
    highlight: false,
  },
  {
    id: "signature",
    name: "Signature",
    price: "129€",
    period: "/mes",
    tagline: "Marcas premium",
    image: "/images/chanel-signature.jpeg",
    href: "/signup?plan=signature&utm_source=google&utm_medium=cpc&utm_campaign=lp_membresia",
    highlight: true,
  },
  {
    id: "prive",
    name: "Prive",
    price: "279€",
    period: "/mes",
    tagline: "Coleccion exclusiva",
    image: "/images/membership-prive.jpg",
    href: "/signup?plan=prive&utm_source=google&utm_medium=cpc&utm_campaign=lp_membresia",
    highlight: false,
  },
]

const trustItems = ["100% autenticos", "Cambio flexible", "Envio gratuito", "Opcion de adquisicion"]

const steps = [
  { n: "1", title: "Elige tu plan", text: "4 niveles, sin permanencia." },
  { n: "2", title: "Recibe tu bolso", text: "En 24-48h en tu casa." },
  { n: "3", title: "Cambia o adquiere", text: "Cuando quieras, sin compromiso." },
]

const testimonials = [
  {
    quote: "Llevo seis meses y ya he disfrutado tres bolsos distintos. Una experiencia increible.",
    author: "LUCIA M., MADRID",
  },
  {
    quote: "El acceso a marcas que nunca compraria, sin compromiso. Es justo lo que buscaba.",
    author: "ANA P., BARCELONA",
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
      {/* Header minimo */}
      <header className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-6 py-5 md:px-10">
        <Link href="/" className="font-serif text-base tracking-[0.3em] text-white drop-shadow-md">
          SEMZO PRIVE
        </Link>
        <Link
          href="#membresias"
          onClick={() => trackEvent("cta_header_click")}
          className="hidden text-xs tracking-[0.25em] text-white/90 underline-offset-4 drop-shadow-md hover:underline md:inline"
        >
          VER MEMBRESIAS
        </Link>
      </header>

      {/* HERO - editorial fullscreen, compacto en altura (75vh en mobile, 85vh desktop) */}
      <section className="relative flex min-h-[75svh] w-full items-end overflow-hidden md:min-h-[85svh]">
        <Image
          src="/images/hermes-prive.jpeg"
          alt="Editorial Semzo Prive - bolso Hermes burgundy"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[50%_50%]"
        />
        {/* Overlay neutro plano para legibilidad */}
        <div className="absolute inset-0 bg-black/35" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-14 md:px-10 md:pb-20">
          <div className="max-w-2xl text-white">
            <p className="mb-4 text-[10px] tracking-[0.5em] text-white/85 md:text-xs">MEMBRESIA DE BOLSOS DE LUJO</p>

            <h1 className="mb-5 text-balance font-serif text-5xl leading-[0.95] tracking-tight md:text-6xl lg:text-7xl">
              Bolsos iconicos.
              <br />
              <span className="italic text-rose-pastel">Sin comprarlos.</span>
            </h1>

            <p className="mb-8 max-w-lg text-pretty text-base leading-relaxed text-white/90 md:text-lg">
              Membresia mensual desde 59€. Cambialos cuando quieras. Hazlos tuyos si te enamoras.
            </p>

            <a
              href="#membresias"
              onClick={() => trackEvent("cta_hero_click")}
              className="group inline-flex items-center gap-2 bg-white px-10 py-4 text-xs tracking-[0.3em] text-indigo-dark transition hover:bg-rose-pastel"
            >
              ACCEDER A LAS MEMBRESIAS
              <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
            </a>
          </div>
        </div>
      </section>

      {/* TRUST BAR - tipografica, sin iconos */}
      <section className="border-y border-indigo-dark/10 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-6 py-5 text-center md:px-10">
          {trustItems.map((label, i) => (
            <span key={label} className="flex items-center gap-x-8 text-[11px] tracking-[0.25em] text-indigo-dark/70">
              {label.toUpperCase()}
              {i < trustItems.length - 1 ? <span className="hidden text-indigo-dark/30 md:inline">·</span> : null}
            </span>
          ))}
        </div>
      </section>

      {/* COMO FUNCIONA - ultra compacto */}
      <section className="bg-white pb-10 pt-12 md:pb-14 md:pt-16">
        <div className="mx-auto max-w-5xl px-6 md:px-10">
          <div className="mb-8 text-center">
            <p className="mb-2 text-[10px] tracking-[0.5em] text-indigo-dark/60 md:text-xs">EL PROCESO</p>
            <h2 className="text-balance font-serif text-2xl leading-tight md:text-3xl">
              Tres pasos hasta tu <span className="italic">primer bolso</span>.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3 md:gap-10">
            {steps.map((step) => (
              <div key={step.n} className="flex items-baseline gap-4 md:block md:text-center">
                <p className="font-serif text-4xl leading-none text-indigo-dark/40 md:mb-3 md:text-5xl">0{step.n}</p>
                <div>
                  <h3 className="font-serif text-base md:text-lg">{step.title}</h3>
                  <p className="text-xs text-indigo-dark/65 md:text-sm">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MEMBRESIAS */}
      <section id="membresias" className="bg-rose-nude py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="mb-8 text-center md:mb-12">
            <p className="mb-2 text-[10px] tracking-[0.5em] text-indigo-dark/60 md:text-xs">CUATRO NIVELES</p>
            <h2 className="text-balance font-serif text-3xl leading-tight md:text-5xl">
              Elige tu <span className="italic">membresia</span>.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {memberships.map((m) => (
              <Link
                key={m.id}
                href={m.href}
                onClick={() => trackEvent("cta_membership_click", { plan: m.id })}
                className={`group flex flex-col overflow-hidden border bg-white transition hover:shadow-xl ${
                  m.highlight ? "border-indigo-dark shadow-lg" : "border-indigo-dark/15"
                }`}
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-rose-nude">
                  <Image
                    src={m.image || "/placeholder.svg"}
                    alt={`Membresia ${m.name}`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover object-center transition duration-700 group-hover:scale-105"
                  />
                  {m.highlight ? (
                    <span className="absolute right-3 top-3 bg-indigo-dark px-3 py-1 text-[9px] tracking-[0.3em] text-white">
                      MAS ELEGIDA
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-serif text-2xl">{m.name}</h3>
                  <p className="mt-1 text-[10px] tracking-[0.25em] text-indigo-dark/60">{m.tagline.toUpperCase()}</p>

                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="font-serif text-3xl">{m.price}</span>
                    <span className="text-sm text-indigo-dark/60">{m.period}</span>
                  </div>

                  <span
                    className={`mt-4 inline-flex items-center justify-center gap-2 px-4 py-3 text-[10px] tracking-[0.3em] transition ${
                      m.highlight
                        ? "bg-indigo-dark text-white group-hover:bg-indigo-dark/85"
                        : "border border-indigo-dark text-indigo-dark group-hover:bg-indigo-dark group-hover:text-white"
                    }`}
                  >
                    ELEGIR
                    <ArrowRight className="h-3 w-3 transition group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL con 2 testimonios integrados */}
      <section className="relative overflow-hidden bg-indigo-dark py-16 text-white md:py-20">
        <div className="absolute inset-0 opacity-15">
          <Image src="/images/luxury-closet-hero.jpg" alt="" fill sizes="100vw" className="object-cover" />
        </div>
        <div className="absolute inset-0 bg-indigo-dark/60" />

        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center md:px-10">
          <div className="mb-10 grid gap-6 md:mb-12 md:grid-cols-2 md:gap-10">
            {testimonials.map((t) => (
              <blockquote key={t.author}>
                <p className="font-serif text-base italic leading-relaxed text-white md:text-lg">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <footer className="mt-3 text-[10px] tracking-[0.3em] text-white/70">— {t.author}</footer>
              </blockquote>
            ))}
          </div>

          <div className="mx-auto mb-10 h-px w-16 bg-white/30" />

          <h2 className="text-balance font-serif text-3xl leading-tight md:text-4xl">
            Empieza tu acceso al <span className="italic">lujo</span>.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-pretty text-sm text-white/80 md:text-base">
            Sin permanencia. Cancela cuando quieras.
          </p>

          <a
            href="#membresias"
            onClick={() => trackEvent("cta_final_click")}
            className="group mt-8 inline-flex items-center gap-2 bg-white px-12 py-4 text-xs tracking-[0.3em] text-indigo-dark transition hover:bg-rose-pastel"
          >
            ELEGIR MI MEMBRESIA
            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
          </a>
        </div>
      </section>

      {/* Footer minimo */}
      <footer className="border-t border-indigo-dark/10 bg-rose-nude px-6 py-5 md:px-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs text-indigo-dark/60 md:flex-row">
          <p>© 2026 Semzo Prive. Todos los derechos reservados.</p>
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

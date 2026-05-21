"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect } from "react"
import { ArrowRight, ShieldCheck, Truck, Repeat, Sparkles } from "lucide-react"

/**
 * Landing exclusiva para Google Ads - Version 2.
 * Aprendizajes de Cocoon: hero con producto protagonista, deseo antes que plan,
 * compactacion total (cero scroll innecesario), un CTA por seccion.
 */

const bagShowcase = [
  {
    name: "Chanel",
    model: "Classic Flap",
    image: "/images/chanel-classic-flap-front.jpeg",
    tier: "PRIVE",
  },
  {
    name: "Dior",
    model: "Lady Dior",
    image: "/images/dior-lady-bag.jpg",
    tier: "SIGNATURE",
  },
  {
    name: "Fendi",
    model: "Peekaboo",
    image: "/images/fendi-peekaboo-front.jpeg",
    tier: "SIGNATURE",
  },
  {
    name: "Gucci",
    model: "Jackie 1961",
    image: "/images/gucci-jackie-front.jpeg",
    tier: "ESSENTIEL",
  },
]

const memberships = [
  {
    id: "petite",
    name: "Petite",
    price: "19,99€",
    period: "/mes",
    tagline: "Pases sueltos",
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
    image: "/images/membership-signature.jpg",
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

const trustItems = [
  { icon: ShieldCheck, label: "100% autenticos" },
  { icon: Repeat, label: "Cambio flexible" },
  { icon: Truck, label: "Envio gratuito" },
  { icon: Sparkles, label: "Opcion de adquisicion" },
]

const steps = [
  { n: "1", title: "Elige tu plan", text: "4 niveles, sin permanencia." },
  { n: "2", title: "Recibe tu bolso", text: "En 24-48h en tu casa." },
  { n: "3", title: "Cambia o adquiere", text: "Cuando quieras, sin compromiso." },
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
        <Link href="/" className="font-serif text-base tracking-[0.3em] text-indigo-dark">
          SEMZO PRIVE
        </Link>
        <Link
          href="#membresias"
          onClick={() => trackEvent("cta_header_click")}
          className="hidden text-xs tracking-[0.25em] text-indigo-dark/80 underline-offset-4 hover:underline md:inline"
        >
          VER MEMBRESIAS
        </Link>
      </header>

      {/* HERO - editorial street style en grid 2 columnas, contenido (no fullscreen) */}
      <section className="relative bg-rose-nude pt-24 md:pt-28">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 pb-16 md:grid-cols-12 md:gap-12 md:px-10 md:pb-20">
          {/* Texto */}
          <div className="md:col-span-6 lg:col-span-5">
            <p className="mb-5 text-[10px] tracking-[0.5em] text-indigo-dark/60 md:text-xs">
              MEMBRESIA DE BOLSOS DE LUJO
            </p>

            <h1 className="mb-6 text-balance font-serif text-5xl leading-[0.95] tracking-tight md:text-6xl lg:text-7xl">
              Bolsos iconicos.
              <br />
              <span className="italic text-indigo-dark/70">Sin comprarlos.</span>
            </h1>

            <p className="mb-8 max-w-md text-pretty text-base leading-relaxed text-indigo-dark/75 md:text-lg">
              Membresia mensual desde 59€. Cambialos cuando quieras. Hazlos tuyos si te enamoras.
            </p>

            <a
              href="#membresias"
              onClick={() => trackEvent("cta_hero_click")}
              className="group inline-flex items-center gap-2 bg-indigo-dark px-10 py-4 text-xs tracking-[0.3em] text-white transition hover:bg-indigo-dark/85"
            >
              ACCEDER A LAS MEMBRESIAS
              <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
            </a>
          </div>

          {/* Imagen editorial contenida (no fullscreen) */}
          <div className="md:col-span-6 lg:col-span-7">
            <div className="relative aspect-[4/5] w-full overflow-hidden md:aspect-[4/5] lg:aspect-[5/6]">
              <Image
                src="/images/prada-hero-street.jpeg"
                alt="Editorial Semzo Prive - bolsos de lujo en alquiler"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 55vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-y border-indigo-dark/10 bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-7 md:grid-cols-4 md:px-10">
          {trustItems.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <item.icon className="h-5 w-5 text-indigo-dark" strokeWidth={1.4} />
              <span className="text-sm tracking-wide text-indigo-dark/80">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* BOLSOS DESTACADOS - despertar deseo antes del plan */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="mb-10 text-center md:mb-14">
            <h2 className="text-balance font-serif text-3xl leading-tight md:text-5xl">
              Tu proximo bolso te <span className="italic">esta esperando</span>.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-pretty text-sm text-indigo-dark/70 md:text-base">
              Chanel, Dior, Hermes, Fendi y mas. Acceso inmediato con tu membresia.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {bagShowcase.map((bag) => (
              <Link
                key={bag.model}
                href="/catalog"
                onClick={() => trackEvent("cta_bag_showcase_click", { bag: bag.model })}
                className="group relative flex aspect-square flex-col items-center justify-end overflow-hidden bg-rose-nude p-4"
              >
                <div className="absolute inset-0">
                  <Image
                    src={bag.image || "/placeholder.svg"}
                    alt={`${bag.name} ${bag.model}`}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="relative z-10 w-full bg-white/85 p-3 backdrop-blur-sm">
                  <p className="text-xs tracking-[0.2em] text-indigo-dark/60">{bag.tier}</p>
                  <p className="font-serif text-base text-indigo-dark md:text-lg">
                    {bag.name} <span className="italic text-indigo-dark/70">{bag.model}</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* Pasos compactos integrados */}
          <div className="mt-16 grid gap-8 border-t border-indigo-dark/10 pt-12 md:grid-cols-3 md:gap-12 md:pt-16">
            {steps.map((step) => (
              <div key={step.n} className="text-center">
                <p className="mb-3 font-serif text-6xl text-indigo-dark md:text-7xl">{step.n}</p>
                <h3 className="mb-2 font-serif text-lg md:text-xl">{step.title}</h3>
                <p className="text-sm text-indigo-dark/70">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MEMBRESIAS */}
      <section id="membresias" className="bg-rose-nude py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="mb-10 text-center md:mb-14">
            <p className="mb-3 text-[10px] tracking-[0.5em] text-indigo-dark/60 md:text-xs">CUATRO NIVELES</p>
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
                    className="object-cover transition duration-700 group-hover:scale-105"
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

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="font-serif text-3xl">{m.price}</span>
                    <span className="text-sm text-indigo-dark/60">{m.period}</span>
                  </div>

                  <span
                    className={`mt-5 inline-flex items-center justify-center gap-2 px-4 py-3 text-[10px] tracking-[0.3em] transition ${
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

      {/* CTA FINAL con testimonio integrado */}
      <section className="relative overflow-hidden bg-indigo-dark py-20 text-white md:py-24">
        <div className="absolute inset-0 opacity-15">
          <Image src="/images/luxury-closet-hero.jpg" alt="" fill sizes="100vw" className="object-cover" />
        </div>
        <div className="absolute inset-0 bg-indigo-dark/60" />

        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center md:px-10">
          <blockquote className="mb-12">
            <p className="font-serif text-xl italic leading-relaxed text-rose-pastel md:text-2xl">
              &ldquo;Llevo seis meses y ya he disfrutado tres bolsos que jamas me habria comprado. Una experiencia
              increible.&rdquo;
            </p>
            <footer className="mt-4 text-[10px] tracking-[0.3em] text-white/70">— LUCIA M., MADRID</footer>
          </blockquote>

          <div className="mx-auto mb-12 h-px w-16 bg-white/30" />

          <h2 className="text-balance font-serif text-3xl leading-tight md:text-5xl">
            Empieza tu acceso al <span className="italic">lujo</span>.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-pretty text-sm text-white/80 md:text-base">
            Sin permanencia. Cancela cuando quieras.
          </p>

          <a
            href="#membresias"
            onClick={() => trackEvent("cta_final_click")}
            className="group mt-10 inline-flex items-center gap-2 bg-white px-12 py-4 text-xs tracking-[0.3em] text-indigo-dark transition hover:bg-rose-pastel"
          >
            ELEGIR MI MEMBRESIA
            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
          </a>
        </div>
      </section>

      {/* Footer minimo */}
      <footer className="border-t border-indigo-dark/10 bg-rose-nude px-6 py-5 md:px-10">
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

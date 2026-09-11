"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, Check, Copy } from "lucide-react"

const CODIGO_DESCUENTO = "PRIVE50"

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
    price: "149€",
    period: "/mes",
    tagline: "Marcas premium",
    image: "/images/membership-signature.svg",
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
  { n: "1", title: "Elige tu plan", text: "Sin permanencia. Sin letra pequeña. Cancela cuando quieras." },
  { n: "2", title: "Recibe tu bolso", text: "Autenticado, preparado y en tu puerta en 24-48 horas." },
  { n: "3", title: "Cambia o quédate con él", text: "Cuando sientas que quieres otro, lo cambiamos. Si te enamoras, es tuyo." },
]

const testimonials = [
  {
    quote:
      "Llevaba años queriendo un Chanel y nunca me decidía por el precio. Con SEMZO PRIVÉ lo llevé a una boda en junio y a una cena de trabajo en julio. Sin gastarlo todo de golpe.",
    author: "Lucía M., Madrid",
    detail: "Socia desde enero 2026",
  },
  {
    quote:
      "Lo que más me sorprendió fue la calidad del embalaje y lo rápido que llegó. En menos de 24 horas tenía mi Dior en casa. Lo repetí tres veces en dos meses.",
    author: "Ana P., Barcelona",
    detail: "Plan Signature",
  },
  {
    quote:
      "Nunca pensé que podría llevar un Louis Vuitton a diario. Ahora lo cambio cada mes y mis amigas me preguntan dónde los compro.",
    author: "Carmen R., Madrid",
    detail: "Socia desde marzo 2026",
  },
]

function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return
  const w = window as unknown as { dataLayer?: unknown[] }
  w.dataLayer = w.dataLayer || []
  w.dataLayer.push({ event: name, ...params })
}

export default function LandingMembresia() {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    trackEvent("view_landing_lp_membresia")
  }, [])

  const handleCopyCode = () => {
    navigator.clipboard.writeText(CODIGO_DESCUENTO)
    setCopied(true)
    trackEvent("copy_discount_code", { code: CODIGO_DESCUENTO })
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="min-h-screen bg-rose-nude font-serif text-indigo-dark">
      {/* Header minimo: solo el logo, sin links ni navegacion.
          Pagina de conversion para Google Ads — cero distracciones que saquen
          a la visitante del embudo antes del CTA. */}
      <header className="absolute left-0 right-0 top-0 z-20 flex items-center justify-center px-6 py-5 md:px-10">
        <span className="font-serif text-base tracking-[0.3em] text-white drop-shadow-md">SEMZO PRIVE</span>
      </header>

      {/* HERO - imagen a ancho completo (object-cover), sin desenfoque.
          El punto focal 50% 35% mantiene visible modelo + bolso al recortar en pantallas anchas. */}
      {/* HERO: la imagen original es 1199x1473px (retrato).
          Se muestra con su aspect-ratio nativo — sin recortar, sin desenfoque.
          En mobile ocupa el 100% del ancho. En desktop se limita a 700px centrado
          para que quepa en pantalla completa mostrando modelo+bolso+jeans. */}
      <section className="w-full bg-indigo-dark">
        <div className="relative mx-auto w-full" style={{aspectRatio: "1199/1473"}}>
          <Image
            src="/images/hermes-prive.jpeg"
            alt="Editorial Semzo Prive - bolso Hermes burgundy"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 700px"
            className="object-cover object-top md:object-contain md:object-top"
          />
          {/* Overlay para legibilidad del texto */}
          <div className="absolute inset-0 bg-black/35" />

          <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-10 md:px-10 md:pb-14">
            <div className="text-white">
              <p className="mb-4 text-[10px] tracking-[0.5em] text-white/85 md:text-xs">
                MEMBRESIA DE BOLSOS DE LUJO
              </p>

              <h1 className="mb-5 text-balance font-serif text-5xl leading-[0.95] tracking-tight md:text-6xl">
                El armario de lujo que siempre quisiste.
                <br />
                <span className="italic text-rose-pastel">Sin comprarlo.</span>
              </h1>

              <p className="mb-8 max-w-lg text-pretty text-base leading-relaxed text-white/90 md:text-lg">
                Accede a Chanel, Louis Vuitton, Dior y Loewe desde 59€/mes. Cambia cuando quieras. Hazlos tuyos si te
                enamoras.
              </p>

              <a
                href="#membresias"
                onClick={() => trackEvent("cta_hero_click")}
                className="group inline-flex items-center gap-2 bg-white px-10 py-4 text-xs tracking-[0.3em] text-indigo-dark transition hover:bg-rose-pastel"
              >
                ELEGIR MI MEMBRESÍA
                <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
              </a>
            </div>
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
              De la duda a tu primer bolso en <span className="italic">48 horas</span>.
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

          {/* Banner codigo descuento 50% primera suscripcion */}
          <div className="mx-auto mb-10 max-w-2xl border border-indigo-dark/20 bg-white p-6 text-center md:mb-12 md:p-8">
            <p className="mb-3 text-[10px] tracking-[0.4em] text-indigo-dark/60 md:text-xs">
              OFERTA DE BIENVENIDA
            </p>
            <p className="mb-3 font-serif text-2xl leading-tight md:text-3xl">
              Tu primera mensualidad al <span className="italic">50%</span> con el código PRIVE50
            </p>
            <p className="mb-4 text-sm text-indigo-dark/70">
              No es una promesa. Es tuyo desde hoy. Solo para nuevas socias. Válido esta semana.
            </p>
            <div className="mx-auto flex max-w-xs items-center justify-center gap-3">
              <span className="flex-1 border border-dashed border-indigo-dark/40 bg-rose-nude px-4 py-3 font-serif text-xl font-bold tracking-[0.2em] text-indigo-dark">
                {CODIGO_DESCUENTO}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                aria-label="Copiar codigo de descuento"
                className="flex h-12 w-12 items-center justify-center border border-indigo-dark/30 transition hover:bg-indigo-dark hover:text-white"
              >
                {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
            <p className="mt-4 text-xs text-indigo-dark/60">Introduce el código durante el proceso de pago.</p>
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

      {/* CTA FINAL con 3 testimonios integrados */}
      <section className="relative overflow-hidden bg-indigo-dark py-16 text-white md:py-20">
        <div className="absolute inset-0 opacity-15">
          <Image src="/images/luxury-closet-hero.jpg" alt="" fill sizes="100vw" className="object-cover" />
        </div>
        <div className="absolute inset-0 bg-indigo-dark/60" />

        <div className="relative z-10 mx-auto max-w-6xl px-6 text-center md:px-10">
          <div className="mb-10 grid gap-8 md:mb-12 md:grid-cols-3 md:gap-8">
            {testimonials.map((t) => (
              <blockquote key={t.author}>
                <p className="font-serif text-base italic leading-relaxed text-white md:text-lg">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <footer className="mt-3 text-[10px] uppercase tracking-[0.25em] text-white/70">
                  — {t.author} · {t.detail}
                </footer>
              </blockquote>
            ))}
          </div>

          <div className="mx-auto mb-10 h-px w-16 bg-white/30" />

          <h2 className="text-balance font-serif text-3xl leading-tight md:text-4xl">
            El lujo no es lo que posees. <span className="italic">Es lo que experimentas.</span>
          </h2>
          <p className="mx-auto mt-3 max-w-md text-pretty text-sm text-white/80 md:text-base">
            Sin permanencia. Sin riesgo. Solo tú y el bolso que siempre quisiste llevar.
          </p>

          <a
            href="#membresias"
            onClick={() => trackEvent("cta_final_click")}
            className="group mt-8 inline-flex items-center gap-2 bg-white px-12 py-4 text-xs tracking-[0.3em] text-indigo-dark transition hover:bg-rose-pastel"
          >
            COMENZAR AHORA — PRIMER MES AL 50%
            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
          </a>
        </div>
      </section>

      {/* Footer minimo: una sola linea de copyright, sin navegacion.
          El footer global (con su nav y el marquee de autoridad) no se
          renderiza en esta ruta — ver app/components/footer.tsx. */}
      <footer className="border-t border-indigo-dark/10 bg-rose-nude px-6 py-5 text-center md:px-10">
        <p className="text-xs text-indigo-dark/60">© {new Date().getFullYear()} Semzo Privé. Todos los derechos reservados.</p>
      </footer>
    </main>
  )
}

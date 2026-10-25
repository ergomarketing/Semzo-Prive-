"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, Check, Copy } from "lucide-react"
import { useLocale } from "@/providers/IntlProvider"
import LpHeader from "../lp-header"
import LpFaq from "../lp-faq"
import { commonFaqsEn } from "../faq-content"

const DISCOUNT_CODE = "PRIVE50"

/**
 * English version of the Google Ads landing (/lp/membership).
 * Spanish original: /lp/membresia (landing-membresia.tsx). Keep both in sync.
 */

const UTM = "utm_source=google&utm_medium=cpc&utm_campaign=lp_membership_en"

const memberships = [
  {
    id: "petite",
    name: "Petite",
    price: "€19.99",
    period: "/month",
    tagline: "Single passes",
    image: "/images/membership-petite-v2.jpg",
    href: `/signup?plan=petite&${UTM}`,
    highlight: false,
  },
  {
    id: "essentiel",
    name: "Essentiel",
    price: "€59",
    period: "/month",
    tagline: "One bag a month",
    image: "/images/membership-essentiel.jpeg",
    href: `/signup?plan=essentiel&${UTM}`,
    highlight: false,
  },
  {
    id: "signature",
    name: "Signature",
    price: "€149",
    period: "/month",
    tagline: "Premium brands",
    image: "/images/membership-signature-v2.jpg",
    href: `/signup?plan=signature&${UTM}`,
    highlight: true,
  },
  {
    id: "prive",
    name: "Privé",
    price: "€279",
    period: "/month",
    tagline: "Exclusive collection",
    image: "/images/membership-prive.jpg",
    href: `/signup?plan=prive&${UTM}`,
    highlight: false,
  },
]

const trustItems = ["100% authentic", "Flexible swaps", "Free shipping", "Option to buy"]

const steps = [
  { n: "1", title: "Choose your plan", text: "No lock-in. No small print. Cancel whenever you want." },
  { n: "2", title: "Receive your bag", text: "Authenticated, prepared and at your door." },
  { n: "3", title: "Swap it or keep it", text: "When you want a different one, we swap it. If you fall in love, your fees add up towards buying it." },
]

const testimonials = [
  {
    quote:
      "I'd wanted a Chanel for years and could never justify the price. With SEMZO PRIVÉ I wore it to a wedding in June and to a work dinner in July. Without spending it all at once.",
    author: "Lucía M., Madrid",
    detail: "Member since January 2026",
  },
  {
    quote:
      "I never thought I could carry a Louis Vuitton every day. Now I swap it every month and my friends ask me where I buy them.",
    author: "Carmen R., Madrid",
    detail: "Member since March 2026",
  },
]

function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return
  const w = window as unknown as { dataLayer?: unknown[] }
  w.dataLayer = w.dataLayer || []
  w.dataLayer.push({ event: name, ...params })
}

export default function LandingMembership() {
  const [copied, setCopied] = useState(false)
  const { setLocale } = useLocale()

  useEffect(() => {
    // Keeps /signup and the rest of the funnel in English for this visitor.
    setLocale("en")
    trackEvent("view_landing_lp_membership_en")

    // Funnel: the visitor reaches the plans section
    const plans = document.getElementById("memberships")
    if (!plans || !("IntersectionObserver" in window)) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          trackEvent("view_membership_plans", { lang: "en" })
          io.disconnect()
        }
      },
      { threshold: 0.2 },
    )
    io.observe(plans)
    return () => io.disconnect()
  }, [setLocale])

  const handleCopyCode = () => {
    navigator.clipboard.writeText(DISCOUNT_CODE)
    setCopied(true)
    trackEvent("copy_discount_code", { code: DISCOUNT_CODE, lang: "en" })
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="min-h-screen bg-rose-nude font-serif text-indigo-dark">
      <LpHeader />

      {/* HERO: whole photo (1199x1473), never cropped or split. On desktop the text sits inside
          the first screen, over the photo, so headline and button are visible without scrolling. */}
      <section className="w-full bg-indigo-dark">
        <div className="relative mx-auto w-full" style={{ aspectRatio: "1199/1473" }}>
          <Image
            src="/images/hermes-prive.jpeg"
            alt="Woman holding a burgundy leather handbag with gold hardware"
            fill
            priority
            sizes="100vw"
            className="object-cover object-top"
          />
          <div className="absolute inset-0 bg-black/35" />

          <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-10 md:bottom-auto md:top-[max(8rem,20svh)] md:px-14 md:pb-0 lg:px-20">
            <div className="text-white md:max-w-3xl">
              <p className="mb-4 text-[10px] tracking-[0.5em] text-white/85 md:text-xs">
                LUXURY HANDBAG MEMBERSHIP
              </p>

              <h1 className="mb-5 text-balance font-serif text-5xl leading-[0.95] tracking-tight md:text-6xl">
                The luxury wardrobe you always wanted.
                <br />
                <span className="italic text-rose-pastel">Without buying it.</span>
              </h1>

              <p className="mb-8 max-w-lg text-pretty text-base leading-relaxed text-white/90 md:text-lg">
                Access Chanel, Louis Vuitton, Dior and Loewe from €59/month, no lock-in. Verified original bags. Swap
                whenever you like and, if you fall in love, your fees add up towards buying it.
              </p>

              <a
                href="#memberships"
                onClick={() => trackEvent("cta_hero_click", { lang: "en" })}
                className="group inline-flex items-center gap-2 bg-white px-10 py-4 text-xs tracking-[0.3em] text-indigo-dark transition hover:bg-rose-pastel"
              >
                CHOOSE MY MEMBERSHIP
                <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
              </a>
            </div>
          </div>
        </div>
      </section>

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

      <section className="bg-white pb-10 pt-12 md:pb-14 md:pt-16">
        <div className="mx-auto max-w-5xl px-6 md:px-10">
          <div className="mb-8 text-center">
            <p className="mb-2 text-[10px] tracking-[0.5em] text-indigo-dark/60 md:text-xs">HOW IT WORKS</p>
            <h2 className="text-balance font-serif text-2xl leading-tight md:text-3xl">
              From doubt to your first designer bag.
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

      <section id="memberships" className="bg-rose-nude py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="mb-8 text-center md:mb-12">
            <p className="mb-2 text-[10px] tracking-[0.5em] text-indigo-dark/60 md:text-xs">FOUR TIERS</p>
            <h2 className="text-balance font-serif text-3xl leading-tight md:text-5xl">
              Choose your <span className="italic">membership</span>.
            </h2>
          </div>

          <div className="mx-auto mb-10 max-w-2xl border border-indigo-dark/20 bg-white p-6 text-center md:mb-12 md:p-8">
            <p className="mb-3 text-[10px] tracking-[0.4em] text-indigo-dark/60 md:text-xs">WELCOME OFFER</p>
            <p className="mb-3 font-serif text-2xl leading-tight md:text-3xl">
              Your first month at <span className="italic">50% off</span> with code PRIVE50
            </p>
            <p className="mb-4 text-sm text-indigo-dark/70">
              No empty promises. It&apos;s yours from today. New members only. Applies to your first sign-up.
            </p>
            <div className="mx-auto flex max-w-xs items-center justify-center gap-3">
              <span className="flex-1 border border-dashed border-indigo-dark/40 bg-rose-nude px-4 py-3 font-serif text-xl font-bold tracking-[0.2em] text-indigo-dark">
                {DISCOUNT_CODE}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                aria-label="Copy discount code"
                className="flex h-12 w-12 items-center justify-center border border-indigo-dark/30 transition hover:bg-indigo-dark hover:text-white"
              >
                {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
            <p className="mt-4 text-xs text-indigo-dark/60">Enter the code during checkout.</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {memberships.map((m) => (
              <Link
                key={m.id}
                href={m.href}
                onClick={() => trackEvent("cta_membership_click", { plan: m.id, lang: "en" })}
                className={`group flex flex-col overflow-hidden border bg-white transition hover:shadow-xl ${
                  m.highlight ? "border-indigo-dark shadow-lg" : "border-indigo-dark/15"
                }`}
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-rose-nude">
                  <Image
                    src={m.image || "/placeholder.svg"}
                    alt={`Handbag of the ${m.name} membership`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover object-center transition duration-700 group-hover:scale-105"
                  />
                  {m.highlight ? (
                    <span className="absolute right-3 top-3 bg-indigo-dark px-3 py-1 text-[9px] tracking-[0.3em] text-white">
                      MOST POPULAR
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
                    CHOOSE
                    <ArrowRight className="h-3 w-3 transition group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <LpFaq items={commonFaqsEn} id="faq" title="Frequently asked questions" />

      <section className="relative overflow-hidden bg-indigo-dark py-16 text-white md:py-20">
        <div className="absolute inset-0 opacity-15">
          <Image src="/images/luxury-closet-hero.jpg" alt="" fill sizes="100vw" className="object-cover" />
        </div>
        <div className="absolute inset-0 bg-indigo-dark/60" />

        <div className="relative z-10 mx-auto max-w-6xl px-6 text-center md:px-10">
          <div className="mx-auto mb-10 grid max-w-4xl gap-8 md:mb-12 md:grid-cols-2 md:gap-10">
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
            Luxury isn&apos;t what you own. <span className="italic">It&apos;s what you experience.</span>
          </h2>
          <p className="mx-auto mt-3 max-w-md text-pretty text-sm text-white/80 md:text-base">
            No lock-in. No risk. Just you and the bag you always wanted to carry.
          </p>

          <a
            href="#memberships"
            onClick={() => trackEvent("cta_final_click", { lang: "en" })}
            className="group mt-8 inline-flex items-center gap-2 bg-white px-12 py-4 text-xs tracking-[0.3em] text-indigo-dark transition hover:bg-rose-pastel"
          >
            START NOW — FIRST MONTH 50% OFF
            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
          </a>
        </div>
      </section>

      <footer className="border-t border-indigo-dark/10 bg-rose-nude px-6 py-5 text-center md:px-10">
        <p className="text-xs text-indigo-dark/60">© {new Date().getFullYear()} Semzo Privé. All rights reserved.</p>
      </footer>
    </main>
  )
}

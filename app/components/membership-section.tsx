"use client"

import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { useState } from "react"
import { useCart } from "@/app/contexts/cart-context"
import { useRouter } from "next/navigation"

type BillingCycle = "monthly" | "quarterly"

const memberships = [
  {
    id: "petite",
    name: "Petite",
    tagline: "Pases sueltos",
    image: "/images/membership-petite.svg",
    priceMonthly: "19,99€",
    // Petite NO aplica descuento trimestral
    priceQuarterly: "19,99€",
    periodMonthly: "/mes",
    periodQuarterly: "/mes",
    description: "Favoritos del día a día. Pide un bolso por semana sin compromiso.",
    brand: "Flexible",
    features: ["1 bolso por semana", "Renovación flexible", "Envío gratuito", "Seguro incluido"],
    highlight: false,
    canUseQuarterly: false,
  },
  {
    id: "essentiel",
    name: "Essentiel",
    tagline: "Un bolso al mes",
    image: "/images/membership-essentiel.jpeg",
    priceMonthly: "59€",
    priceQuarterly: "142€",
    periodMonthly: "/mes",
    periodQuarterly: "/trimestre",
    description: "La introducción perfecta al mundo de los bolsos de lujo.",
    brand: "Valentino",
    features: ["1 bolso por mes", "Envío gratuito", "Seguro incluido", "Atención prioritaria"],
    highlight: false,
    canUseQuarterly: true,
  },
  {
    id: "signature",
    name: "Signature",
    tagline: "Marcas premium",
    image: "/images/membership-signature.svg",
    priceMonthly: "129€",
    priceQuarterly: "310€",
    periodMonthly: "/mes",
    periodQuarterly: "/trimestre",
    description: "La experiencia preferida por nuestras clientas más exigentes.",
    brand: "Dior",
    features: [
      "1 bolso por mes",
      "Envío express gratuito",
      "Seguro premium incluido",
      "Acceso a colecciones exclusivas",
      "Personal shopper dedicado",
    ],
    highlight: true,
    canUseQuarterly: true,
  },
  {
    id: "prive",
    name: "Prive",
    tagline: "Coleccion exclusiva",
    image: "/images/membership-prive.jpg",
    priceMonthly: "279€",
    priceQuarterly: "669€",
    periodMonthly: "/mes",
    periodQuarterly: "/trimestre",
    description: "La experiencia definitiva para verdaderas conocedoras.",
    brand: "Chanel",
    features: [
      "1 bolso por mes",
      "Envío express gratuito",
      "Seguro premium incluido",
      "Acceso VIP a nuevas colecciones",
      "Personal shopper dedicado",
      "Eventos exclusivos",
    ],
    highlight: false,
    canUseQuarterly: true,
  },
]

export default function MembershipSection() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly")
  const { addItem } = useCart()
  const router = useRouter()

  const handleSelectPlan = (plan: (typeof memberships)[number]) => {
    // Petite SIEMPRE va como mensual (no acepta trimestral)
    const useQuarterly = billingCycle === "quarterly" && plan.canUseQuarterly

    const price = useQuarterly ? plan.priceQuarterly : plan.priceMonthly
    const period: "monthly" | "quarterly" = useQuarterly ? "quarterly" : "monthly"
    const periodLabel = useQuarterly ? "/trimestre" : "/mes"

    const selectedMembership = {
      id: plan.id,
      name: plan.name,
      price,
      billingCycle: period,
      description: plan.description,
      image: plan.image,
      brand: plan.brand,
      features: plan.features,
      popular: plan.highlight,
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("selectedMembership", JSON.stringify(selectedMembership))
    }

    const cartItem = {
      id: `${plan.id}-membership-${period}`,
      name: plan.name.toUpperCase(),
      price,
      billingCycle: period,
      description: plan.description,
      image: plan.image,
      brand: plan.brand || "",
      itemType: "membership" as const,
      period,
    }

    addItem(cartItem)
    router.push("/cart")
    void periodLabel
  }

  return (
    <section className="bg-gradient-to-b from-white via-rose-nude/40 to-rose-nude py-14 md:py-20">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        {/* Header */}
        <div className="mb-8 text-center md:mb-12">
          <h2 className="text-balance font-serif text-4xl leading-tight text-indigo-dark md:text-6xl">
            Nuestras Membresías
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-indigo-dark/70 md:text-base">
            Elige el plan perfecto para tu estilo de vida y presupuesto. Todas nuestras membresías incluyen envío y
            devolución gratuitos, seguro y acceso a nuestra colección exclusiva de bolsos de lujo.
          </p>
          <p className="mb-2 mt-8 text-[10px] tracking-[0.5em] text-indigo-dark/60 md:text-xs">CUATRO NIVELES</p>
          <h3 className="text-balance font-serif text-3xl leading-tight text-indigo-dark md:text-5xl">
            Elige tu <span className="italic">membresia</span>.
          </h3>
        </div>

        {/* Toggle Mensual / Trimestral */}
        <div className="mb-10 flex justify-center md:mb-12">
          <div className="inline-flex border border-indigo-dark/20 bg-white p-1">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-3 text-[10px] tracking-[0.3em] transition md:px-10 md:text-xs ${
                billingCycle === "monthly"
                  ? "bg-indigo-dark text-white"
                  : "bg-transparent text-indigo-dark/70 hover:text-indigo-dark"
              }`}
            >
              MENSUAL
            </button>
            <button
              onClick={() => setBillingCycle("quarterly")}
              className={`flex flex-col items-center px-6 py-3 text-[10px] tracking-[0.3em] transition md:px-10 md:text-xs ${
                billingCycle === "quarterly"
                  ? "bg-indigo-dark text-white"
                  : "bg-transparent text-indigo-dark/70 hover:text-indigo-dark"
              }`}
            >
              <span>TRIMESTRAL</span>
              <span
                className={`mt-1 text-[8px] tracking-[0.2em] md:text-[9px] ${
                  billingCycle === "quarterly" ? "text-rose-pastel" : "text-rose-700"
                }`}
              >
                AHORRA 20%
              </span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {memberships.map((m) => {
            const useQuarterly = billingCycle === "quarterly" && m.canUseQuarterly
            const displayPrice = useQuarterly ? m.priceQuarterly : m.priceMonthly
            const displayPeriod = useQuarterly ? m.periodQuarterly : m.periodMonthly

            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSelectPlan(m)}
                className={`group flex flex-col overflow-hidden border bg-white text-left transition hover:shadow-xl ${
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
                  <h3 className="font-serif text-2xl text-indigo-dark">{m.name}</h3>
                  <p className="mt-1 text-[10px] tracking-[0.25em] text-indigo-dark/60">{m.tagline.toUpperCase()}</p>

                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="font-serif text-3xl text-indigo-dark">{displayPrice}</span>
                    <span className="text-sm text-indigo-dark/60">{displayPeriod}</span>
                  </div>

                  {useQuarterly ? (
                    <p className="mt-2 text-[10px] tracking-[0.2em] text-rose-700">AHORRA 20%</p>
                  ) : billingCycle === "quarterly" && !m.canUseQuarterly ? (
                    <p className="mt-2 text-[10px] tracking-[0.2em] text-indigo-dark/50">SOLO PAGO MENSUAL</p>
                  ) : null}

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
              </button>
            )
          })}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-xs leading-relaxed text-indigo-dark/60 md:text-sm">
          Si no encuentras el bolso perfecto para ti, agenda una cita personalizada con nuestro Fashion Stylist para una
          experiencia completamente a medida.
        </p>
      </div>
    </section>
  )
}

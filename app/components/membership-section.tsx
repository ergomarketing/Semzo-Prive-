"use client"

import Image from "next/image"
import { ArrowRight, Check } from "lucide-react"
import { useState } from "react"
import { useCart } from "@/app/contexts/cart-context"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type BillingCycle = "monthly" | "quarterly"

const memberships = [
  {
    id: "petite",
    name: "Petite",
    tagline: "Pases sueltos",
    image: "/images/membership-petite.svg",
    priceMonthly: "19,99€",
    priceQuarterly: "19,99€",
    periodMonthly: "/mes",
    periodQuarterly: "/mes",
    description: "Favoritos del día a día. Pide un bolso por semana sin compromiso.",
    longDescription:
      "Para quien quiere descubrir el mundo de los bolsos de lujo a su propio ritmo. Activa tu membresía mensual y compra pases sueltos cada vez que quieras llevar un bolso. Ideal para eventos puntuales, fines de semana o probar antes de comprometerte con un plan superior.",
    brand: "Flexible",
    features: [
      "Hasta 4 pases por mes (1 por semana)",
      "Compra pases solo cuando los necesites",
      "Acceso a colección Essentiel, Signature y Privé",
      "Envío gratuito en 24-48h",
      "Seguro incluido en cada préstamo",
      "Sin permanencia",
    ],
    highlight: false,
    canUseQuarterly: false,
    forWhom: "Ideal para descubrir, ocasiones puntuales o uso ligero.",
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
    longDescription:
      "El primer paso al universo Semzo. Disfruta de un bolso premium cada mes, cámbialo cuando quieras y siente la libertad de renovar tu estilo sin acumular. Pensado para clientas que quieren incorporar el lujo a su día a día con elegancia y consistencia.",
    brand: "Valentino",
    features: [
      "1 bolso al mes incluido",
      "Marcas como Coach, Furla, Michael Kors, Tory Burch",
      "Cambio mensual flexible",
      "Envío gratuito en 24-48h",
      "Seguro incluido",
      "Atención al cliente prioritaria",
    ],
    highlight: false,
    canUseQuarterly: true,
    forWhom: "Para quien desea elegancia diaria con un toque de lujo accesible.",
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
    longDescription:
      "El equilibrio perfecto entre lujo y exclusividad. Accede a las casas más deseadas con un bolso premium cada mes, atención personalizada y prioridad en novedades. La membresía favorita de quienes ya saben lo que quieren.",
    brand: "Dior",
    features: [
      "1 bolso al mes incluido",
      "Marcas como Prada, Gucci, Saint Laurent, Bottega Veneta",
      "Envío express gratuito",
      "Seguro premium incluido",
      "Acceso a colecciones exclusivas",
      "Personal shopper dedicado",
    ],
    highlight: true,
    canUseQuarterly: true,
    forWhom: "La opción más elegida. Para quienes buscan presencia y distinción.",
  },
  {
    id: "prive",
    name: "Privé",
    tagline: "Coleccion exclusiva",
    image: "/images/membership-prive.jpg",
    priceMonthly: "279€",
    priceQuarterly: "669€",
    periodMonthly: "/mes",
    periodQuarterly: "/trimestre",
    description: "La experiencia definitiva para verdaderas conocedoras.",
    longDescription:
      "El círculo más íntimo de Semzo Privé. Bolsos icónicos de Hermès, Chanel y Louis Vuitton, atención de conserjería personal, eventos privados y acceso anticipado a piezas raras. Pensado para clientas que valoran lo único, lo exclusivo y lo irrepetible.",
    brand: "Chanel",
    features: [
      "1 bolso al mes incluido",
      "Hermès, Chanel, Louis Vuitton, Goyard, Loewe",
      "Envío express gratuito",
      "Seguro premium incluido",
      "Acceso VIP a nuevas colecciones",
      "Personal shopper dedicado",
      "Eventos exclusivos para socias Privé",
      "Servicio de conserjería personal",
    ],
    highlight: false,
    canUseQuarterly: true,
    forWhom: "Para conocedoras que aspiran a lo excepcional, sin compromisos.",
  },
]

type Membership = (typeof memberships)[number]

export default function MembershipSection() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly")
  const [openDetails, setOpenDetails] = useState<Membership | null>(null)
  const { addItem } = useCart()
  const router = useRouter()

  const handleSelectPlan = (plan: Membership) => {
    const useQuarterly = billingCycle === "quarterly" && plan.canUseQuarterly

    const price = useQuarterly ? plan.priceQuarterly : plan.priceMonthly
    const period: "monthly" | "quarterly" = useQuarterly ? "quarterly" : "monthly"

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
            Una invitación a vivir el lujo de otra manera. Cada membresía es una puerta a una experiencia distinta:
            desde el descubrimiento hasta lo excepcional. Tú eliges cómo entrar.
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

        {/* Cards: carrusel móvil + grid desktop */}
        <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 md:mx-0 md:grid md:snap-none md:grid-cols-2 md:gap-5 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
          {memberships.map((m) => {
            const useQuarterly = billingCycle === "quarterly" && m.canUseQuarterly
            const displayPrice = useQuarterly ? m.priceQuarterly : m.priceMonthly
            const displayPeriod = useQuarterly ? m.periodQuarterly : m.periodMonthly

            return (
              <div
                key={m.id}
                className={`group relative flex w-[80%] shrink-0 snap-center flex-col overflow-hidden border bg-white text-left transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_60px_-15px_rgba(26,32,77,0.25)] md:w-auto md:shrink ${
                  m.highlight
                    ? "border-indigo-dark shadow-lg ring-1 ring-[#b8a06a]/30"
                    : "border-indigo-dark/15 hover:ring-1 hover:ring-[#b8a06a]/40"
                }`}
              >
                {/* Glow dorado sutil al hover */}
                <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-tr from-transparent via-[#b8a06a]/0 to-[#b8a06a]/0 opacity-0 transition-opacity duration-700 group-hover:opacity-100 group-hover:via-[#b8a06a]/5 group-hover:to-[#b8a06a]/10" />

                <div className="relative aspect-[4/5] overflow-hidden bg-rose-nude">
                  <Image
                    src={m.image || "/placeholder.svg"}
                    alt={`Membresia ${m.name}`}
                    fill
                    sizes="(max-width: 768px) 80vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover object-center transition-transform duration-[1200ms] ease-out group-hover:scale-110"
                  />
                  {m.highlight ? (
                    <span className="absolute right-3 top-3 z-20 bg-indigo-dark px-3 py-1 text-[9px] tracking-[0.3em] text-white">
                      MAS ELEGIDA
                    </span>
                  ) : null}
                </div>

                <div className="relative z-20 flex flex-1 flex-col p-5">
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

                  {/* Ver detalles */}
                  <button
                    type="button"
                    onClick={() => setOpenDetails(m)}
                    className="mt-4 self-start text-[10px] tracking-[0.25em] text-indigo-dark/70 underline-offset-4 transition hover:text-[#b8a06a] hover:underline"
                  >
                    VER DETALLES
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPlan(m)}
                    className={`mt-4 inline-flex items-center justify-center gap-2 px-4 py-3 text-[10px] tracking-[0.3em] transition ${
                      m.highlight
                        ? "bg-indigo-dark text-white hover:bg-indigo-dark/85"
                        : "border border-indigo-dark text-indigo-dark hover:bg-indigo-dark hover:text-white"
                    }`}
                  >
                    ELEGIR
                    <ArrowRight className="h-3 w-3 transition group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-xs leading-relaxed text-indigo-dark/60 md:text-sm">
          Si no encuentras el bolso perfecto para ti, agenda una cita personalizada con nuestro Fashion Stylist para una
          experiencia completamente a medida.
        </p>
      </div>

      {/* Modal de detalles */}
      <Dialog open={!!openDetails} onOpenChange={(o) => !o && setOpenDetails(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto bg-white p-0">
          {openDetails ? (
            <div className="grid md:grid-cols-2">
              <div className="relative aspect-[4/5] bg-rose-nude md:aspect-auto md:min-h-[500px]">
                <Image
                  src={openDetails.image || "/placeholder.svg"}
                  alt={`Membresia ${openDetails.name}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover object-center"
                />
                {openDetails.highlight ? (
                  <span className="absolute right-3 top-3 bg-indigo-dark px-3 py-1 text-[9px] tracking-[0.3em] text-white">
                    MAS ELEGIDA
                  </span>
                ) : null}
              </div>

              <div className="flex flex-col p-6 md:p-8">
                <DialogHeader className="text-left">
                  <p className="text-[10px] tracking-[0.3em] text-[#b8a06a]">MEMBRESIA</p>
                  <DialogTitle className="font-serif text-3xl text-indigo-dark md:text-4xl">
                    {openDetails.name}
                  </DialogTitle>
                  <DialogDescription className="text-[10px] tracking-[0.25em] text-indigo-dark/60">
                    {openDetails.tagline.toUpperCase()}
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-serif text-3xl text-indigo-dark">
                    {billingCycle === "quarterly" && openDetails.canUseQuarterly
                      ? openDetails.priceQuarterly
                      : openDetails.priceMonthly}
                  </span>
                  <span className="text-sm text-indigo-dark/60">
                    {billingCycle === "quarterly" && openDetails.canUseQuarterly
                      ? openDetails.periodQuarterly
                      : openDetails.periodMonthly}
                  </span>
                </div>

                <p className="mt-5 text-pretty text-sm leading-relaxed text-indigo-dark/80">
                  {openDetails.longDescription}
                </p>

                <p className="mt-4 border-l-2 border-[#b8a06a]/60 pl-3 text-pretty text-xs italic leading-relaxed text-indigo-dark/70">
                  {openDetails.forWhom}
                </p>

                <ul className="mt-6 space-y-2">
                  {openDetails.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-indigo-dark/85">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#b8a06a]" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => {
                    handleSelectPlan(openDetails)
                    setOpenDetails(null)
                  }}
                  className={`mt-7 inline-flex items-center justify-center gap-2 px-4 py-3 text-[10px] tracking-[0.3em] transition ${
                    openDetails.highlight
                      ? "bg-indigo-dark text-white hover:bg-indigo-dark/85"
                      : "border border-indigo-dark text-indigo-dark hover:bg-indigo-dark hover:text-white"
                  }`}
                >
                  ELEGIR {openDetails.name.toUpperCase()}
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  )
}

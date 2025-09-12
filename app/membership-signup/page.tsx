"use client"

import { useCallback, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Crown, Gem, Star, ArrowLeft } from "lucide-react"

interface Plan {
  id: string
  name: string
  price: number
  period: string
  tagline: string
  popular?: boolean
  icon: JSX.Element
  benefits: string[]
  ctaColor?: string
}

const PLANS: Plan[] = [
  {
    id: "essentiel",
    name: "L'Essentiel",
    price: 59,
    period: "/mes",
    tagline: "Perfecto para comenzar tu experiencia de lujo",
    icon: <Star className="h-8 w-8 text-indigo-dark" />,
    benefits: [
      "1 bolso por mes",
      "Envío gratuito",
      "Seguro incluido",
      "Soporte por email",
      "Acceso al catálogo básico",
    ],
    ctaColor: "bg-slate-900 text-white hover:bg-slate-800",
  },
  {
    id: "signature",
    name: "Signature",
    price: 129,
    period: "/mes",
    tagline: "La experiencia completa de Semzo Privé",
    popular: true,
    icon: <Crown className="h-8 w-8 text-indigo-dark" />,
    benefits: [
      "1 bolso premium por mes",
      "Envío express gratuito",
      "Seguro premium incluido",
      "Soporte prioritario",
      "Acceso completo al catálogo",
      "Intercambios ilimitados",
    ],
    ctaColor: "bg-indigo-dark text-white hover:bg-indigo-dark/90",
  },
  {
    id: "prive",
    name: "Privé",
    price: 189,
    period: "/mes",
    tagline: "Acceso exclusivo a piezas únicas",
    icon: <Gem className="h-8 w-8 text-indigo-dark" />,
    benefits: [
      "1 bolso de alta gama por mes",
      "Envío VIP gratuito",
      "Seguro completo incluido",
      "Concierge personal",
      "Acceso a colecciones exclusivas",
      "Intercambios ilimitados",
      "Eventos privados",
    ],
    ctaColor: "bg-slate-900 text-white hover:bg-slate-800",
  },
]

export default function MembershipSignupPage() {
  const router = useRouter()

  const handleSelectPlan = useCallback(
    (planId: string) => {
      router.push(`/signup?plan=${planId}`)
    },
    [router],
  )

  const plans = useMemo(() => PLANS, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-nude/5 to-rose-pastel/3">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-indigo-dark hover:underline mb-4 focus:outline-none focus-visible:ring focus-visible:ring-indigo-dark/40 rounded"
          >
            <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
            Volver al inicio
          </Link>
          <div className="text-center">
            <h1 className="font-serif text-4xl text-slate-900 mb-4">Elige tu Membresía</h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Selecciona el plan perfecto para tu estilo y disfruta de bolsos de lujo cada mes
            </p>
          </div>
        </div>

        <div
            className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
            role="list"
            aria-label="Planes de membresía disponibles"
        >
          {plans.map((plan) => {
            const isPopular = plan.popular
            return (
              <Card
                key={plan.id}
                role="listitem"
                aria-labelledby={`plan-${plan.id}-title`}
                className={[
                  "relative border-0 shadow-xl transition-all duration-300 hover:shadow-2xl focus-within:ring-2 focus-within:ring-indigo-dark/60",
                  isPopular ? "ring-2 ring-indigo-dark scale-105" : "",
                ].join(" ")}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-indigo-dark text-white px-4 py-1 rounded-full text-sm font-medium shadow">
                      Más Popular
                    </span>
                  </div>
                )}

                <CardHeader className="text-center pb-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                    {plan.icon}
                  </div>
                  <CardTitle
                    id={`plan-${plan.id}-title`}
                    className="font-serif text-2xl text-slate-900"
                  >
                    {plan.name}
                  </CardTitle>
                  <p className="text-slate-600">{plan.tagline}</p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-slate-900" aria-label={`Precio ${plan.price} euros`}>
                      {plan.price}€
                    </span>
                    <span className="text-slate-600">{plan.period}</span>
                  </div>
                </CardHeader>

                <CardContent className="px-8 pb-8">
                  <ul className="space-y-4 mb-8" aria-label={`Beneficios del plan ${plan.name}`}>
                    {plan.benefits.map((b) => (
                      <li key={b} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
                        <span className="text-slate-700">{b}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    type="button"
                    onClick={() => handleSelectPlan(plan.id)}
                    className={["w-full h-12", plan.ctaColor].join(" ")}
                    aria-label={`Seleccionar plan ${plan.name} por ${plan.price} euros al mes`}
                  >
                    {`Seleccionar ${plan.name}`}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-600 mb-4">¿Tienes preguntas sobre nuestras membresías?</p>
          <Link
            href="/support"
            className="text-indigo-dark hover:underline font-medium focus:outline-none focus-visible:ring focus-visible:ring-indigo-dark/40 rounded"
          >
            Contacta con nuestro equipo
          </Link>
        </div>

        {/* Structured Data */}
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              name: "Planes de Membresía Semzo Privé",
              itemListElement: plans.map((p, index) => ({
                "@type": "Product",
                position: index + 1,
                name: p.name,
                description: p.tagline,
                offers: {
                  "@type": "Offer",
                  priceCurrency: "EUR",
                  price: p.price,
                  availability: "https://schema.org/InStock",
                  priceSpecification: {
                    "@type": "UnitPriceSpecification",
                    price: p.price,
                    billingDuration: 1,
                    billingIncrement: 1,
                    unitCode: "MON",
                  },
                },
              })),
            }),
          }}
        />
      </div>
    </div>
  )
}

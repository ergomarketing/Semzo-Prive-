"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useState } from "react"
import { useCart } from "@/app/contexts/cart-context"
import { useRouter } from "next/navigation"

const plans = [
  {
    id: "petite",
    name: "Petite",
    priceWeekly: "19.99€",
    description: "Favoritos del día a día",
    subtitle:
      "¿No estás listo para comprometerte? Los miembros de petite pueden pedir prestada una bolsa por una semana y ampliar semanalmente hasta 3 meses.",
    image: "/images/membership-petite.jpg",
    imageAlt: "Colección de bolsos de lujo - Membresía Petite",
    brand: "Flexible",
    brandLabel: "Petite",
    features: [
      "1 bolso por semana",
      "Renovación flexible",
      "Ampliable hasta 3 meses",
      "Envío gratuito",
      "Seguro incluido",
    ],
    popular: false,
  },
  {
    id: "essentiel",
    name: "L'Essentiel",
    priceMonthly: "59€",
    priceQuarterly: "142€",
    quarterlyDiscount: "20%",
    description: "La introducción perfecta al mundo de los bolsos de lujo.",
    image: "/images/membership-essentiel.jpeg",
    imageAlt: "Jacquemus - Elegancia minimalista para la membresía L'Essentiel",
    brand: "Valentino",
    brandLabel: "L'Essentiel",
    features: ["1 bolso por mes", "Envío gratuito", "Seguro incluido", "Atención al cliente prioritaria"],
    popular: false,
  },
  {
    id: "signature",
    name: "Signature",
    priceMonthly: "129€",
    priceQuarterly: "310€",
    quarterlyDiscount: "20%",
    description: "La experiencia preferida por nuestras clientas más exigentes.",
    image: "/images/dior-lady-bag.jpg",
    imageAlt: "Dior - Lady Bag para la membresía Signature",
    brand: "Dior",
    brandLabel: "Lady Dior",
    features: [
      "1 bolso por mes",
      "Envío express gratuito",
      "Seguro premium incluido",
      "Acceso a colecciones exclusivas",
      "Personal shopper dedicado",
    ],
    popular: true,
  },
  {
    id: "prive",
    name: "Privé",
    priceMonthly: "189€",
    priceQuarterly: "453€",
    quarterlyDiscount: "20%",
    description: "La experiencia definitiva para verdaderas conocedoras.",
    image: "/images/membership-prive.jpg",
    imageAlt: "Louis Vuitton Fornasetti - Diseño editorial para la membresía Privé",
    brand: "Chanel",
    brandLabel: "Quilted Bag",
    features: [
      "1 bolso por mes",
      "Envío express gratuito",
      "Seguro premium incluido",
      "Acceso VIP a nuevas colecciones",
      "Personal shopper dedicado",
      "Eventos exclusivos",
      "Servicio de conserjería",
    ],
    popular: false,
  },
]

export default function MembershipSection() {
  const [billingCycle, setBillingCycle] = useState<"weekly" | "monthly" | "quarterly">("monthly")
  const { addItem } = useCart()
  const router = useRouter()

  const handleSelectPlan = (plan: (typeof plans)[0]) => {
    let price: string
    let periodLabel: string
    let period: "weekly" | "monthly" | "quarterly"

    if (billingCycle === "weekly") {
      price = plan.priceWeekly || "19.99€"
      periodLabel = "/semana"
      period = "weekly"
    } else if (billingCycle === "monthly") {
      price = plan.priceMonthly || "59€"
      periodLabel = "/mes"
      period = "monthly"
    } else {
      price = plan.priceQuarterly || "149€"
      periodLabel = "/trimestre"
      period = "quarterly"
    }

    const selectedMembership = {
      id: plan.id,
      name: plan.name,
      price,
      billingCycle,
      description: plan.description,
      image: plan.image,
      brand: plan.brand,
      features: plan.features,
      popular: plan.popular,
    }

    localStorage.setItem("selectedMembership", JSON.stringify(selectedMembership))

    const cartItem = {
      id: `${plan.id}-membership-${billingCycle}`,
      name: plan.name.toUpperCase(),
      price: price,
      billingCycle: period,
      description: plan.description,
      image: plan.image,
      brand: plan.brand || "",
      itemType: "membership" as const,
      period: period,
    }

    console.log("[v0] Adding membership to cart:", cartItem)
    addItem(cartItem)
    router.push("/cart")
  }

  const filteredPlans =
    billingCycle === "weekly" ? plans.filter((p) => p.id === "petite") : plans.filter((p) => p.id !== "petite")

  return (
    <section id="membresias" className="py-16 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-slate-900 mb-6 font-serif leading-tight">
            Nuestras Membresías
          </h2>
          <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed font-light mb-10">
            Elige el plan perfecto para tu estilo de vida y presupuesto. Todas nuestras membresías incluyen envío y
            devolución gratuitos, seguro y acceso a nuestra colección exclusiva de bolsos de lujo.
          </p>

          <div className="flex justify-center mb-12">
            <div className="bg-white rounded-lg shadow-lg p-1 inline-flex border border-slate-200 max-w-2xl w-full">
              <button
                onClick={() => setBillingCycle("weekly")}
                className={`flex-1 px-6 py-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  billingCycle === "weekly"
                    ? "bg-indigo-dark text-white shadow-md transform scale-105"
                    : "bg-transparent text-slate-600 hover:bg-slate-100"
                }`}
              >
                Pago Semanal
              </button>
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`flex-1 px-6 py-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  billingCycle === "monthly"
                    ? "bg-indigo-dark text-white shadow-md transform scale-105"
                    : "bg-transparent text-slate-600 hover:bg-slate-100"
                }`}
              >
                Pago Mensual
              </button>
              <button
                onClick={() => setBillingCycle("quarterly")}
                className={`flex-1 px-6 py-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  billingCycle === "quarterly"
                    ? "bg-indigo-dark text-white shadow-md transform scale-105"
                    : "bg-transparent text-slate-600 hover:bg-slate-100"
                }`}
              >
                <div>Pago Trimestral</div>
                <div
                  className={`text-xs font-bold mt-1 ${billingCycle === "quarterly" ? "text-rose-200" : "text-rose-500"}`}
                >
                  Ahorra un 20%
                </div>
              </button>
            </div>
          </div>
        </div>

        {billingCycle === "weekly" ? (
          <div className="max-w-5xl mx-auto">
            <Card className="border-0 shadow-xl overflow-hidden bg-white">
              <div className="grid md:grid-cols-2 gap-0">
                {/* Imagen lado izquierdo */}
                <div className="relative h-96 md:h-auto overflow-hidden bg-gradient-to-br from-[#f5f0e8] to-[#e8e0d5]">
                  <Image
                    src="/images/jacquemus-le-chiquito.jpg"
                    alt="Jacquemus Le Chiquito"
                    fill
                    className="object-cover object-center"
                    priority
                  />
                  {/* Badge del bolso */}
                  <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md">
                    <div className="text-sm font-semibold text-slate-900">Jacquemus</div>
                    <div className="text-xs text-slate-600">Le Chiquito</div>
                  </div>
                </div>

                {/* Contenido lado derecho */}
                <CardContent className="p-8 md:p-12 flex flex-col justify-center">
                  <h3 className="font-serif text-4xl italic font-light text-slate-900 mb-2">Favoritos del día a día</h3>
                  <p className="text-slate-600 mb-6 leading-relaxed">
                    ¿No estás lista para comprometerte? Los miembros de <strong>Petite</strong> pueden pedir prestado un
                    bolso por una semana y ampliar semanalmente hasta 3 meses.
                  </p>

                  <div className="bg-slate-50 rounded-xl p-5 mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="font-serif text-5xl font-light text-slate-900">19,99€</span>
                      <span className="text-lg text-slate-500 font-light">/semana</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-2">
                      Añade un Pase de Bolso para acceder a nuestras colecciones de lujo
                    </p>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {["1 bolso por semana", "Envío gratuito", "Seguro incluido", "Sin compromiso"].map(
                      (feature, idx) => (
                        <li key={idx} className="flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full bg-rose-300 flex-shrink-0"></span>
                          <span className="text-slate-700">{feature}</span>
                        </li>
                      ),
                    )}
                  </ul>

                  <Button
                    onClick={() => handleSelectPlan(plans.find((p) => p.id === "petite"))}
                    className="w-full py-5 text-base font-medium bg-[#1a2c4e] hover:bg-[#0f1d33] text-white uppercase tracking-wider"
                  >
                    ELEGIR MEMBRESÍA PETITE
                  </Button>
                </CardContent>
              </div>
            </Card>

            <div className="text-center mt-8">
              <p className="text-slate-500 text-sm">
                Después de elegir tu membresía Petite, podrás seleccionar un bolso del catálogo.
              </p>
              <p className="text-slate-500 text-sm mt-1">
                El precio del Pase de Bolso varía según la categoría: L'Essenciel (52€), Signature (99€), Privé (137€)
              </p>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {filteredPlans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative border-0 shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 bg-white ${
                  plan.popular ? "ring-2 ring-rose-nude scale-105" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <span className="bg-rose-nude text-slate-900 px-6 py-1 rounded-full text-sm font-medium shadow-md whitespace-nowrap">
                      Más Popular
                    </span>
                  </div>
                )}

                <div className="relative h-64 overflow-hidden bg-gray-50">
                  <Image
                    src={plan.image || "/placeholder.svg"}
                    alt={plan.imageAlt}
                    fill
                    className="object-cover"
                    style={{
                      objectPosition: "center center",
                      objectFit: "cover",
                    }}
                  />
                  <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg">
                    <div className="text-sm font-medium text-slate-900">{plan.brand}</div>
                    <div className="text-xs text-slate-600">{plan.brandLabel}</div>
                  </div>
                </div>

                <CardContent className="px-6 pt-4 pb-4 text-center">
                  <h3 className="font-serif text-2xl font-light text-slate-900 mb-2">{plan.name}</h3>

                  <div className="mb-4">
                    <span className="font-serif text-4xl font-light text-slate-900">
                      {billingCycle === "monthly" ? plan.priceMonthly : plan.priceQuarterly}
                    </span>
                    <span className="text-base text-slate-600 font-light">
                      {billingCycle === "monthly" ? "/mes" : "/trimestre"}
                    </span>

                    {billingCycle === "quarterly" && (
                      <div className="mt-2 text-rose-500 font-medium text-sm bg-rose-50 px-2 py-1 rounded-md inline-block">
                        ¡Ahorras un {plan.quarterlyDiscount}!
                      </div>
                    )}
                  </div>

                  <p className="text-slate-600 mb-3 font-light text-sm">{plan.description}</p>

                  <ul className="space-y-1 mb-4 text-slate-700 text-left text-sm">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <span className="leading-relaxed font-light">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full py-3 text-sm transition-all duration-300 font-light ${
                      plan.popular
                        ? "bg-rose-nude hover:bg-rose-nude/90 text-slate-900"
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                    }`}
                  >
                    Elegir {plan.name}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <p className="text-slate-500 text-sm leading-relaxed font-light">
            Si no encuentras el bolso perfecto para ti, agenda una cita personalizada con nuestro Fashion Stylist para
            una experiencia completamente personalizada.
          </p>
        </div>
      </div>
    </section>
  )
}

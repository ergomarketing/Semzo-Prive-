"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

const plans = [
  {
    name: "L'Essentiel",
    priceMonthly: "59€",
    priceQuarterly: "159€",
    quarterlyDiscount: "15%",
    description: "Perfecto para comenzar tu experiencia de lujo",
    image: "/images/louis-vuitton-lessentiel.jpeg",
    imageAlt: "Louis Vuitton - Elegancia urbana para la membresía L'Essentiel",
    brand: "Louis Vuitton",
    brandDescription: "Iconos atemporales",
    features: [
      "1 bolso por mes",
      "Envío gratuito",
      "Seguro incluido",
      "Cambios ilimitados",
      "Atención al cliente prioritaria",
    ],
    popular: false,
  },
  {
    name: "Signature",
    priceMonthly: "129€",
    priceQuarterly: "329€",
    quarterlyDiscount: "15%",
    description: "La elección favorita de nuestras clientas",
    image: "/images/chanel-signature.jpeg",
    imageAlt: "Chanel - Elegancia parisina para la membresía Signature",
    brand: "Chanel",
    brandDescription: "Elegancia parisina",
    features: [
      "2 bolsos por mes",
      "Envío express gratuito",
      "Seguro premium incluido",
      "Cambios ilimitados",
      "Acceso a colecciones exclusivas",
      "Personal shopper dedicado",
    ],
    popular: true,
  },
  {
    name: "Privé",
    priceMonthly: "189€",
    priceQuarterly: "479€",
    quarterlyDiscount: "15%",
    description: "La experiencia de lujo definitiva",
    image: "/images/hermes-prive.jpeg",
    imageAlt: "Hermès - Lujo artesanal para la membresía Privé",
    brand: "Hermès",
    brandDescription: "Lujo artesanal",
    features: [
      "3 bolsos por mes",
      "Envío same-day en Madrid",
      "Seguro premium incluido",
      "Cambios ilimitados",
      "Acceso VIP a nuevas colecciones",
      "Personal shopper dedicado",
      "Eventos exclusivos",
      "Servicio de conserjería",
    ],
    popular: false,
  },
]

export default function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "quarterly">("monthly")

  return (
    <section id="membresias" className="py-24 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-8 font-serif leading-tight">
            Nuestras Membresías
          </h2>
          <p className="text-xl md:text-2xl text-slate-600 max-w-4xl mx-auto leading-relaxed font-light">
            Elige el plan perfecto para tu estilo de vida y presupuesto. Todas nuestras membresías incluyen envío y
            devolución gratuitos, seguro y acceso a nuestra colección exclusiva de bolsos de lujo.
          </p>

          {/* Billing cycle toggle */}
          <div className="flex justify-center mt-10 mb-12">
            <div className="bg-white rounded-lg shadow-md p-2 inline-flex">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-6 py-3 rounded-md text-sm font-medium transition-all ${
                  billingCycle === "monthly"
                    ? "bg-indigo-dark text-white"
                    : "bg-transparent text-slate-600 hover:bg-slate-100"
                }`}
              >
                Mensual
              </button>
              <button
                onClick={() => setBillingCycle("quarterly")}
                className={`px-6 py-3 rounded-md text-sm font-medium transition-all ${
                  billingCycle === "quarterly"
                    ? "bg-indigo-dark text-white"
                    : "bg-transparent text-slate-600 hover:bg-slate-100"
                }`}
              >
                Trimestral <span className="text-xs font-bold text-rose-500">-15%</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-10 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={plan.name}
              className={`relative border-0 shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 bg-white ${
                plan.popular ? "ring-2 ring-rose-500 scale-105" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="bg-rose-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                    Más Popular
                  </span>
                </div>
              )}

              {/* Cabecera con mejor espaciado */}
              <CardHeader className="text-center pb-6 bg-white px-8 pt-8">
                <CardTitle className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
                  Membresía {plan.name}
                </CardTitle>
                <div className="mb-6">
                  <span className="text-5xl md:text-6xl font-bold text-slate-900">
                    {billingCycle === "monthly" ? plan.priceMonthly : plan.priceQuarterly}
                  </span>
                  <span className="text-xl ml-2 text-slate-600 font-medium">
                    {billingCycle === "monthly" ? "/ mes" : "/ trimestre"}
                  </span>

                  {billingCycle === "quarterly" && (
                    <div className="mt-2 text-rose-500 font-medium">Ahorras un {plan.quarterlyDiscount}</div>
                  )}
                </div>
                <p className="text-lg text-slate-600 leading-relaxed">{plan.description}</p>
              </CardHeader>

              {/* Imagen de la marca */}
              <div className="relative h-72 overflow-hidden bg-gray-50">
                <Image src={plan.image || "/placeholder.svg"} alt={plan.imageAlt} fill className="object-contain p-4" />
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm">
                  <div className="text-sm font-semibold text-slate-800">{plan.brand}</div>
                  <div className="text-xs text-slate-600 mt-1">{plan.brandDescription}</div>
                </div>
              </div>

              <CardContent className="px-8 pt-8 pb-8">
                <ul className="space-y-4 mb-10 text-slate-700">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-base">
                      <Check className="h-5 w-5 mr-4 text-indigo-dark flex-shrink-0" />
                      <span className="leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full font-semibold py-4 text-lg transition-all duration-300 ${
                    plan.popular
                      ? "bg-rose-500 hover:bg-rose-600 text-white"
                      : "bg-slate-900 hover:bg-slate-800 text-white"
                  }`}
                >
                  Elegir {plan.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-16">
          <p className="text-slate-500 text-base leading-relaxed">
            Todas las membresías incluyen período de prueba de 7 días. Cancela en cualquier momento sin compromiso.
          </p>
        </div>
      </div>
    </section>
  )
}

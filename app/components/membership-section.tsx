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
    priceWeekly: "19,99€",
    priceMonthly: null,
    priceQuarterly: null,
    quarterlyDiscount: null,
    description: "Disfruta de un bolso de lujo por una semana. Perfecto para eventos especiales.",
    image: "/images/jacquemus-20peque-c3-b1in.jpg",
    imageAlt: "Jacquemus - Le Chiquito para la membresía Petite",
    brand: "Jacquemus",
    brandLabel: "Le Chiquito",
    features: ["1 bolso por semana", "Envío gratuito", "Seguro incluido", "Sin compromiso"],
    popular: false,
    weeklyOnly: true,
  },
  {
    id: "essentiel",
    name: "L'Essentiel",
    priceMonthly: "59€",
    priceQuarterly: "142€",
    quarterlyDiscount: "20%",
    description: "La introducción perfecta al mundo de los bolsos de lujo.",
    image: "/images/louis-vuitton-essentiel-new.jpg",
    imageAlt: "Louis Vuitton - Elegancia natural para la membresía L'Essentiel",
    brand: "Valentino",
    brandLabel: "L'Essentiel",
    features: ["1 bolso por mes", "Envío gratuito", "Seguro incluido", "Atención al cliente prioritaria"],
    popular: false,
    weeklyOnly: false,
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
    weeklyOnly: false,
  },
  {
    id: "prive",
    name: "Privé",
    priceMonthly: "189€",
    priceQuarterly: "453€",
    quarterlyDiscount: "20%",
    description: "La experiencia definitiva para verdaderas conocedoras.",
    image: "/images/chanel-prive-pink.jpg",
    imageAlt: "Chanel - Elegancia rosa para la membresía Privé",
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
    weeklyOnly: false,
  },
]

export default function MembershipSection() {
  const [billingCycle, setBillingCycle] = useState<"weekly" | "monthly" | "quarterly">("monthly")
  const { addItem } = useCart()
  const router = useRouter()

  const handleSelectPlan = (plan: any) => {
    const getPrice = () => {
      if (billingCycle === "weekly") return plan.priceWeekly
      if (billingCycle === "quarterly") return plan.priceQuarterly
      return plan.priceMonthly
    }

    const selectedMembership = {
      id: plan.id,
      name: plan.name,
      price: getPrice(),
      billingCycle: billingCycle,
      description: plan.description,
      image: plan.image,
      brand: plan.brand,
      features: plan.features,
      popular: plan.popular,
    }

    localStorage.setItem("selectedMembership", JSON.stringify(selectedMembership))

    const cartItem = {
      id: `${plan.id}-${billingCycle}`,
      name: plan.name,
      price: getPrice(),
      billingCycle: billingCycle as "weekly" | "monthly" | "quarterly",
      description: plan.description,
      image: plan.image,
      brand: plan.brand,
    }

    addItem(cartItem)
    router.push("/cart")
  }

  const filteredPlans = plans.filter((plan) => !plan.weeklyOnly)

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

          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-lg shadow-lg p-1 inline-flex border border-slate-200 max-w-lg w-full">
              <button
                onClick={() => setBillingCycle("weekly")}
                className={`flex-1 px-4 py-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  billingCycle === "weekly"
                    ? "bg-indigo-dark text-white shadow-md transform scale-105"
                    : "bg-transparent text-slate-600 hover:bg-slate-100"
                }`}
              >
                Pago Semanal
              </button>
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`flex-1 px-4 py-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  billingCycle === "monthly"
                    ? "bg-indigo-dark text-white shadow-md transform scale-105"
                    : "bg-transparent text-slate-600 hover:bg-slate-100"
                }`}
              >
                Pago Mensual
              </button>
              <button
                onClick={() => setBillingCycle("quarterly")}
                className={`flex-1 px-4 py-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  billingCycle === "quarterly"
                    ? "bg-indigo-dark text-white shadow-md transform scale-105"
                    : "bg-transparent text-slate-600 hover:bg-slate-100"
                }`}
              >
                <div>Pago Trimestral</div>
                <div
                  className={`text-xs font-medium mt-1 ${billingCycle === "quarterly" ? "text-rose-200" : "text-rose-400"}`}
                >
                  Ahorra un 20%
                </div>
              </button>
            </div>
          </div>
        </div>

        {billingCycle === "weekly" ? (
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="grid md:grid-cols-2 gap-0">
                {/* Imagen */}
                <div className="relative h-80 md:h-auto">
                  <Image
                    src="/images/jacquemus-20peque-c3-b1in.jpg"
                    alt="Jacquemus Le Chiquito - Membresía Petite"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <p className="font-semibold text-slate-900">Jacquemus</p>
                    <p className="text-sm text-slate-600">Le Chiquito</p>
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-8 md:p-10 flex flex-col justify-center">
                  <h3 className="text-3xl font-serif text-slate-900 mb-3 italic">Favoritos del día a día</h3>
                  <p className="text-slate-600 mb-6 leading-relaxed">
                    ¿No estás lista para comprometerte? Los miembros de <span className="font-semibold">Petite</span>{" "}
                    pueden pedir prestado un bolso por una semana y ampliar semanalmente hasta 3 meses.
                  </p>

                  <div className="border border-slate-200 rounded-xl p-5 mb-6">
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-3xl font-light text-slate-900">19,99€</span>
                      <span className="text-slate-500">/semana</span>
                    </div>
                    <p className="text-sm text-slate-500">
                      Añade un Pase de Bolso para acceder a nuestras colecciones de lujo
                    </p>
                  </div>

                  <ul className="space-y-2 mb-6 text-sm text-slate-600">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-rose-300 rounded-full"></span>1 bolso por semana
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-rose-300 rounded-full"></span>
                      Envío gratuito
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-rose-300 rounded-full"></span>
                      Seguro incluido
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-rose-300 rounded-full"></span>
                      Sin compromiso
                    </li>
                  </ul>

                  <Button
                    onClick={() => handleSelectPlan(plans.find((p) => p.id === "petite"))}
                    className="w-full bg-indigo-dark hover:bg-indigo-900 text-white py-6 rounded-lg font-medium uppercase tracking-wide"
                  >
                    Elegir Membresía Petite
                  </Button>
                </div>
              </div>
            </div>

            {/* Texto informativo de categorías de bolsos */}
            <div className="mt-8 text-center">
              <p className="text-slate-500 text-sm">
                Después de elegir tu membresía Petite, podrás seleccionar un bolso del catálogo.
                <br />
                El precio del Pase de Bolso varía según la categoría: L'Essenciel (52€), Signature (99€), Privé (137€)
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-6 max-w-6xl mx-auto md:grid-cols-3">
              {filteredPlans.map((plan) => (
                <Card
                  key={plan.name}
                  className={`relative border-0 shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 bg-white ${
                    plan.popular ? "ring-2 ring-rose-nude md:scale-105" : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
                      <span className="bg-rose-nude text-slate-900 px-6 py-1 rounded-full text-sm font-medium shadow-md whitespace-nowrap">
                        Más Popular
                      </span>
                    </div>
                  )}

                  {/* Imagen con etiqueta de marca */}
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

                  <CardContent className="px-4 pt-4 pb-4 text-center">
                    <h3 className="font-serif text-xl font-light text-slate-900 mb-2">{plan.name}</h3>

                    <div className="mb-3">
                      <span className="font-serif text-3xl font-light text-slate-900">
                        {billingCycle === "quarterly" ? plan.priceQuarterly : plan.priceMonthly}
                      </span>
                      <span className="text-sm text-slate-600 font-light">
                        {billingCycle === "quarterly" ? "/trimestre" : "/mes"}
                      </span>

                      {billingCycle === "quarterly" && plan.quarterlyDiscount && (
                        <div className="mt-2 text-rose-400 font-medium text-xs bg-rose-50 px-2 py-1 rounded-md inline-block">
                          ¡Ahorras un {plan.quarterlyDiscount}!
                        </div>
                      )}
                    </div>

                    <p className="text-slate-600 mb-3 font-light text-xs">{plan.description}</p>

                    <ul className="space-y-1 mb-4 text-slate-700 text-left text-xs">
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

            <div className="text-center mt-10">
              <p className="text-slate-500 text-sm leading-relaxed font-light">
                Si no encuentras el bolso perfecto para ti, agenda una cita personalizada con nuestro Fashion Stylist
                para una experiencia completamente personalizada.
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

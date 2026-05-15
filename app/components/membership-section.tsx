"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useCart } from "@/app/contexts/cart-context"
import { useRouter } from "next/navigation"

const plans = [
  {
    id: "petite",
    name: "Petite",
    priceMonthly: "19,99€",
    description: "Favoritos del día a día",
    image: "/images/jacquemus-le-chiquito.jpg",
    imageAlt: "Jacquemus Le Chiquito — Membresía Petite",
    brand: "Jacquemus",
    brandLabel: "Le Chiquito",
    features: [
      "1 bolso por semana (4 bolsos al mes)",
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
    description: "La introducción perfecta al mundo de los bolsos de lujo.",
    image: "/images/louis-vuitton-essentiel-new.jpg",
    imageAlt: "Louis Vuitton — Membresía L'Essentiel",
    brand: "Valentino",
    brandLabel: "L'Essentiel",
    features: ["1 bolso por mes", "Envío gratuito", "Seguro incluido", "Atención al cliente prioritaria"],
    popular: false,
  },
  {
    id: "signature",
    name: "Signature",
    priceMonthly: "149€",
    description: "La experiencia preferida por nuestras clientas más exigentes.",
    image: "/images/dior-lady-bag.jpg",
    imageAlt: "Dior Lady Bag — Membresía Signature",
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
    priceMonthly: "279€",
    description: "La experiencia definitiva para verdaderas conocedoras.",
    image: "/images/chanel-prive-pink.jpg",
    imageAlt: "Chanel — Membresía Privé",
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

const bagPasses = [
  {
    id: "pass-essentiel",
    name: "Pase L'Essentiel",
    price: "52€",
    description: "Pide prestado un bolso de la Colección L'Essentiel por una semana, con opción a ampliar.",
  },
  {
    id: "pass-signature",
    name: "Pase Signature",
    price: "99€",
    description: "Pide prestado un bolso de la Colección Signature por una semana, con opción a ampliar.",
  },
  {
    id: "pass-prive",
    name: "Pase Privé",
    price: "137€",
    description: "Pide prestado un bolso de la Colección Privé por una semana, con opción a ampliar.",
  },
]

export default function MembershipSection() {
  const { addItem } = useCart()
  const router = useRouter()

  const handleSelectPlan = (plan: (typeof plans)[0]) => {
    const selectedMembership = {
      id: plan.id,
      name: plan.name,
      price: plan.priceMonthly,
      billingCycle: "monthly",
      description: plan.description,
      image: plan.image,
      brand: plan.brand,
      features: plan.features,
      popular: plan.popular,
    }

    localStorage.setItem("selectedMembership", JSON.stringify(selectedMembership))

    const cartItem = {
      id: `${plan.id}-membership-monthly`,
      name: plan.name.toUpperCase(),
      price: plan.priceMonthly,
      billingCycle: "monthly" as const,
      description: plan.description,
      image: plan.image,
      brand: plan.brand || "",
      itemType: "membership" as const,
      period: "monthly" as const,
    }

    addItem(cartItem)
    router.push("/cart")
  }

  return (
    <section id="membresias" className="py-16 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-slate-900 mb-6 font-serif leading-tight">
            Nuestras Membresías
          </h2>
          <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed font-light">
            Elige el plan perfecto para tu estilo de vida. Todas nuestras membresías son de pago mensual e incluyen
            envío y devolución gratuitos, seguro y acceso a nuestra colección exclusiva de bolsos de lujo.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative border-0 shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 bg-white flex flex-col ${
                plan.popular ? "ring-2 ring-rose-nude lg:scale-105" : ""
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
                  style={{ objectPosition: "center center", objectFit: "cover" }}
                />
                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg">
                  <div className="text-sm font-medium text-slate-900">{plan.brand}</div>
                  <div className="text-xs text-slate-600">{plan.brandLabel}</div>
                </div>
              </div>

              <CardContent className="px-6 pt-4 pb-6 text-center flex flex-col flex-1">
                <h3 className="font-serif text-2xl font-light text-slate-900 mb-2">{plan.name}</h3>

                <div className="mb-4">
                  <span className="font-serif text-4xl font-light text-slate-900">{plan.priceMonthly}</span>
                  <span className="text-base text-slate-600 font-light">/mes</span>
                </div>

                <p className="text-slate-600 mb-3 font-light text-sm">{plan.description}</p>

                <ul className="space-y-1 mb-4 text-slate-700 text-left text-sm flex-1">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-300 flex-shrink-0 mt-2"></span>
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

        {/* Add-ons: Pases de Bolso semanales */}
        <div className="mt-20 max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h3 className="font-serif text-3xl md:text-4xl font-light text-slate-900 mb-3 italic">
              Pases de Bolso <span className="not-italic">— Add-ons</span>
            </h3>
            <p className="text-slate-600 max-w-2xl mx-auto font-light">
              ¿Quieres un bolso extra esta semana? Añade un Pase de Bolso a tu membresía para acceder a otra colección
              durante 7 días, con opción a ampliar.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {bagPasses.map((pass) => (
              <Card key={pass.id} className="border border-slate-200 shadow-none bg-white">
                <CardContent className="p-6 flex flex-col h-full">
                  <h4 className="font-serif text-xl font-medium text-slate-900 mb-2">{pass.name}</h4>
                  <p className="text-slate-600 text-sm font-light mb-5 flex-1">{pass.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="font-serif text-3xl font-light text-slate-900">{pass.price}</span>
                    <span className="text-sm text-slate-500 font-light">/semana</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-slate-500 text-sm mt-6 font-light">
            Los Pases de Bolso se añaden sobre cualquier membresía activa y se facturan por separado.
          </p>
        </div>

        <div className="text-center mt-12">
          <p className="text-slate-500 text-sm leading-relaxed font-light">
            Si no encuentras el bolso perfecto para ti, agenda una cita personalizada con nuestro Fashion Stylist para
            una experiencia completamente personalizada.
          </p>
        </div>
      </div>
    </section>
  )
}

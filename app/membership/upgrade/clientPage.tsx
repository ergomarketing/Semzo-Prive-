"use client"

import { useAuth } from "../../hooks/useAuth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Crown } from "lucide-react"
import Head from "next/head"

const plans = [
  {
    id: "essentiel",
    name: "L'Essentiel",
    price: "59€",
    description: "La introducción perfecta al mundo de los bolsos de lujo.",
    image: "/images/membership-essentiel.jpeg",
    imageAlt: "Jacquemus - Elegancia minimalista para la membresía L'Essentiel",
    brand: "Valentino",
    brandLabel: "L'Essentiel",
    features: ["1 bolso por mes", "Envío gratuito", "Seguro incluido", "Atención al cliente prioritaria"],
    popular: false,
    membershipKey: "lessentiel",
  },
  {
    id: "signature",
    name: "Signature",
    price: "129€",
    description: "La experiencia preferida por nuestras clientas más exigentes.",
    image: "/images/membership-signature.jpg",
    imageAlt: "Gucci - Lifestyle premium para la membresía Signature",
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
    membershipKey: "signature",
  },
  {
    id: "prive",
    name: "Privé",
    price: "189€",
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
    membershipKey: "prive",
  },
]

const membershipListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: plans.map((plan, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "Offer",
      name: `Membresía ${plan.name}`,
      description: plan.description,
      price: plan.price.replace("€", ""),
      priceCurrency: "EUR",
      url: `https://semzoprive.com/membership/upgrade/${plan.id}`,
    },
  })),
}

export default function MembershipUpgradeClientPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const membershipType = user?.user_metadata?.membership_status || "free"

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin h-8 w-8 text-slate-600" />
      </div>
    )
  }

  if (!user) return null

  if (membershipType === "prive") {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center py-16">
            <Crown className="w-16 h-16 text-slate-900 mx-auto mb-6" />
            <h1 className="font-serif text-4xl text-slate-900 mb-4">¡Ya eres miembro Privé!</h1>
            <p className="text-lg text-slate-600 mb-8 font-light">
              Disfruta de todos los beneficios exclusivos de tu membresía premium.
            </p>
            <Button
              onClick={() => router.push("/dashboard")}
              className="bg-slate-900 hover:bg-slate-800 text-white font-light px-8 py-3"
            >
              Volver al Dashboard
            </Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <>
      <Head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(membershipListSchema) }} />
      </Head>
      <section className="py-16 bg-slate-50 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-slate-900 mb-6 font-serif leading-tight">
              Nuestras Membresías
            </h2>
            <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed font-light mb-10">
              Elige el plan perfecto para tu estilo de vida y presupuesto. Todas nuestras membresías incluyen envío y
              devolución gratuitos, seguro y acceso a nuestra colección exclusiva de bolsos de lujo.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative border-0 shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 ${
                  plan.popular ? "ring-2 ring-rose-200 scale-105" : ""
                }`}
                style={{
                  backgroundImage: `url(${plan.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }}
              >
                <div className="absolute inset-0 bg-white/85 backdrop-blur-sm"></div>

                {plan.popular && (
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
                    <span className="bg-rose-100 text-slate-900 px-6 py-1 rounded-full text-sm font-medium shadow-md whitespace-nowrap">
                      Más Popular
                    </span>
                  </div>
                )}

                <CardContent className="relative z-10 px-6 py-8 text-center h-full flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-3xl font-light text-slate-900 mb-3">{plan.name}</h3>

                    <div className="mb-4">
                      <span className="font-serif text-5xl font-light text-slate-900">{plan.price}</span>
                      <span className="text-lg text-slate-600 font-light">/mes</span>
                    </div>

                    <p className="text-slate-700 mb-6 font-light text-base leading-relaxed">{plan.description}</p>

                    <ul className="space-y-2 mb-8 text-slate-700 text-left">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center text-sm">
                          <span className="w-2 h-2 bg-slate-400 rounded-full mr-3 flex-shrink-0"></span>
                          <span className="leading-relaxed font-light">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    onClick={() => router.push(`/membership/upgrade/${plan.id}`)}
                    className={`w-full py-3 text-sm transition-all duration-300 font-light ${
                      plan.popular
                        ? "bg-rose-100 hover:bg-rose-200 text-slate-900"
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                    }`}
                    disabled={membershipType === plan.membershipKey}
                  >
                    {membershipType === plan.membershipKey ? "Plan Actual" : `Elegir ${plan.name}`}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-10">
            <p className="text-slate-500 text-sm leading-relaxed font-light">
              Si no encuentras el bolso perfecto para ti, agenda una cita personalizada con nuestro Fashion Stylist para
              una experiencia completamente personalizada.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}

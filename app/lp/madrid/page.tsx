import type { Metadata } from "next"
import LandingMadrid from "./landing-madrid"
import { madridFaqs } from "../faq-content"

// Forzar render dinamico para evitar HTML cacheado tras edits.
export const dynamic = "force-dynamic"
export const revalidate = 0

// title.absolute: el titulo ya termina en "SEMZO PRIVÉ", evitamos el template
// "%s | Semzo Privé" del layout (mismo patron que /, /proceso, /blog, /catalog).
const TITLE = "Alquiler de Bolsos de Lujo en Madrid | Chanel, Dior, Louis Vuitton | SEMZO PRIVÉ"
const DESCRIPTION =
  "Alquiler de bolsos de lujo en Madrid: Chanel, Louis Vuitton, Dior y Loewe desde 59€/mes. Sin permanencia, bolsos originales verificados y entrega y recogida en toda la Comunidad de Madrid."

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  robots: { index: true, follow: true },
  alternates: {
    canonical: "https://semzoprive.com/lp/madrid",
  },
  // OG propio: si no, hereda el de la portada y al compartir sale el titulo generico.
  openGraph: {
    type: "website",
    url: "https://semzoprive.com/lp/madrid",
    siteName: "Semzo Privé",
    locale: "es_ES",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "https://semzoprive.com/images/hero-luxury-bags.jpeg",
        width: 1200,
        height: 630,
        alt: "Bolsos de lujo Chanel, Louis Vuitton y Dior de la colección Semzo Privé",
      },
    ],
  },
}

// Datos estructurados propios de la pagina: el servicio con sus cuatro planes (precios reales
// de la landing) y las preguntas frecuentes visibles en la pagina (mismo texto).
const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Alquiler de bolsos de lujo por membresía en Madrid",
    serviceType: "Alquiler de bolsos de diseñador por suscripción",
    provider: { "@type": "Organization", name: "Semzo Privé", url: "https://semzoprive.com" },
    areaServed: { "@type": "AdministrativeArea", name: "Comunidad de Madrid" },
    url: "https://semzoprive.com/lp/madrid",
    offers: [
      { name: "Petite", price: "19.99" },
      { name: "Essentiel", price: "59" },
      { name: "Signature", price: "149" },
      { name: "Privé", price: "279" },
    ].map((plan) => ({
      "@type": "Offer",
      name: `Membresía ${plan.name}`,
      price: plan.price,
      priceCurrency: "EUR",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: plan.price,
        priceCurrency: "EUR",
        unitText: "MONTH",
      },
    })),
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: madridFaqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  },
]

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LandingMadrid />
    </>
  )
}

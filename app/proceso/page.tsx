import type { Metadata } from "next"
import ProcesoClient from "./proceso-client"
import esMessages from "@/messages/es.json"

// ISR: Revalidate every hour (3600 seconds) - static content, reduces invocations
export const revalidate = 3600

// title.absolute: el titulo ya termina en "SEMZO PRIVÉ", evitamos el template
// "%s | Semzo Privé" del layout.
const PROCESO_TITLE = "Cómo Funciona el Alquiler de Bolsos de Lujo | SEMZO PRIVÉ"
const PROCESO_DESCRIPTION =
  "Cómo alquilar un bolso de lujo con SEMZO PRIVÉ: elige tu membresía, escoge tu bolso, recíbelo en 24-48h y cámbialo cuando quieras. Sin permanencia."

export const metadata: Metadata = {
  title: {
    absolute: PROCESO_TITLE,
  },
  description: PROCESO_DESCRIPTION,
  alternates: {
    canonical: "https://semzoprive.com/proceso",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    title: PROCESO_TITLE,
    description: PROCESO_DESCRIPTION,
    url: "https://semzoprive.com/proceso",
    siteName: "Semzo Privé",
    images: [
      {
        url: "https://semzoprive.com/images/hero-luxury-bags.jpeg",
        width: 1200,
        height: 630,
        alt: "Proceso de alquiler de bolsos Semzo Privé",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: PROCESO_TITLE,
    description: PROCESO_DESCRIPTION,
    images: ["https://semzoprive.com/images/hero-luxury-bags.jpeg"],
  },
}

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: (esMessages.proceso.faqs as { q: string; a: string }[]).map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
}

export default function ProcesoPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <ProcesoClient />
    </>
  )
}

import type { Metadata } from "next"
import type { ReactNode } from "react"
import { faqCategoriesData } from "./faq-data"

// Layout server-side de /support. Hace dos cosas que la pagina cliente no puede:
//   1. Metadata SEO (title, description, canonical, OG, twitter).
//   2. Inyecta JSON-LD FAQPage schema en el HTML inicial - esto es lo que
//      ChatGPT, Perplexity, Google AI Overview leen para citar respuestas.
// Sin schema, las IAs ven las preguntas como texto cualquiera; con schema,
// las identifican como datos estructurados y las citan en sus respuestas.

export const metadata: Metadata = {
  title: "Centro de Ayuda Semzo Privé | Preguntas Frecuentes",
  description:
    "Respuestas a tus preguntas sobre el alquiler de bolsos de lujo en Semzo Privé: membresías, reservas, entrega en Marbella y Málaga, autenticidad, devoluciones y pagos.",
  alternates: {
    canonical: "https://semzoprive.com/support",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    title: "Centro de Ayuda Semzo Privé | Preguntas Frecuentes",
    description:
      "Resuelve tus dudas sobre el alquiler de bolsos de lujo: membresías, autenticidad, entregas, devoluciones y mucho más.",
    url: "https://semzoprive.com/support",
    siteName: "Semzo Privé",
  },
  twitter: {
    card: "summary_large_image",
    title: "Centro de Ayuda Semzo Privé",
    description: "Preguntas frecuentes sobre el alquiler de bolsos de lujo en Semzo Privé.",
  },
}

// Construye el JSON-LD FAQPage a partir de los datos reales de la pagina.
// Aplanamos todas las categorias en una unica lista de mainEntity, que es
// lo que espera el schema FAQPage.
function buildFaqJsonLd() {
  const mainEntity = faqCategoriesData.flatMap((category) =>
    category.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  )

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity,
  }
}

export default function SupportLayout({ children }: { children: ReactNode }) {
  const jsonLd = buildFaqJsonLd()

  return (
    <>
      {/* JSON-LD FAQPage: lo lee Google (rich snippet) y las IAs (citacion) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  )
}

import type { Metadata } from "next"
import ProcesoClient from "./proceso-client"

// ISR: Revalidate every hour (3600 seconds) - static content, reduces invocations
export const revalidate = 3600

export const metadata: Metadata = {
  title: "Cómo funciona SEMZO PRIVÉ | Alquiler de bolsos de lujo",
  description:
    "Descubre cómo acceder, usar y rotar bolsos de diseñador con una membresía flexible. Lujo inteligente sin acumulación.",
  alternates: {
    canonical: "https://semzoprive.com/proceso",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    title: "Cómo funciona SEMZO PRIVÉ | Alquiler de bolsos de lujo",
    description:
      "Descubre cómo acceder, usar y rotar bolsos de diseñador con una membresía flexible. Lujo inteligente sin acumulación.",
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
    title: "Cómo funciona SEMZO PRIVÉ | Alquiler de bolsos de lujo",
    description:
      "Descubre cómo acceder, usar y rotar bolsos de diseñador con una membresía flexible. Lujo inteligente sin acumulación.",
    images: ["https://semzoprive.com/images/hero-luxury-bags.jpeg"],
  },
}

export default function ProcesoPage() {
  return <ProcesoClient />
}

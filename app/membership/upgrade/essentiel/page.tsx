import type { Metadata } from "next"
import EssentielUpgradeClient from "./EssentielUpgradeClient"

export const metadata: Metadata = {
  title: "Membresía L'Essentiel | Bolsos de diseñador | SEMZO PRIVÉ",
  description:
    "Acceso esencial a bolsos de diseñador con la membresía L'Essentiel. Rotación flexible y experiencia de lujo curada.",
  alternates: {
    canonical: "https://semzoprive.com/membership/upgrade/essentiel",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    title: "Membresía L'Essentiel | Bolsos de diseñador | SEMZO PRIVÉ",
    description:
      "Acceso esencial a bolsos de diseñador con la membresía L'Essentiel. Rotación flexible y experiencia de lujo curada.",
    url: "https://semzoprive.com/membership/upgrade/essentiel",
    siteName: "Semzo Privé",
    images: [
      {
        url: "https://semzoprive.com/images/hero-luxury-bags.jpeg",
        width: 1200,
        height: 630,
        alt: "Membresía L'Essentiel - Semzo Privé",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Membresía L'Essentiel | Bolsos de diseñador | SEMZO PRIVÉ",
    description:
      "Acceso esencial a bolsos de diseñador con la membresía L'Essentiel. Rotación flexible y experiencia de lujo curada.",
    images: ["https://semzoprive.com/images/hero-luxury-bags.jpeg"],
  },
}

export default function EssentielUpgradePage() {
  return <EssentielUpgradeClient />
}

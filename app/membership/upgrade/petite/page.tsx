import type { Metadata } from "next"
import PetiteUpgradeClient from "./PetiteUpgradeClient"

export const metadata: Metadata = {
  title: "Membresía Petite | Bolsos de diseñador | SEMZO PRIVÉ",
  description:
    "1 bolso por semana, sin compromiso. La membresía Petite es perfecta para descubrir el alquiler de bolsos de lujo.",
  alternates: {
    canonical: "https://semzoprive.com/membership/upgrade/petite",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    title: "Membresía Petite | Bolsos de diseñador | SEMZO PRIVÉ",
    description:
      "1 bolso por semana, sin compromiso. La membresía Petite es perfecta para descubrir el alquiler de bolsos de lujo.",
    url: "https://semzoprive.com/membership/upgrade/petite",
    siteName: "Semzo Privé",
    images: [
      {
        url: "https://semzoprive.com/images/hero-luxury-bags.jpeg",
        width: 1200,
        height: 630,
        alt: "Membresía Petite - Semzo Privé",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Membresía Petite | Bolsos de diseñador | SEMZO PRIVÉ",
    description:
      "1 bolso por semana, sin compromiso. La membresía Petite es perfecta para descubrir el alquiler de bolsos de lujo.",
    images: ["https://semzoprive.com/images/hero-luxury-bags.jpeg"],
  },
}

export default function PetiteUpgradePage() {
  return <PetiteUpgradeClient />
}

import type { Metadata } from "next"
import PriveUpgradeClient from "./prive-upgrade-client"

export const metadata: Metadata = {
  title: "Membresía Privé | Bolsos de diseñador | SEMZO PRIVÉ",
  description:
    "Acceso VIP a bolsos de diseñador con la membresía Privé. Rotación flexible y experiencia de lujo curada.",
  alternates: {
    canonical: "https://semzoprive.com/membership/upgrade/prive",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    title: "Membresía Privé | Bolsos de diseñador | SEMZO PRIVÉ",
    description:
      "Acceso VIP a bolsos de diseñador con la membresía Privé. Rotación flexible y experiencia de lujo curada.",
    url: "https://semzoprive.com/membership/upgrade/prive",
    siteName: "Semzo Privé",
    images: [
      {
        url: "https://semzoprive.com/images/hero-luxury-bags.jpeg",
        width: 1200,
        height: 630,
        alt: "Membresía Privé - Semzo Privé",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Membresía Privé | Bolsos de diseñador | SEMZO PRIVÉ",
    description:
      "Acceso VIP a bolsos de diseñador con la membresía Privé. Rotación flexible y experiencia de lujo curada.",
    images: ["https://semzoprive.com/images/hero-luxury-bags.jpeg"],
  },
}

export default function PriveUpgradePage() {
  return <PriveUpgradeClient />
}

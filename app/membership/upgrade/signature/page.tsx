import type { Metadata } from "next"
import SignatureUpgradeClient from "./SignatureUpgradeClient"

export const metadata: Metadata = {
  title: "Membresía Signature | Bolsos de diseñador | SEMZO PRIVÉ",
  description:
    "Acceso premium a bolsos de diseñador con la membresía Signature. Rotación flexible y experiencia de lujo curada.",
  alternates: {
    canonical: "https://semzoprive.com/membership/upgrade/signature",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    title: "Membresía Signature | Bolsos de diseñador | SEMZO PRIVÉ",
    description:
      "Acceso premium a bolsos de diseñador con la membresía Signature. Rotación flexible y experiencia de lujo curada.",
    url: "https://semzoprive.com/membership/upgrade/signature",
    siteName: "Semzo Privé",
    images: [
      {
        url: "https://semzoprive.com/images/hero-luxury-bags.jpeg",
        width: 1200,
        height: 630,
        alt: "Membresía Signature - Semzo Privé",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Membresía Signature | Bolsos de diseñador | SEMZO PRIVÉ",
    description:
      "Acceso premium a bolsos de diseñador con la membresía Signature. Rotación flexible y experiencia de lujo curada.",
    images: ["https://semzoprive.com/images/hero-luxury-bags.jpeg"],
  },
}

export default function SignatureUpgradePage() {
  return <SignatureUpgradeClient />
}

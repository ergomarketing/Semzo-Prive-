import type { Metadata } from "next"
import MembershipUpgradeClientPage from "./clientPage"

export const metadata: Metadata = {
  title: "Membresías de bolsos de lujo | SEMZO PRIVÉ",
  description:
    "Elige tu membresía y accede a bolsos de diseñador icónicos. Club privado, flexibilidad total y lujo consciente.",
  alternates: {
    canonical: "https://semzoprive.com/membership/upgrade",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    title: "Membresías de bolsos de lujo | SEMZO PRIVÉ",
    description:
      "Elige tu membresía y accede a bolsos de diseñador icónicos. Club privado, flexibilidad total y lujo consciente.",
    url: "https://semzoprive.com/membership/upgrade",
    siteName: "Semzo Privé",
    images: [
      {
        url: "https://semzoprive.com/images/hero-luxury-bags.jpeg",
        width: 1200,
        height: 630,
        alt: "Membresías Semzo Privé",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Membresías de bolsos de lujo | SEMZO PRIVÉ",
    description:
      "Elige tu membresía y accede a bolsos de diseñador icónicos. Club privado, flexibilidad total y lujo consciente.",
    images: ["https://semzoprive.com/images/hero-luxury-bags.jpeg"],
  },
}

export default function MembershipUpgradePage() {
  return <MembershipUpgradeClientPage />
}

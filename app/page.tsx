import type { Metadata } from "next"
import ClientHomePage from "./client-page"

// ISR: Revalidate every 10 minutes (600 seconds) - reduces function invocations
export const revalidate = 600

export const metadata: Metadata = {
  title: "SEMZO PRIVÉ | Club de bolsos de diseñador por suscripción",
  description:
    "Accede a bolsos de diseñador icónicos mediante una membresía exclusiva. Lujo consciente, rotación inteligente y estilo europeo.",
  alternates: {
    canonical: "https://semzoprive.com",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    title: "SEMZO PRIVÉ | Club de bolsos de diseñador por suscripción",
    description:
      "Accede a bolsos de diseñador icónicos mediante una membresía exclusiva. Lujo consciente, rotación inteligente y estilo europeo.",
    url: "https://semzoprive.com",
    siteName: "Semzo Privé",
    images: [
      {
        url: "https://semzoprive.com/images/hero-luxury-bags.jpeg",
        width: 1200,
        height: 630,
        alt: "Semzo Privé - Club de bolsos de diseñador",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SEMZO PRIVÉ | Club de bolsos de diseñador por suscripción",
    description:
      "Accede a bolsos de diseñador icónicos mediante una membresía exclusiva. Lujo consciente, rotación inteligente y estilo europeo.",
    images: ["https://semzoprive.com/images/hero-luxury-bags.jpeg"],
  },
}

export default function HomePage() {
  return <ClientHomePage />
}

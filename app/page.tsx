import type { Metadata } from "next"
import ClientHomePage from "./client-page"

// ISR: Revalidate every 10 minutes (600 seconds) - reduces function invocations
export const revalidate = 600

// `title.absolute` evita que se aplique el template "%s | Semzo Privé" del
// layout (el title ya termina en "SEMZO PRIVÉ").
const HOME_TITLE =
  "Alquiler de Bolsos de Lujo en España | Chanel, Louis Vuitton, Dior | SEMZO PRIVÉ"
const HOME_DESCRIPTION =
  "Accede a bolsos Chanel, Louis Vuitton, Dior, Prada y Loewe desde 59,99€/mes. Club privado de membresía. Envío gratuito en 24h. Sin permanencia."

export const metadata: Metadata = {
  title: {
    absolute: HOME_TITLE,
  },
  description: HOME_DESCRIPTION,
  alternates: {
    canonical: "https://semzoprive.com",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
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
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: ["https://semzoprive.com/images/hero-luxury-bags.jpeg"],
  },
}

export default function HomePage() {
  return <ClientHomePage />
}

import type { Metadata } from "next"
import ProcesoClient from "./proceso-client"

// ISR: Revalidate every hour (3600 seconds) - static content, reduces invocations
export const revalidate = 3600

// title.absolute: el titulo ya termina en "SEMZO PRIVÉ", evitamos el template
// "%s | Semzo Privé" del layout.
const PROCESO_TITLE = "Cómo Funciona el Alquiler de Bolsos de Lujo | SEMZO PRIVÉ"
const PROCESO_DESCRIPTION =
  "Elige tu membresía, selecciona tu bolso favorito y recíbelo en casa. Cambio cuando quieras. Así funciona SEMZO PRIVÉ, el club privado de bolsos de diseñador."

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

export default function ProcesoPage() {
  return <ProcesoClient />
}

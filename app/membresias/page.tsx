import type { Metadata } from "next"
import MembershipSection from "../components/membership-section"
import HowItWorks from "../components/how-it-works"

// ISR: contenido casi estatico (planes). Revalida cada hora.
export const revalidate = 3600

// title.absolute: el titulo ya termina en "SEMZO PRIVÉ", evitamos el template
// "%s | Semzo Privé" del layout.
const MEMBRESIAS_TITLE =
  "Membresías de Alquiler de Bolsos de Lujo | Petite, Essentiel, Signature | SEMZO PRIVÉ"
const MEMBRESIAS_DESCRIPTION =
  "Planes desde 19,99€/mes. Petite para ocasiones especiales, Essentiel para uso frecuente, Signature y Privé sin límites. Sin permanencia. Cancela cuando quieras."

export const metadata: Metadata = {
  title: {
    absolute: MEMBRESIAS_TITLE,
  },
  description: MEMBRESIAS_DESCRIPTION,
  alternates: {
    canonical: "https://semzoprive.com/membresias",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    title: MEMBRESIAS_TITLE,
    description: MEMBRESIAS_DESCRIPTION,
    url: "https://semzoprive.com/membresias",
    siteName: "Semzo Privé",
    images: [
      {
        url: "https://semzoprive.com/images/hero-luxury-bags.jpeg",
        width: 1200,
        height: 630,
        alt: "Membresías Semzo Privé — Petite, Essentiel, Signature y Privé",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: MEMBRESIAS_TITLE,
    description: MEMBRESIAS_DESCRIPTION,
    images: ["https://semzoprive.com/images/hero-luxury-bags.jpeg"],
  },
}

export default function MembresiasPage() {
  return (
    <main className="min-h-screen pt-20">
      <MembershipSection />
      <HowItWorks />
    </main>
  )
}

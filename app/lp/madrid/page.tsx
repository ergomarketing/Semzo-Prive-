import type { Metadata } from "next"
import LandingMadrid from "./landing-madrid"

// Forzar render dinamico para evitar HTML cacheado tras edits.
export const dynamic = "force-dynamic"
export const revalidate = 0

// title.absolute: el titulo ya termina en "SEMZO PRIVÉ", evitamos el template
// "%s | Semzo Privé" del layout (mismo patron que /, /proceso, /blog, /catalog).
const TITLE = "Alquiler de Bolsos de Lujo en Madrid | Chanel, Dior, Louis Vuitton | SEMZO PRIVÉ"
const DESCRIPTION =
  "Alquila bolsos Chanel, Louis Vuitton, Dior y Loewe en Madrid desde 59€/mes. Entrega en 24h. Sin permanencia. El club privado de bolsos de diseñador."

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  robots: { index: true, follow: true },
  alternates: {
    canonical: "https://semzoprive.com/lp/madrid",
  },
}

export default function Page() {
  return <LandingMadrid />
}

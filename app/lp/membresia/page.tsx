import type { Metadata } from "next"
import LandingMembresia from "./landing-membresia"

// Forzar render dinamico para evitar HTML cacheado tras edits.
export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata: Metadata = {
  title: "Membresía Semzo Privé | Bolsos icónicos sin comprarlos",
  description:
    "Club exclusivo de bolsos originales verificados desde 59€/mes, sin permanencia. Descubre, rota o quédate el bolso: tu cuota suma hacia la compra.",
  // Landing solo para Google Ads: no se indexa, para no competir con /lp/madrid ni con la portada.
  // AdsBot sigue pudiendo leerla (noindex no lo bloquea).
  robots: { index: false, follow: true },
  alternates: {
    canonical: "https://semzoprive.com/lp/membresia",
  },
}

export default function Page() {
  return <LandingMembresia />
}

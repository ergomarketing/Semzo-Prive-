import type { Metadata } from "next"
import LandingMembresia from "./landing-membresia"

// Forzar render dinamico para evitar HTML cacheado tras edits.
export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata: Metadata = {
  title: "Membresia Semzo Prive | Bolsos iconicos sin comprarlos",
  description:
    "Accede a bolsos de lujo autenticos con membresia mensual desde 59€. Cambialos cuando quieras. Hazlos tuyos si te enamoras.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: "https://www.semzoprive.com/lp/membresia",
  },
}

export default function Page() {
  return <LandingMembresia />
}

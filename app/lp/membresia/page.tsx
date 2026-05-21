import type { Metadata } from "next"
import LandingMembresia from "./landing-membresia"

// SEO: landing exclusiva para Google Ads, no debe aparecer en organico.
export const metadata: Metadata = {
  title: "Membresia Semzo Prive | Bolsos iconicos sin comprarlos",
  description:
    "Accede a bolsos de lujo autenticos con membresia mensual desde 59€. Cambialos cuando quieras. Hazlos tuyos si te enamoras.",
  robots: { index: false, follow: false, nocache: true },
}

export default function Page() {
  return <LandingMembresia />
}

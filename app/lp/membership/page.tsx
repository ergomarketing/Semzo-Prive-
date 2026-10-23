import type { Metadata } from "next"
import LandingMembership from "./landing-membership"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata: Metadata = {
  title: "Semzo Prive Membership | Iconic handbags without buying them",
  description:
    "Access authentic luxury handbags with a monthly membership from €59. Swap whenever you like. Make them yours if you fall in love.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: "https://semzoprive.com/lp/membership",
    languages: {
      es: "https://semzoprive.com/lp/membresia",
      en: "https://semzoprive.com/lp/membership",
    },
  },
}

export default function Page() {
  return <LandingMembership />
}

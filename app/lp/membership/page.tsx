import type { Metadata } from "next"
import LandingMembership from "./landing-membership"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata: Metadata = {
  title: "Semzo Privé Membership | Iconic handbags without buying them",
  description:
    "Exclusive club of verified original handbags from €59/month, no lock-in. Discover, rotate or keep the bag: your fee adds up towards buying it.",
  // Ads-only landing, same as /lp/membresia: not indexed so it does not compete with /lp/madrid or the home page.
  // AdsBot can still read it (noindex does not block it).
  robots: { index: false, follow: true },
  alternates: {
    canonical: "https://semzoprive.com/lp/membership",
  },
}

export default function Page() {
  return <LandingMembership />
}

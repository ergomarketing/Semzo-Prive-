import type { Metadata } from "next"
import InvitationClient from "./invitation-client"

export const metadata: Metadata = {
  title: "Exclusive Invitation | SEMZO PRIVÉ",
  description:
    "You have been invited to join our exclusive circle. Enjoy 50% off your first membership.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function InvitationPage() {
  return <InvitationClient />
}

import type { Metadata } from "next"
import BlackFridayClient from "./black-friday-client"

export const metadata: Metadata = {
  title: { absolute: "Invitación Black Friday Privé | Semzo Privé" },
  robots: {
    index: false,
    follow: false,
  },
}

export default function BlackFridayPage() {
  return <BlackFridayClient />
}

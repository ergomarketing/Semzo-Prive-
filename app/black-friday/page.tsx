import type { Metadata } from "next"
import BlackFridayClient from "./black-friday-client"

export const metadata: Metadata = {
  title: { absolute: "Black Friday Privé: tres meses, pagas dos | Semzo Privé" },
  description:
    "Membresía trimestral de bolsos de lujo con el código BLACKPRIVE: tres meses, pagas dos. Hasta el lunes 30 a medianoche.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function BlackFridayPage() {
  return <BlackFridayClient />
}

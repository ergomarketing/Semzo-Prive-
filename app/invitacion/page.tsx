import type { Metadata } from "next"
import InvitacionClient from "./invitacion-client"

export const metadata: Metadata = {
  title: "Invitación Exclusiva | SEMZO PRIVÉ",
  description:
    "Has sido invitado a formar parte de nuestro círculo exclusivo. Disfruta de 50% de descuento en tu primera membresía.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function InvitacionPage() {
  return <InvitacionClient />
}

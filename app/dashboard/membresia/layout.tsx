import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Mi Membresía | Semzo Privé",
  description: "Gestiona tu membresía de Semzo Privé",
}

export default function MembresiaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

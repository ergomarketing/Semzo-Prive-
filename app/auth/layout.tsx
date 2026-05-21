import type { Metadata } from "next"
import type { ReactNode } from "react"

// SEO: zona privada/transaccional sin contenido indexable.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
}

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>
}

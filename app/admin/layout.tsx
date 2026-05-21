import type React from "react"
import type { Metadata } from "next"
import AdminLayoutClient from "./layout-client"

// SEO: admin es zona privada, no debe indexarse.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>
}

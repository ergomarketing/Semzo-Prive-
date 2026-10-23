"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"

/**
 * Pestañas de "Perfil y envio": el menu lateral tiene una sola entrada para las dos paginas
 * (/dashboard/perfil y /dashboard/envio) y estas pestañas permiten pasar de una a otra.
 */
export function AccountTabs() {
  const pathname = usePathname()
  const t = useTranslations("dashboardLayout")
  const tabs = [
    { href: "/dashboard/perfil", label: t("myProfile") },
    { href: "/dashboard/envio", label: t("shippingAddress") },
  ]
  return (
    <div className="mb-8 flex gap-6 border-b border-indigo-dark/10">
      {tabs.map((tab) => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`-mb-px border-b-2 pb-3 text-sm font-serif transition-colors ${
              active
                ? "border-[#b08d57] text-indigo-dark"
                : "border-transparent text-slate-500 hover:text-indigo-dark"
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}

"use client"

import { useTranslations } from "next-intl"

export default function CatalogHero() {
  const t = useTranslations("catalog")
  return (
    <div className="bg-gradient-to-b from-rose-nude/10 to-white py-12">
      <div className="container mx-auto px-4 text-center">
        <h1 className="font-serif text-4xl md:text-5xl text-slate-900 mb-6">{t("heroTitle")}</h1>
        <p className="text-lg text-slate-600 max-w-3xl mx-auto">{t("heroSubtitle")}</p>
      </div>
    </div>
  )
}

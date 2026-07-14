"use client"

import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"

export function BlogHero() {
  const t = useTranslations("blog")
  return (
    <div className="relative z-10 text-center max-w-3xl mx-auto px-4">
      <Badge className="bg-white/90 backdrop-blur-sm text-indigo-dark border-0 mb-6">{t("badge")}</Badge>
      <h1 className="text-4xl md:text-6xl font-serif text-white mb-6">{t("heroTitle")}</h1>
      <p className="text-lg md:text-xl text-white/90">{t("heroSubtitle")}</p>
    </div>
  )
}

export function BlogSectionIntro() {
  const t = useTranslations("blog")
  return <p className="text-lg text-indigo-dark/70 mb-8">{t("sectionIntro")}</p>
}

export function BlogEmptyState() {
  const t = useTranslations("blog")
  return (
    <div className="text-center py-12">
      <p className="text-gray-500 text-lg">{t("emptyTitle")}</p>
      <p className="text-sm text-gray-400 mt-2">{t("emptySubtitle")}</p>
    </div>
  )
}

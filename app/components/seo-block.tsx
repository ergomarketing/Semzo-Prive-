"use client"

import { useTranslations } from "next-intl"

export default function SEOBlock() {
  const t = useTranslations("seoBlock")

  return (
    <section className="bg-white py-16 md:py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <h2 className="font-serif text-2xl md:text-3xl text-indigo-dark mb-6 text-center">
          {t("title")}
        </h2>
        <div className="prose prose-slate max-w-none text-center">
          <p className="text-slate-600 leading-relaxed mb-4">{t("p1")}</p>
          <p className="text-slate-600 leading-relaxed">{t("p2")}</p>
        </div>
      </div>
    </section>
  )
}

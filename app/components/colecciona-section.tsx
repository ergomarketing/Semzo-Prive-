"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Diamond } from "lucide-react"
import { useTranslations } from "next-intl"

/**
 * Seccion "Colecciona" — vive solo en /membresias, entre el bloque de
 * planes y HowItWorks. Presenta el credito de compra acumulado (rent-to-own)
 * sin usar esa jerga tecnica: se explica como una opcion sin presion.
 * CTA apunta a "#" hasta que exista /colecciona.
 */
export default function ColeccionaSection() {
  const t = useTranslations("colecciona")

  const pillars = [
    { label: t("pillar1Label"), text: t("pillar1Text") },
    { label: t("pillar2Label"), text: t("pillar2Text") },
    { label: t("pillar3Label"), text: t("pillar3Text") },
  ]

  return (
    <section className="bg-indigo-dark py-20 md:py-28">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Imagen + copy principal */}
        <div className="mb-16 grid items-center gap-10 md:mb-20 md:grid-cols-2 md:gap-16">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl md:aspect-[3/4]">
            <Image
              src="https://h0ayghjex33jktep.public.blob.vercel-storage.com/blog-images/fendi%20baguette%20colecciona.jpeg"
              alt="Bolso Fendi Baguette — Colecciona en Semzo Privé"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              loading="lazy"
            />
          </div>

          <div>
            <p className="mb-4 text-[10px] uppercase tracking-[0.4em] text-rose-pastel md:text-xs">
              {t("eyebrow")}
            </p>
            <h2 className="mb-6 font-serif text-3xl font-light leading-tight text-white md:text-5xl">
              {t("title")}
              <br />
              <span className="italic text-rose-pastel">{t("titleItalic")}</span>
            </h2>

            <div className="space-y-4 text-sm leading-relaxed text-white/80 md:text-base">
              <p>{t("body1")}</p>
              <p>{t("body2")}</p>
              <p>{t("body3")}</p>
              <p>{t("body4")}</p>
            </div>
          </div>
        </div>

        {/* Tres pilares */}
        <div className="grid gap-10 border-t border-white/10 pt-14 md:grid-cols-3 md:gap-8">
          {pillars.map((pillar) => (
            <div key={pillar.label} className="text-center">
              <Diamond className="mx-auto mb-4 h-5 w-5 text-rose-pastel" strokeWidth={1.5} />
              <h3 className="mb-2 text-xs font-medium uppercase tracking-[0.25em] text-white">{pillar.label}</h3>
              <p className="text-sm text-white/70">{pillar.text}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-14 text-center md:mt-16">
          <p className="mb-3 text-sm text-white/70">{t("ctaQuestion")}</p>
          <Link
            href="#"
            className="group inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-rose-pastel transition hover:text-white"
          >
            {t("ctaLink")}
            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  )
}

"use client"

import { Button } from "@/components/ui/button"
import { Shield, CheckCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useTranslations } from "next-intl"

export default function HeroSection() {
  const t = useTranslations("hero")
  return (
    // Hero compacto: antes ocupaba 100svh (pantalla completa) lo que
    // alargaba demasiado el scroll y aburria al usuario antes de llegar
    // al contenido de valor (membresias, coleccion).
    // Nuevas alturas:
    //   movil:   620px  -> caben titulo + subtitulo + 2 CTAs sin que la
    //                       imagen domine el viewport.
    //   tablet:  680px
    //   desktop: 78vh con tope de 760px (evita exceso en pantallas 4K).
    // Mantiene estabilidad CLS porque son valores fijos, no porcentuales del viewport movil.
    <section className="relative min-h-[620px] md:min-h-[680px] lg:min-h-[78vh] lg:max-h-[760px] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-luxury-bags-flatlay.jpeg"
          alt="Bolsos de lujo de diseñador"
          fill
          // CLS + Perf FIX: sizes preciso evita que Next.js sirva una imagen
          // de 1856x1306 cuando el viewport real solo necesita ~1382 (desktop).
          // Lighthouse reportaba 96.7 KiB desperdiciados con sizes="100vw".
          // Tope a 1400px en desktop ahorra ~50% del peso sin perder calidad.
          sizes="(min-width: 1280px) 1400px, 100vw"
          quality={80}
          className="object-cover object-center"
          priority
        />
        {/* Dark gradient overlay for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
      </div>

      {/* Content - paddings reducidos acorde a la nueva altura compacta */}
      <div className="container mx-auto px-4 pt-28 md:pt-32 pb-10 md:pb-16 relative z-10">
        <div className="max-w-4xl">
          {/* Contenido principal */}
          <div className="space-y-6 md:space-y-10 text-center lg:text-left">
            <div>
              <p className="text-xs uppercase tracking-widest text-white/80 mb-4 md:mb-6 font-medium">
                {t("eyebrow")}
              </p>
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light text-white leading-[1.1] tracking-tight">
                {t("headline1")}
                <br />
                <span className="text-rose-pastel">{t("headline2")}</span>
              </h1>
            </div>

            <p className="text-white/90 text-lg md:text-xl leading-relaxed font-light max-w-2xl mx-auto lg:mx-0">
              {t("subtext")}
            </p>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-6">
              <Button
                onClick={() => {
                  const membresiaSection = document.getElementById("membresias")
                  if (membresiaSection) {
                    membresiaSection.scrollIntoView({ behavior: "smooth" })
                  }
                }}
                className="w-full sm:w-auto rounded-none px-6 md:px-8 py-4 md:py-6 text-sm uppercase tracking-widest font-medium transition-all duration-300 bg-rose-pastel text-indigo-dark hover:bg-rose-pastel/90 hover:scale-105 transform"
              >
                {t("ctaPrimary")}
              </Button>
              <Link href="/catalog">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto rounded-none px-6 md:px-8 py-4 md:py-6 text-sm uppercase tracking-widest font-medium transition-all duration-300 border-2 border-white text-white hover:bg-white hover:text-indigo-dark hover:scale-105 transform bg-transparent"
                >
                  {t("ctaSecondary")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

"use client"

import Image from "next/image"
import { useTranslations } from "next-intl"

export default function HowItWorks() {
  const t = useTranslations("howItWorks")
  return (
    <section
      id="como-funciona"
      className="py-24"
      style={{
        background:
          "linear-gradient(135deg, #fff0f3 0%, rgba(248, 232, 235, 0.4) 25%, rgba(240, 216, 221, 0.3) 50%, rgba(232, 200, 207, 0.2) 75%, rgba(244, 196, 204, 0.1) 100%)",
      }}
    >
      <div className="container mx-auto px-4">
        {/* Encabezado editorial */}
        <div className="grid md:grid-cols-12 gap-8 mb-20">
          <div className="md:col-span-4">
            <p className="text-xs uppercase tracking-widest mb-6 font-medium" style={{ color: "#1a1a4b" }}>
              {t("eyebrow")}
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-light leading-tight" style={{ color: "#1a1a4b" }}>
              {t("title")}
            </h2>
          </div>
          <div className="md:col-span-1"></div>
          <div className="md:col-span-7">
            <p className="text-slate-600 text-lg leading-relaxed font-light">
              {t("subtitle")}
            </p>
          </div>
        </div>

        {/* Pasos en formato editorial */}
        <div className="grid md:grid-cols-3 gap-x-8 gap-y-16">
          <div
            className="pt-8 p-6 rounded-lg backdrop-blur-sm"
            style={{
              borderTop: "1px solid rgba(244, 196, 204, 0.3)",
              backgroundColor: "rgba(255, 240, 243, 0.3)",
            }}
          >
            <div className="text-xs uppercase tracking-widest mb-6 font-medium" style={{ color: "#1a1a4b" }}>
              {t("step1.label")}
            </div>

            {/* Imagen Chanel WOC */}
            <div className="relative w-full aspect-[4/3] mb-6 rounded-lg overflow-hidden">
              <Image
                src="/images/chanel-woc-step1.jpeg"
                alt="Chanel WOC - Selecciona tu membresía"
                fill
                className="object-cover"
              />
            </div>

            <h3 className="font-serif text-2xl mb-4" style={{ color: "#1a1a4b" }}>
              {t("step1.title")}
            </h3>
            <p className="text-slate-600 font-light">
              {t("step1.desc")}
            </p>
          </div>

          {/* Paso 02 */}
          <div
            className="pt-8 p-6 rounded-lg backdrop-blur-sm"
            style={{
              borderTop: "1px solid rgba(244, 196, 204, 0.3)",
              backgroundColor: "rgba(255, 240, 243, 0.3)",
            }}
          >
            <div className="text-xs uppercase tracking-widest mb-6 font-medium" style={{ color: "#1a1a4b" }}>
              {t("step2.label")}
            </div>

            <div className="relative w-full aspect-[4/3] mb-6 rounded-lg overflow-hidden">
              <Image
                src="/images/prada-street-step2.jpeg"
                alt="Prada - Explora nuestra colección"
                fill
                className="object-cover scale-125 object-[center_35%]"
              />
            </div>

            <h3 className="font-serif text-2xl mb-4" style={{ color: "#1a1a4b" }}>
              {t("step2.title")}
            </h3>
            <p className="text-slate-600 font-light">
              {t("step2.desc")}
            </p>
          </div>

          {/* Paso 03 */}
          <div
            className="pt-8 p-6 rounded-lg backdrop-blur-sm"
            style={{
              borderTop: "1px solid rgba(244, 196, 204, 0.3)",
              backgroundColor: "rgba(255, 240, 243, 0.3)",
            }}
          >
            <div className="text-xs uppercase tracking-widest mb-6 font-medium" style={{ color: "#1a1a4b" }}>
              {t("step3.label")}
            </div>

            <div className="relative w-full aspect-[4/3] mb-6 rounded-lg overflow-hidden">
              <Image
                src="/images/ysl-step3.jpg"
                alt="YSL - Recibe y disfruta"
                fill
                className="object-cover object-[center_60%]"
              />
            </div>

            <h3 className="font-serif text-2xl mb-4" style={{ color: "#1a1a4b" }}>
              {t("step3.title")}
            </h3>
            <p className="text-slate-600 font-light">
              {t("step3.desc")}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

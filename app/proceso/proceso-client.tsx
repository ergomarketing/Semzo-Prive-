"use client"

import Image from "next/image"
import Link from "next/link"
import MembershipSection from "@/app/components/membership-section"
import { useTranslations } from "next-intl"

const STEP_IMAGES = [
  { src: "/images/chanel-woc-step1.jpeg", className: "object-cover" },
  { src: "/images/prada-street-step2.jpeg", className: "object-cover scale-125 object-[center_35%]" },
  { src: "/images/ysl-step3.jpg", className: "object-cover object-[center_60%]" },
  { src: "/images/hero-luxury-bags.jpeg", className: "object-cover" },
]

const BRANDS = [
  "BOTTEGA VENETA",
  "CELINE",
  "CHANEL",
  "CHRISTIAN DIOR",
  "FENDI",
  "GUCCI",
  "HERMÈS",
  "LOEWE",
  "LOUIS VUITTON",
  "MIU MIU",
  "PRADA",
  "SAINT LAURENT",
]

export default function ProcesoClient() {
  const t = useTranslations("proceso")
  const steps = t.raw("steps") as { title: string; desc: string; features: string[] }[]
  const passes = t.raw("passes") as { name: string; desc: string; price: string }[]
  const perks = t.raw("perks") as string[]
  const faqs = t.raw("faqs") as { q: string; a: string }[]

  return (
    <div className="min-h-screen bg-white">
      <main className="pt-20">
        {/* Hero Section con estilo editorial */}
        <section
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
                <h1 className="font-serif text-4xl md:text-5xl font-light leading-tight" style={{ color: "#1a1a4b" }}>
                  {t("heroTitle")}
                </h1>
              </div>
              <div className="md:col-span-1"></div>
              <div className="md:col-span-7">
                <p className="text-slate-600 text-lg leading-relaxed font-light">{t("heroSubtitle")}</p>
              </div>
            </div>

            {/* Pasos en formato editorial - 4 tarjetas */}
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-16">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className="pt-8 p-6 rounded-lg backdrop-blur-sm"
                  style={{
                    borderTop: "1px solid rgba(244, 196, 204, 0.3)",
                    backgroundColor: "rgba(255, 240, 243, 0.3)",
                  }}
                >
                  <div className="text-xs uppercase tracking-widest mb-6 font-medium" style={{ color: "#1a1a4b" }}>
                    {t("stepLabel")} {String(idx + 1).padStart(2, "0")}
                  </div>

                  <div className="relative w-full aspect-[4/3] mb-6 rounded-lg overflow-hidden">
                    <Image
                      src={STEP_IMAGES[idx].src || "/placeholder.svg"}
                      alt={step.title}
                      fill
                      className={STEP_IMAGES[idx].className}
                    />
                  </div>

                  <h2 className="font-serif text-2xl mb-4" style={{ color: "#1a1a4b" }}>
                    {step.title}
                  </h2>
                  <p className="text-slate-600 font-light mb-4">{step.desc}</p>
                  <ul className="space-y-2 text-sm text-slate-600 font-light">
                    {step.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start">
                        <span className="mr-2" style={{ color: "#1a1a4b" }}>
                          •
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Marquee de Marcas — estilo editorial compacto */}
        <section className="py-8 md:py-10 bg-white overflow-hidden border-y border-slate-100">
          <div className="marquee-track flex items-center" style={{ color: "#1a1a4b" }}>
            {[...Array(2)].map((_, loop) => (
              <div key={loop} className="flex items-center shrink-0" aria-hidden={loop === 1}>
                {BRANDS.map((brand) => (
                  <span key={brand} className="flex items-center shrink-0">
                    <span className="font-serif text-base md:text-xl font-light tracking-wide px-6 md:px-8 whitespace-nowrap">
                      {brand}
                    </span>
                    <span className="text-sm font-light opacity-30">·</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* Planes — reutilizamos la sección de Membresías de la home */}
        <section className="proceso-memberships">
          <MembershipSection />
        </section>

        {/* Pases de Bolso — bloque editorial horizontal, pertenecen a Petite */}
        <section className="py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-12 gap-8 md:gap-12 max-w-6xl mx-auto items-center">
              {/* Imagen editorial */}
              <div className="md:col-span-5">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image
                    src="/images/jacquemus-le-chiquito.jpg"
                    alt="Pases de Bolso Semzo Privé"
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-xs uppercase tracking-[0.25em] mt-6 font-medium" style={{ color: "#1a1a4b" }}>
                  {t("passesExclusive")}
                </p>
              </div>

              {/* Contenido */}
              <div className="md:col-span-7">
                <h2
                  className="font-serif font-light leading-tight mb-6 text-3xl md:text-5xl tracking-tight"
                  style={{ color: "#1a1a4b" }}
                >
                  <em className="italic font-light">{t("passesTitle1")}</em>{" "}
                  <span className="font-medium uppercase tracking-wide">{t("passesTitle2")}</span>
                </h2>

                <p className="text-slate-600 font-light leading-relaxed mb-10 text-base md:text-lg">
                  {t("passesIntro")}
                </p>

                <ul className="space-y-6">
                  {passes.map((pass) => (
                    <li
                      key={pass.name}
                      className="flex items-baseline justify-between gap-6 pb-6 border-b"
                      style={{ borderColor: "rgba(26, 26, 75, 0.15)" }}
                    >
                      <div className="flex-1">
                        <h3 className="font-serif text-xl md:text-2xl font-light mb-1" style={{ color: "#1a1a4b" }}>
                          {t("passPrefix")} {pass.name}
                        </h3>
                        <p className="text-sm text-slate-600 font-light leading-relaxed">{pass.desc}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-serif text-2xl md:text-3xl font-light" style={{ color: "#1a1a4b" }}>
                          {pass.price}
                        </span>
                        <span className="text-xs text-slate-500 font-light ml-1">{t("perWeek")}</span>
                      </div>
                    </li>
                  ))}
                </ul>

                <p className="text-xs text-slate-500 font-light mt-8 leading-relaxed">{t("passesNote")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Beneficios — lista editorial centrada estilo cocoon */}
        <section className="py-16 md:py-20" style={{ backgroundColor: "#faf8f5" }}>
          <div className="container mx-auto px-4">
            <h2
              className="text-center font-serif font-light leading-tight mb-8 md:mb-10 text-2xl md:text-3xl tracking-tight"
              style={{ color: "#1a1a4b" }}
            >
              <span className="font-medium uppercase tracking-wide">{t("perksTitle1")}</span>{" "}
              <em className="italic font-light">{t("perksTitle2")}</em>
            </h2>

            <ul className="max-w-2xl mx-auto text-center space-y-2">
              {perks.map((perk) => (
                <li key={perk} className="font-serif text-base font-light leading-snug" style={{ color: "#3a3a5e" }}>
                  {perk}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQs — hairline editorial estilo cocoon */}
        <section id="faqs" className="py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4">
            <h2
              className="text-center font-serif font-light leading-tight mb-10 md:mb-14 text-3xl md:text-4xl tracking-tight"
              style={{ color: "#1a1a4b" }}
            >
              <span className="font-medium">{t("faqTitle1")}</span> <em className="italic font-light">{t("faqTitle2")}</em>
            </h2>

            <div className="max-w-3xl mx-auto">
              {faqs.map((faq, idx) => (
                <details key={idx} className="group border-b first:border-t" style={{ borderColor: "rgba(26, 26, 75, 0.15)" }}>
                  <summary
                    className="flex items-center justify-between py-4 md:py-5 cursor-pointer list-none"
                    style={{ color: "#1a1a4b" }}
                  >
                    <span className="font-serif text-base md:text-lg font-light pr-6 leading-snug">{faq.q}</span>
                    <span
                      className="flex-shrink-0 text-xl font-light transition-transform duration-300 group-open:rotate-45"
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </summary>
                  <div className="pb-5 pr-10 md:pr-12 -mt-1">
                    <p className="text-slate-600 font-light leading-relaxed text-base">{faq.a}</p>
                  </div>
                </details>
              ))}
            </div>

            <div className="text-center mt-10 md:mt-12">
              <Link
                href="/support#faq"
                className="inline-block uppercase tracking-[0.25em] text-xs font-semibold border-b-2 pb-1 hover:opacity-60 transition-opacity"
                style={{ color: "#1a1a4b", borderColor: "#1a1a4b" }}
              >
                {t("faqCta")}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

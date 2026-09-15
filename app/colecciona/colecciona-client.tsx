"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useTranslations } from "next-intl"

const HERO_IMAGE =
  "https://h0ayghjex33jktep.public.blob.vercel-storage.com/blog-images/fendi%20baguette%20colecciona.jpeg"

export default function ColeccionaClient() {
  const t = useTranslations("coleccionaPage")
  const howSteps = t.raw("howSteps") as { title: string; desc: string }[]
  const creditPlans = t.raw("creditPlans") as { name: string; monthly: string; credit: string }[]
  const faqs = t.raw("faqs") as { q: string; a: string }[]

  return (
    <div className="min-h-screen bg-white">
      <main className="pt-20">
        {/* Hero editorial — mismo degradado rosa suave que /proceso */}
        <section
          className="py-24"
          style={{
            background:
              "linear-gradient(135deg, #fff0f3 0%, rgba(248, 232, 235, 0.4) 25%, rgba(240, 216, 221, 0.3) 50%, rgba(232, 200, 207, 0.2) 75%, rgba(244, 196, 204, 0.1) 100%)",
          }}
        >
          <div className="container mx-auto px-4">
            <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
              <div className="max-w-xl">
                <p className="mb-6 text-xs font-medium uppercase tracking-widest" style={{ color: "#1a1a4b" }}>
                  {t("eyebrow")}
                </p>
                <h1
                  className="mb-6 font-serif text-4xl font-light leading-tight md:text-5xl"
                  style={{ color: "#1a1a4b" }}
                >
                  {t("heroTitle")}
                  <br />
                  <em className="italic">{t("heroTitleItalic")}</em>
                </h1>
                <p className="font-light text-lg leading-relaxed text-slate-600">{t("heroSubtitle")}</p>
              </div>

              <div className="relative aspect-[4/5] overflow-hidden rounded-lg md:aspect-[3/4]">
                <Image
                  src={HERO_IMAGE || "/placeholder.svg"}
                  alt="Bolso Fendi Baguette — Colecciona en Semzo Privé"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Como funciona — 3 pasos */}
        <section className="bg-white py-16 md:py-20">
          <div className="container mx-auto px-4">
            <h2
              className="mb-14 text-center font-serif text-3xl font-light leading-tight tracking-tight md:mb-16 md:text-4xl"
              style={{ color: "#1a1a4b" }}
            >
              <span className="font-medium uppercase tracking-wide">{t("howTitle1")}</span>{" "}
              <em className="italic font-light">{t("howTitle2")}</em>
            </h2>

            <div className="mx-auto grid max-w-5xl gap-x-8 gap-y-14 md:grid-cols-3">
              {howSteps.map((step, idx) => (
                <div key={step.title} className="text-center md:text-left">
                  <div className="mb-5 text-xs font-medium uppercase tracking-widest" style={{ color: "#1a1a4b" }}>
                    {String(idx + 1).padStart(2, "0")}
                  </div>
                  <h3 className="mb-3 font-serif text-xl font-light" style={{ color: "#1a1a4b" }}>
                    {step.title}
                  </h3>
                  <p className="font-light leading-relaxed text-slate-600">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Credito plan a plan — grid compacto, solo a modo de ejemplo visual */}
        <section className="py-14 md:py-16" style={{ backgroundColor: "#faf8f5" }}>
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl">
              <h2
                className="mb-3 text-center font-serif text-2xl font-light leading-tight tracking-tight md:text-3xl"
                style={{ color: "#1a1a4b" }}
              >
                <span className="font-medium uppercase tracking-wide">{t("creditTitle1")}</span>{" "}
                <em className="italic font-light">{t("creditTitle2")}</em>
              </h2>
              <p className="mx-auto mb-8 max-w-md text-center text-sm font-light leading-relaxed text-slate-600">
                {t("creditSubtitle")}
              </p>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {creditPlans.map((plan) => (
                  <div
                    key={plan.name}
                    className="rounded-sm border bg-white px-3 py-4 text-center"
                    style={{ borderColor: "rgba(26, 26, 75, 0.12)" }}
                  >
                    <p className="mb-2 text-[11px] font-medium uppercase tracking-wide" style={{ color: "#1a1a4b" }}>
                      {plan.name}
                    </p>
                    <p className="font-serif text-lg font-light md:text-xl" style={{ color: "#1a1a4b" }}>
                      {plan.credit}
                    </p>
                    <p className="mt-1 text-[10px] font-light text-slate-500">{t("creditAfter")}</p>
                  </div>
                ))}
              </div>

              <p className="mt-6 text-center text-[11px] font-light leading-relaxed text-slate-500">
                {t("creditNote")}
              </p>
            </div>
          </div>
        </section>

        {/* Cita editorial */}
        <section className="bg-indigo-dark py-20 md:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <p className="font-serif text-2xl font-light italic leading-relaxed text-white md:text-3xl">
                &ldquo;{t("quoteText")}&rdquo;
              </p>
            </div>
          </div>
        </section>

        {/* FAQs — mismo accordion hairline que /proceso */}
        <section className="bg-white py-16 md:py-20">
          <div className="container mx-auto px-4">
            <h2
              className="mb-10 text-center font-serif text-3xl font-light leading-tight tracking-tight md:mb-14 md:text-4xl"
              style={{ color: "#1a1a4b" }}
            >
              <span className="font-medium">{t("faqTitle1")}</span> <em className="italic font-light">{t("faqTitle2")}</em>
            </h2>

            <div className="mx-auto max-w-3xl">
              {faqs.map((faq) => (
                <details
                  key={faq.q}
                  className="group border-b first:border-t"
                  style={{ borderColor: "rgba(26, 26, 75, 0.15)" }}
                >
                  <summary
                    className="flex cursor-pointer list-none items-center justify-between py-4 md:py-5"
                    style={{ color: "#1a1a4b" }}
                  >
                    <span className="pr-6 font-serif text-base font-light leading-snug md:text-lg">{faq.q}</span>
                    <span
                      className="flex-shrink-0 text-xl font-light transition-transform duration-300 group-open:rotate-45"
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </summary>
                  <div className="-mt-1 pb-5 pr-10 md:pr-12">
                    <p className="text-base font-light leading-relaxed text-slate-600">{faq.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section
          className="py-20 md:py-24"
          style={{
            background:
              "linear-gradient(135deg, #fff0f3 0%, rgba(248, 232, 235, 0.4) 25%, rgba(240, 216, 221, 0.3) 50%, rgba(232, 200, 207, 0.2) 75%, rgba(244, 196, 204, 0.1) 100%)",
          }}
        >
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-xl text-center">
              <h2
                className="mb-4 font-serif text-3xl font-light leading-tight md:text-4xl"
                style={{ color: "#1a1a4b" }}
              >
                {t("ctaTitle")}
              </h2>
              <p className="mb-10 font-light leading-relaxed text-slate-600">{t("ctaSubtitle")}</p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/membresias"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-xs uppercase tracking-[0.25em] text-white transition hover:opacity-90"
                  style={{ backgroundColor: "#1a1a4b" }}
                >
                  {t("ctaPrimary")}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/catalog"
                  className="inline-flex items-center justify-center gap-2 border px-8 py-3.5 text-xs uppercase tracking-[0.25em] transition hover:opacity-70"
                  style={{ borderColor: "#1a1a4b", color: "#1a1a4b" }}
                >
                  {t("ctaSecondary")}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

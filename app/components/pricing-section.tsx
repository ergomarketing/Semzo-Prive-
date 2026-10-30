"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { useTranslations } from "next-intl"

const PLAN_STATIC = [
  {
    id: "essentiel",
    name: "L'Essentiel",
    priceMonthly: "59€",
    priceQuarterly: "142€",
    quarterlyDiscount: "20%",
    image: "/images/louis-vuitton-lessentiel.jpeg",
    imageAlt: "Louis Vuitton - L'Essentiel membership",
    brand: "Louis Vuitton",
    descKey: "essentielDesc" as const,
    brandDescKey: "essentielBrandDesc" as const,
    featureKeys: [
      "feature_bag1",
      "feature_shipping",
      "feature_insurance",
      "feature_unlimited",
      "feature_support",
    ] as const,
    popular: false,
  },
  {
    id: "signature",
    name: "Signature",
    priceMonthly: "149€",
    priceQuarterly: "357€",
    quarterlyDiscount: "20%",
    image: "/images/chanel-signature.jpeg",
    imageAlt: "Chanel - Signature membership",
    brand: "Chanel",
    descKey: "signatureDesc" as const,
    brandDescKey: "signatureBrandDesc" as const,
    featureKeys: [
      "feature_bag2",
      "feature_express",
      "feature_premium",
      "feature_unlimited",
      "feature_exclusive",
      "feature_shopper",
    ] as const,
    popular: true,
  },
  {
    id: "prive",
    name: "Privé",
    priceMonthly: "279€",
    priceQuarterly: "669€",
    quarterlyDiscount: "20%",
    image: "/images/hermes-prive.jpeg",
    imageAlt: "Hermès - Privé membership",
    brand: "Hermès",
    descKey: "priveDesc" as const,
    brandDescKey: "priveBrandDesc" as const,
    featureKeys: [
      "feature_bag3",
      "feature_sameday",
      "feature_premium",
      "feature_unlimited",
      "feature_vip",
      "feature_shopper",
      "feature_events",
      "feature_concierge",
    ] as const,
    popular: false,
  },
]

export default function PricingSection() {
  const t = useTranslations("pricing")
  const [billingCycle, setBillingCycle] = useState<"monthly" | "quarterly">("monthly")
  const [showPassInfoModal, setShowPassInfoModal] = useState(false)

  const handleSelectPlan = (planId: string) => {
    setShowPassInfoModal(true)
    sessionStorage.setItem("selectedPlanId", planId)
    sessionStorage.setItem("selectedBillingCycle", billingCycle)
  }

  const handleContinueToSignup = () => {
    const planId = sessionStorage.getItem("selectedPlanId")
    const billing = sessionStorage.getItem("selectedBillingCycle")
    window.location.href = `/signup?plan=${planId}&billing=${billing}`
  }

  return (
    <section id="membresias" className="py-24 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-8 font-serif leading-tight">
            {t("title")}
          </h2>
          <p className="text-xl md:text-2xl text-slate-600 max-w-4xl mx-auto leading-relaxed font-light">
            {t("subtitle")}
          </p>

          {/* Billing cycle toggle */}
          <div className="flex justify-center mt-10 mb-12">
            <div className="bg-white rounded-lg shadow-md p-2 inline-flex">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-6 py-3 rounded-md text-sm font-medium transition-all ${
                  billingCycle === "monthly"
                    ? "bg-indigo-dark text-white"
                    : "bg-transparent text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t("monthly")}
              </button>
              <button
                onClick={() => setBillingCycle("quarterly")}
                className={`px-6 py-3 rounded-md text-sm font-medium transition-all ${
                  billingCycle === "quarterly"
                    ? "bg-indigo-dark text-white"
                    : "bg-transparent text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t("quarterly")} <span className="text-xs font-bold text-rose-500">-20%</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-10 max-w-7xl mx-auto">
          {PLAN_STATIC.map((plan) => (
            <Card
              key={plan.id}
              className={`relative border-0 shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 bg-white ${
                plan.popular ? "ring-2 ring-rose-500 scale-105" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="bg-rose-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                    {t("mostPopular")}
                  </span>
                </div>
              )}

              <CardHeader className="text-center pb-6 bg-white px-8 pt-8">
                <CardTitle className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
                  {t("membershipLabel", { name: plan.name })}
                </CardTitle>
                <div className="mb-6">
                  <span className="text-5xl md:text-6xl font-bold text-slate-900">
                    {billingCycle === "monthly" ? plan.priceMonthly : plan.priceQuarterly}
                  </span>
                  <span className="text-xl ml-2 text-slate-600 font-medium">
                    {billingCycle === "monthly" ? t("perMonth") : t("perQuarter")}
                  </span>
                  {billingCycle === "quarterly" && (
                    <div className="mt-2 text-rose-500 font-medium">
                      {t("savingsLabel", { discount: plan.quarterlyDiscount })}
                    </div>
                  )}
                </div>
                <p className="text-lg text-slate-600 leading-relaxed">{t(plan.descKey)}</p>
              </CardHeader>

              {/* Imagen de la marca */}
              <div className="relative h-72 overflow-hidden bg-gray-50">
                <Image src={plan.image || "/placeholder.svg"} alt={plan.imageAlt} fill className="object-contain p-4" />
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm">
                  <div className="text-sm font-semibold text-slate-800">{plan.brand}</div>
                  <div className="text-xs text-slate-600 mt-1">{t(plan.brandDescKey)}</div>
                </div>
              </div>

              <CardContent className="px-8 pt-8 pb-8">
                <ul className="space-y-4 mb-10 text-slate-700">
                  {plan.featureKeys.map((key) => (
                    <li key={key} className="flex items-center text-base">
                      <Check className="h-5 w-5 mr-4 text-indigo-dark flex-shrink-0" />
                      <span className="leading-relaxed">{t(key)}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`w-full font-semibold py-4 text-lg transition-all duration-300 ${
                    plan.popular
                      ? "bg-rose-500 hover:bg-rose-600 text-white"
                      : "bg-slate-900 hover:bg-slate-800 text-white"
                  }`}
                >
                  {t("choosePlan", { name: plan.name })}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-16">
          <p className="text-slate-500 text-base leading-relaxed">{t("trialNote")}</p>
        </div>
      </div>

      {/* Modal bag passes */}
      {showPassInfoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">{t("passModalTitle")}</h3>
            <p className="text-slate-600 mb-6">
              {t("passModalDescBefore")}{" "}
              <strong>{t("passModalStrong")}</strong>{" "}
              {t("passModalDescAfter")}
            </p>

            <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">{t("passEssentiel")}</span>
                <span className="text-slate-900 font-bold">+52€/mes</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">{t("passSignature")}</span>
                <span className="text-slate-900 font-bold">+99€/mes</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">{t("passPrive")}</span>
                <span className="text-slate-900 font-bold">+137€/mes</span>
              </div>
            </div>

            <p className="text-sm text-slate-500 mb-6">{t("passModalNote")}</p>

            <div className="flex gap-3">
              <Button onClick={() => setShowPassInfoModal(false)} variant="outline" className="flex-1">
                {t("back")}
              </Button>
              <Button onClick={handleContinueToSignup} className="flex-1 bg-slate-900 hover:bg-slate-800">
                {t("continueSignup")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

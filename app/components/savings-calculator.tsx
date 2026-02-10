"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Slider } from "@/components/ui/slider"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, TrendingUp, ShoppingBag, Crown } from "lucide-react"
import Link from "next/link"

// Precios promedio de bolsos de lujo por categoría
const BAG_PRICES = {
  essentiel: { min: 800, max: 1500, avg: 1150 },
  signature: { min: 1500, max: 3500, avg: 2500 },
  prive: { min: 3500, max: 12000, avg: 7000 },
}

// Precios de membresías mensuales
const MEMBERSHIP_PRICES = {
  petite: 29,
  essentiel: 59,
  signature: 129,
  prive: 189,
}

// Nombres de membresías
const MEMBERSHIP_NAMES = {
  petite: "Petite",
  essentiel: "L'Essentiel",
  signature: "Signature",
  prive: "Privé",
}

export default function SavingsCalculator() {
  const [selectedTier, setSelectedTier] = useState<"essentiel" | "signature" | "prive">("signature")
  const [monthsUsing, setMonthsUsing] = useState(6)
  const [bagsPerYear, setBagsPerYear] = useState(4)

  const calculations = useMemo(() => {
    const bagPrice = BAG_PRICES[selectedTier].avg
    const membershipPrice = MEMBERSHIP_PRICES[selectedTier]

    // Costo de comprar los bolsos
    const buyingCost = bagsPerYear * bagPrice

    // Costo de la membresía anual
    const membershipCost = membershipPrice * 12

    // Ahorro anual
    const annualSavings = buyingCost - membershipCost

    // Porcentaje de ahorro
    const savingsPercent = Math.round((annualSavings / buyingCost) * 100)

    // Ahorro por mes
    const monthlySavings = Math.round(annualSavings / 12)

    // Número de bolsos "gratis" equivalentes
    const freeBagsEquivalent = Math.floor(annualSavings / bagPrice)

    return {
      buyingCost,
      membershipCost,
      annualSavings,
      savingsPercent,
      monthlySavings,
      freeBagsEquivalent,
      bagPrice,
    }
  }, [selectedTier, bagsPerYear])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <section className="py-24 bg-gradient-to-b from-white to-rose-nude/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 text-indigo-dark/70 text-sm font-medium tracking-widest uppercase mb-4">
              <Sparkles className="w-4 h-4" />
              Descubre tu ahorro
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-indigo-dark mb-6 text-balance">
              Calcula Cuánto Ahorras
            </h2>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Compara el costo de comprar bolsos de lujo vs. ser miembro de SEMZO Privé
            </p>
          </motion.div>
        </div>

        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="border-0 shadow-2xl bg-white overflow-hidden">
              <div className="grid lg:grid-cols-2 gap-0">
                {/* Left side - Controls */}
                <div className="p-8 md:p-12 bg-gradient-to-br from-indigo-dark to-indigo-dark/90">
                  <h3 className="text-2xl font-serif font-bold text-white mb-8">Personaliza tu cálculo</h3>

                  {/* Tier Selection */}
                  <div className="mb-10">
                    <label className="block text-rose-pastel/80 text-sm font-medium mb-4 uppercase tracking-wider">
                      Nivel de bolsos que te interesan
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(["essentiel", "signature", "prive"] as const).map((tier) => (
                        <button
                          key={tier}
                          onClick={() => setSelectedTier(tier)}
                          className={`py-4 px-3 rounded-xl font-medium transition-all duration-300 ${
                            selectedTier === tier
                              ? "bg-white text-indigo-dark shadow-lg scale-105"
                              : "bg-white/10 text-white/80 hover:bg-white/20"
                          }`}
                        >
                          <span className="block text-sm">
                            {tier === "essentiel" ? "L'Essentiel" : tier === "signature" ? "Signature" : "Privé"}
                          </span>
                          <span className="block text-xs mt-1 opacity-70">~{formatCurrency(BAG_PRICES[tier].avg)}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bags per year slider */}
                  <div className="mb-10">
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-rose-pastel/80 text-sm font-medium uppercase tracking-wider">
                        Bolsos que usarías al año
                      </label>
                      <span className="text-white font-bold text-2xl">{bagsPerYear}</span>
                    </div>
                    <Slider
                      value={[bagsPerYear]}
                      onValueChange={(value) => setBagsPerYear(value[0])}
                      min={1}
                      max={12}
                      step={1}
                      className="[&_[role=slider]]:bg-white [&_[role=slider]]:border-0 [&_[role=slider]]:shadow-lg [&_.bg-primary]:bg-rose-pastel"
                    />
                    <div className="flex justify-between text-xs text-white/50 mt-2">
                      <span>1 bolso</span>
                      <span>12 bolsos</span>
                    </div>
                  </div>

                  {/* Price info */}
                  <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <Crown className="w-5 h-5 text-rose-pastel" />
                      <span className="text-white font-medium">Membresía {MEMBERSHIP_NAMES[selectedTier]}</span>
                    </div>
                    <div className="text-3xl font-bold text-white">
                      {formatCurrency(MEMBERSHIP_PRICES[selectedTier])}
                      <span className="text-lg font-normal text-white/60">/mes</span>
                    </div>
                  </div>
                </div>

                {/* Right side - Results */}
                <div className="p-8 md:p-12 bg-rose-nude/20">
                  <h3 className="text-2xl font-serif font-bold text-indigo-dark mb-8">Tu ahorro estimado</h3>

                  {/* Comparison */}
                  <div className="space-y-6 mb-10">
                    <div className="flex justify-between items-center pb-4 border-b border-indigo-dark/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                          <ShoppingBag className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <span className="block text-sm text-slate-500">Comprando {bagsPerYear} bolsos</span>
                          <span className="block text-xs text-slate-400">
                            Precio promedio {formatCurrency(calculations.bagPrice)}
                          </span>
                        </div>
                      </div>
                      <span className="text-xl font-bold text-slate-900">
                        {formatCurrency(calculations.buyingCost)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pb-4 border-b border-indigo-dark/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          <Crown className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                          <span className="block text-sm text-slate-500">Con SEMZO Privé</span>
                          <span className="block text-xs text-slate-400">Membresía anual</span>
                        </div>
                      </div>
                      <span className="text-xl font-bold text-emerald-600">
                        {formatCurrency(calculations.membershipCost)}
                      </span>
                    </div>
                  </div>

                  {/* Savings highlight */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${selectedTier}-${bagsPerYear}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="bg-gradient-to-r from-indigo-dark to-indigo-dark/90 rounded-2xl p-6 text-center mb-8"
                    >
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-rose-pastel" />
                        <span className="text-rose-pastel/80 text-sm font-medium uppercase tracking-wider">
                          Ahorras al año
                        </span>
                      </div>
                      <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                        {formatCurrency(Math.max(0, calculations.annualSavings))}
                      </div>
                      {calculations.annualSavings > 0 && (
                        <div className="text-rose-pastel text-sm">
                          Equivale a {calculations.freeBagsEquivalent} bolsos gratis
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Stats row */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                      <span className="block text-3xl font-bold text-indigo-dark">
                        {calculations.savingsPercent > 0 ? calculations.savingsPercent : 0}%
                      </span>
                      <span className="block text-xs text-slate-500 mt-1">Porcentaje de ahorro</span>
                    </div>
                    <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                      <span className="block text-3xl font-bold text-indigo-dark">
                        {formatCurrency(Math.max(0, calculations.monthlySavings))}
                      </span>
                      <span className="block text-xs text-slate-500 mt-1">Ahorro mensual</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <Link href="/#membresias">
                    <Button className="w-full bg-indigo-dark hover:bg-indigo-dark/90 text-white py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                      Comenzar a Ahorrar
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 text-center"
          >
            <p className="text-slate-500 text-sm">
              * Cálculo basado en precios promedio de bolsos nuevos. El ahorro real puede variar según las marcas y
              modelos seleccionados.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

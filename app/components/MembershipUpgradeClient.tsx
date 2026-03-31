"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Check, Gift, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { createClient } from "@/utils/supabase/client"

// Mapa central de priceIds — fuente de verdad para todos los planes
const PRICE_MAP: Record<string, Record<string, string>> = {
  petite: {
    weekly: "price_1Sx92xKBSKEgBoTnoZwPvKI8",
    monthly: "price_1Sx92xKBSKEgBoTnoZwPvKI8",
  },
  essentiel: {
    monthly: "price_1RP4LyKBSKEgBoTnJQobCsjs",
    quarterly: "price_1SxPFdKBSKEgBoTnUvzx5avc",
  },
  signature: {
    monthly: "price_1SSHULKBSKEgBoTn2lGSRuzh",
    quarterly: "price_1SxPTWKBSKEgBoTnAw5WjZhI",
  },
  prive: {
    monthly: "price_1SSHVKKBSKEgBoTnLoHhpUyV",
    quarterly: "price_1SxOtWKBSKEgBoTnbuFozBm9",
  },
}

interface GiftCardState {
  id: string
  code: string
  balance: number // en euros
}

export interface MembershipPlanConfig {
  membershipType: string
  billingCycle: string
  price: number        // en euros
  label: string        // ej: "Membresía Petite"
  features: string[]
  priceSuffix?: string // ej: "/semana" o "/mes"
}

interface Props {
  plan: MembershipPlanConfig
  userId: string
}

export default function MembershipUpgradeClient({ plan, userId }: Props) {
  const router = useRouter()
  const [giftCardCode, setGiftCardCode] = useState("")
  const [appliedGiftCard, setAppliedGiftCard] = useState<GiftCardState | null>(null)
  const [gcLoading, setGcLoading] = useState(false)
  const [gcError, setGcError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const isSubmitting = useRef(false) // previene doble click

  const giftCardDiscount = appliedGiftCard ? Math.min(appliedGiftCard.balance, plan.price) : 0
  const finalAmount = Math.max(0, plan.price - giftCardDiscount)

  // ─── Aplicar gift card ────────────────────────────────────────────────────
  async function handleApplyGiftCard() {
    const code = giftCardCode.trim()
    if (!code) return
    setGcLoading(true)
    setGcError(null)

    try {
      const res = await fetch("/api/gift-cards/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()

      if (!res.ok || !data.valid) {
        setGcError(data.error || "Gift card no válida o sin saldo")
        return
      }

      if (!data.giftCard?.id) {
        setGcError("No se pudo verificar la gift card. Intenta de nuevo.")
        return
      }

      setAppliedGiftCard({
        id: data.giftCard.id,
        code,
        balance: data.balance, // ya en euros desde el endpoint validate
      })
      setGiftCardCode("")
    } catch {
      setGcError("Error de conexión al validar gift card")
    } finally {
      setGcLoading(false)
    }
  }

  // ─── Pagar ────────────────────────────────────────────────────────────────
  async function handlePay() {
    // Bloqueo anti-doble click
    if (isSubmitting.current || loading) return
    isSubmitting.current = true
    setLoading(true)

    try {
      // RAMA A: Gift card cubre el 100%
      if (finalAmount === 0 && appliedGiftCard) {
        if (!appliedGiftCard.id) {
          toast.error("Error interno: gift card sin ID. Vuelve a aplicarla.")
          return
        }

        const res = await fetch("/api/memberships/purchase-with-gift-card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            giftCardId: appliedGiftCard.id,
            amountCents: Math.round(plan.price * 100),
            membershipType: plan.membershipType,
            billingCycle: plan.billingCycle,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          toast.error(data.error || "Error al procesar gift card")
          return
        }

        toast.success("¡Pago procesado! Ahora verifica tu identidad.")
        router.push("/verify-identity")
        return
      }

      // RAMA B: Pago con Stripe (total o parcial)
      const priceId = PRICE_MAP[plan.membershipType]?.[plan.billingCycle]

      if (!priceId) {
        toast.error("Plan no disponible. Contacta soporte.")
        return
      }

      // PASO 1: Crear intent en DB
      const intentRes = await fetch("/api/checkout/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          membershipType: plan.membershipType,
          billingCycle: plan.billingCycle,
          amount: finalAmount,
          giftCard: appliedGiftCard,
        }),
      })

      if (!intentRes.ok) {
        const intentError = await intentRes.json()
        toast.error(intentError.error || "Error al preparar el pago")
        return
      }

      const intentData = await intentRes.json()
      const intentId = intentData?.intentId

      if (!intentId) {
        toast.error("Error interno: no se generó el ID de pago. Intenta de nuevo.")
        return
      }

      // PASO 2: Crear Stripe Checkout
      const checkoutRes = await fetch("/api/stripe/create-subscription-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          membershipType: plan.membershipType,
          billingCycle: plan.billingCycle,
          intentId,
        }),
      })

      const checkoutData = await checkoutRes.json()

      if (!checkoutRes.ok) {
        toast.error(checkoutData.error || "Error al crear sesión de pago")
        return
      }

      if (!checkoutData.url) {
        toast.error("No se recibió URL de pago. Intenta de nuevo.")
        return
      }

      window.location.href = checkoutData.url
    } catch (err: any) {
      toast.error(err?.message || "Error inesperado. Intenta de nuevo.")
    } finally {
      setLoading(false)
      isSubmitting.current = false
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">

        {/* Resumen del plan */}
        <div
          className="rounded-2xl p-8 text-center"
          style={{ boxShadow: "0 4px 24px rgba(26,26,75,0.10)" }}
        >
          <h1 className="font-serif text-3xl mb-2" style={{ color: "#1a1a4b" }}>
            {plan.membershipType.charAt(0).toUpperCase() + plan.membershipType.slice(1)}
          </h1>
          <div className="mb-2">
            <span className="font-serif text-5xl font-light" style={{ color: "#1a1a4b" }}>
              {plan.price.toFixed(2).replace(".", ",")}€
            </span>
            <span className="text-slate-500 text-lg">{plan.priceSuffix || "/mes"}</span>
          </div>
          <p className="text-slate-500 text-sm mb-6">{plan.label}</p>

          <div className="space-y-3 text-left mb-6">
            {plan.features.map((f) => (
              <div key={f} className="flex items-center gap-3">
                <Check className="w-4 h-4 shrink-0" style={{ color: "#1a1a4b" }} />
                <span className="text-slate-700 text-sm">{f}</span>
              </div>
            ))}
          </div>

          {/* Desglose precio */}
          <div className="border-t pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>{plan.membershipType.charAt(0).toUpperCase() + plan.membershipType.slice(1)}</span>
              <span>{plan.price.toFixed(2)}€</span>
            </div>
            {appliedGiftCard && (
              <div className="flex justify-between" style={{ color: "#c084a0" }}>
                <span>Gift Card ({appliedGiftCard.code})</span>
                <span>-{giftCardDiscount.toFixed(2)}€</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-base pt-1 border-t" style={{ color: "#1a1a4b" }}>
              <span>Total a pagar</span>
              <span>{finalAmount.toFixed(2)}€</span>
            </div>
          </div>
        </div>

        {/* Gift Card */}
        <div
          className="rounded-2xl p-6"
          style={{ boxShadow: "0 4px 24px rgba(26,26,75,0.08)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Gift className="w-4 h-4" style={{ color: "#1a1a4b" }} />
            <span className="text-sm font-medium" style={{ color: "#1a1a4b" }}>
              ¿Tienes una Gift Card?
            </span>
          </div>

          {appliedGiftCard ? (
            <div
              className="flex items-center justify-between rounded-lg px-4 py-3"
              style={{ backgroundColor: "#fff0f3", border: "1px solid #f4c4cc" }}
            >
              <span className="text-sm font-medium" style={{ color: "#1a1a4b" }}>
                {appliedGiftCard.code} — {appliedGiftCard.balance.toFixed(2)}€ disponibles
              </span>
              <button
                onClick={() => setAppliedGiftCard(null)}
                className="ml-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Código de gift card"
                value={giftCardCode}
                onChange={(e) => {
                  setGiftCardCode(e.target.value)
                  setGcError(null)
                }}
                onKeyDown={(e) => e.key === "Enter" && handleApplyGiftCard()}
                className="flex-1"
                disabled={gcLoading}
              />
              <Button
                variant="outline"
                onClick={handleApplyGiftCard}
                disabled={gcLoading || !giftCardCode.trim()}
                style={{ borderColor: "#1a1a4b", color: "#1a1a4b" }}
              >
                {gcLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aplicar"}
              </Button>
            </div>
          )}

          {gcError && (
            <p className="text-sm mt-2" style={{ color: "#e53e3e" }}>
              {gcError}
            </p>
          )}
        </div>

        {/* Boton de pago */}
        <Button
          className="w-full text-white h-12 text-base font-medium"
          style={{ backgroundColor: loading ? "#3a3a7b" : "#1a1a4b" }}
          onClick={handlePay}
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Procesando...
            </span>
          ) : finalAmount === 0 && appliedGiftCard ? (
            "Activar con Gift Card"
          ) : (
            `Pagar ${finalAmount.toFixed(2)}€`
          )}
        </Button>

        <p className="text-center text-xs text-slate-400">
          Pago 100% seguro. Procesado por Stripe.
        </p>
      </div>
    </div>
  )
}

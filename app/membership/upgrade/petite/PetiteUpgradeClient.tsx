"use client"

import { useAuth } from "../../../hooks/useAuth"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, ArrowLeft, Check, Gift } from "lucide-react"

export default function PetiteUpgradeClient() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [giftCardCode, setGiftCardCode] = useState("")
  const [appliedGiftCard, setAppliedGiftCard] = useState<{ id: string; code: string; balance: number } | null>(null)
  const [giftCardError, setGiftCardError] = useState("")
  const [isValidatingGC, setIsValidatingGC] = useState(false)

  const PRICE = 19.99
  const finalAmount = appliedGiftCard ? Math.max(0, PRICE - appliedGiftCard.balance) : PRICE

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  const handleApplyGiftCard = async () => {
    if (!giftCardCode.trim()) return
    setGiftCardError("")
    setIsValidatingGC(true)
    try {
      const res = await fetch("/api/gift-cards/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: giftCardCode.trim() }),
      })
      const data = await res.json()
      if (data.valid) {
        setAppliedGiftCard({ id: data.giftCard.id, code: giftCardCode.trim(), balance: data.balance })
        setGiftCardCode("")
      } else {
        setGiftCardError(data.message || "Gift card no válida")
      }
    } catch {
      setGiftCardError("Error al validar la gift card")
    } finally {
      setIsValidatingGC(false)
    }
  }

  const handleCheckout = async () => {
    if (!user) return
    setIsProcessing(true)
    try {
      // Gift card cubre el 100%
      if (finalAmount === 0 && appliedGiftCard) {
        const res = await fetch("/api/memberships/purchase-with-gift-card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            giftCardId: appliedGiftCard.id,
            amountCents: Math.round(PRICE * 100),
            membershipType: "petite",
            billingCycle: "weekly",
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Error al procesar gift card")
        router.push("/dashboard/membresia")
        return
      }

      // Pago Stripe (total o parcial)
      const res = await fetch("/api/stripe/create-subscription-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membershipType: "petite",
          billingCycle: "weekly",
          userId: user.id,
          userEmail: user.email,
          giftCardCode: appliedGiftCard?.code || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al crear sesión de pago")
      if (data.url) window.location.href = data.url
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin h-8 w-8 text-slate-600" />
      </div>
    )
  }

  if (!user) return null

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-12">
        <Button onClick={() => router.push("/membresias")} variant="ghost" className="mb-8 text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Membresías
        </Button>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Resumen del plan */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h1 className="font-serif text-4xl text-slate-900 mb-4">Petite</h1>
                <div className="mb-4">
                  <span className="font-serif text-5xl font-light text-slate-900">19,99€</span>
                  <span className="text-lg text-slate-600 font-light">/semana</span>
                </div>
                <p className="text-slate-700 font-light">Favoritos del día a día. Sin compromiso.</p>
              </div>
              <div className="space-y-3 mb-6">
                {["1 bolso por semana", "Envío gratuito", "Seguro incluido", "Sin compromiso"].map((f) => (
                  <div key={f} className="flex items-center">
                    <Check className="w-5 h-5 text-green-600 mr-3 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              {/* Resumen precio */}
              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Membresía Petite</span>
                  <span>{PRICE.toFixed(2)}€</span>
                </div>
                {appliedGiftCard && (
                  <div className="flex justify-between text-green-700">
                    <span>Gift Card ({appliedGiftCard.code})</span>
                    <span>-{Math.min(appliedGiftCard.balance, PRICE).toFixed(2)}€</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-base border-t pt-2">
                  <span>Total a pagar</span>
                  <span>{finalAmount.toFixed(2)}€</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gift Card */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                <Gift className="w-4 h-4" />
                ¿Tienes una Gift Card?
              </p>
              {appliedGiftCard ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                  <span className="text-sm text-green-800 font-medium">{appliedGiftCard.code} — {appliedGiftCard.balance.toFixed(2)}€ disponibles</span>
                  <button onClick={() => setAppliedGiftCard(null)} className="text-slate-400 hover:text-slate-700 text-lg leading-none">×</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={giftCardCode}
                    onChange={(e) => setGiftCardCode(e.target.value)}
                    placeholder="Ingresa el código"
                    className="flex-1"
                  />
                  <Button onClick={handleApplyGiftCard} disabled={isValidatingGC} variant="outline">
                    {isValidatingGC ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aplicar"}
                  </Button>
                </div>
              )}
              {giftCardError && <p className="text-red-500 text-sm mt-2">{giftCardError}</p>}
            </CardContent>
          </Card>

          {/* Boton de pago */}
          <Button
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 h-12"
            onClick={handleCheckout}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <><Loader2 className="animate-spin h-4 w-4 mr-2" />Procesando...</>
            ) : finalAmount === 0 ? (
              "Activar con Gift Card"
            ) : (
              `Pagar ${finalAmount.toFixed(2)}€`
            )}
          </Button>

          <p className="text-center text-xs text-slate-500">Pago 100% seguro. Procesado por Stripe.</p>
        </div>
      </div>
    </main>
  )
}

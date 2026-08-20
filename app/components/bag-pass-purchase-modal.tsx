"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Crown, ShoppingBag, Check, AlertCircle } from "lucide-react"

interface BagPassPurchaseModalProps {
  open: boolean
  onClose: () => void
  requiredTier: "lessentiel" | "signature" | "prive"
  bagId?: string
  onPurchaseComplete?: () => void
}

const PASS_PRICES = {
  lessentiel: 52,
  signature: 99,
  prive: 137,
}

const TIER_NAMES = {
  lessentiel: "L'Essentiel",
  signature: "Signature",
  prive: "Privé",
}

const TIER_DESCRIPTIONS = {
  lessentiel: "Acceso a bolsos de la colección L'Essentiel por 1 semana",
  signature: "Acceso a bolsos de la colección Signature por 1 semana",
  prive: "Acceso a bolsos exclusivos de la colección Privé por 1 semana",
}

export default function BagPassPurchaseModal({
  open,
  onClose,
  requiredTier,
  bagId,
  onPurchaseComplete,
}: BagPassPurchaseModalProps) {
  const router = useRouter()
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)
  const [hasActiveReservation, setHasActiveReservation] = useState(false)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)

  const handleClose = () => {
    setHasActiveReservation(false)
    setPurchaseError(null)
    onClose()
  }

  const handlePurchase = async () => {
    setIsPurchasing(true)
    setPurchaseError(null)

    try {
      const response = await fetch("/api/bag-passes/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passTier: requiredTier,
          quantity: 1,
          bagId: bagId || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.code === "ACTIVE_RESERVATION") {
          setHasActiveReservation(true)
          return
        }
        throw new Error(data.error || "Error al comprar el pase")
      }

      setPurchaseSuccess(true)

      setTimeout(() => {
        onPurchaseComplete?.()
        onClose()
      }, 2000)
    } catch (error) {
      console.error("[v0] Error purchasing pass:", error)
      setPurchaseError(error instanceof Error ? error.message : "Error al comprar el pase")
    } finally {
      setIsPurchasing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif text-indigo-dark flex items-center gap-2">
            <Crown className="h-6 w-6" />
            Pase de Bolso Requerido
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Para acceder a este bolso, necesitas comprar un Pase de Bolso {TIER_NAMES[requiredTier]}
          </DialogDescription>
        </DialogHeader>

        {hasActiveReservation ? (
          <div className="py-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-rose-nude/30 p-3">
                <AlertCircle className="h-8 w-8 text-indigo-dark" />
              </div>
            </div>
            <h3 className="text-xl font-serif text-indigo-dark mb-2">Ya tienes un bolso en curso</h3>
            <p className="text-slate-600 leading-relaxed mb-6">
              Para reservar uno nuevo, primero completa la devolución del bolso actual desde tu dashboard.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={handleClose}
                variant="outline"
                className="flex-1 border-indigo-dark/20 text-indigo-dark hover:bg-indigo-dark/5 bg-transparent"
              >
                Entendido
              </Button>
              <Button
                onClick={() => router.push("/dashboard")}
                className="flex-1 bg-indigo-dark text-white hover:bg-indigo-dark/90"
              >
                Ir a mi dashboard
              </Button>
            </div>
          </div>
        ) : purchaseSuccess ? (
          <div className="py-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <Check className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h3 className="text-xl font-medium text-green-900 mb-2">¡Pase Comprado!</h3>
            <p className="text-green-700">Ahora puedes reservar este bolso</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-rose-nude/20 rounded-lg p-4 border border-rose-pastel/30">
              <h4 className="font-medium text-indigo-dark mb-2">Pase {TIER_NAMES[requiredTier]}</h4>
              <p className="text-sm text-slate-600 mb-3">{TIER_DESCRIPTIONS[requiredTier]}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-indigo-dark">{PASS_PRICES[requiredTier]}€</span>
                <span className="text-slate-500">/semana</span>
              </div>
            </div>

            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Válido por 1 semana desde la compra</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Acceso inmediato después de la compra</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Se consume automáticamente al reservar</span>
              </div>
            </div>

            {purchaseError && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-pastel/40 bg-rose-nude/20 p-3 text-sm text-indigo-dark">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{purchaseError}</span>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleClose}
                variant="outline"
                className="flex-1 border-indigo-dark/20 text-indigo-dark hover:bg-indigo-dark/5 bg-transparent"
              >
                Cancelar
              </Button>
              <Button
                onClick={handlePurchase}
                disabled={isPurchasing}
                className="flex-1 bg-indigo-dark text-white hover:bg-indigo-dark/90"
              >
                {isPurchasing ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⏳</span>
                    Procesando...
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Comprar Pase
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

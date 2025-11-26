"use client"

import { useCart } from "@/app/contexts/cart-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { SMSAuthModal } from "@/app/components/sms-auth-modal"
import { Info } from "lucide-react"

export default function CartPage() {
  const { items, removeItem, total, itemCount } = useCart()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [user, setUser] = useState(null)
  const [selectedMembership, setSelectedMembership] = useState<any>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("selectedMembership")
    if (saved) {
      setSelectedMembership(JSON.parse(saved))
    }
  }, [])

  const handleAuthSuccess = (authenticatedUser: any) => {
    setUser(authenticatedUser)
    console.log("[v0] User authenticated via SMS, proceeding to checkout:", authenticatedUser)

    let planParam = "signature" // default

    // Primero intentar desde selectedMembership
    if (selectedMembership?.id) {
      planParam = selectedMembership.id
      console.log("[v0] Plan detected from selectedMembership:", planParam)
    }
    // Si no, intentar desde items en el carrito
    else if (items.length > 0) {
      const firstItem = items[0]
      if (firstItem.id.includes("petite")) {
        planParam = "petite"
      } else if (firstItem.id.includes("essentiel")) {
        planParam = "essentiel"
      } else if (firstItem.id.includes("prive")) {
        planParam = "prive"
      } else if (firstItem.id.includes("signature")) {
        planParam = "signature"
      }
      console.log("[v0] Plan detected from cart items:", planParam, "from item ID:", firstItem.id)
    }

    console.log("[v0] Redirecting to checkout with plan:", planParam)
    window.location.href = `/checkout?plan=${planParam}`
  }

  const handleFinalizarCompra = () => {
    if (!termsAccepted) {
      alert("Por favor, acepta los Términos y Condiciones para continuar.")
      return
    }
    setShowAuthModal(true)
  }

  if (itemCount === 0 && !selectedMembership) {
    return (
      <div className="min-h-screen bg-slate-50 pt-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-serif text-slate-900 mb-6">Tu Carrito</h1>
          <p className="text-slate-600 mb-8">Tu carrito está vacío</p>
          <Link href="/#membresias">
            <Button className="bg-slate-900 hover:bg-slate-800 text-white">Ver Membresías</Button>
          </Link>
        </div>
      </div>
    )
  }

  const displayMembership = selectedMembership || (items.length > 0 ? items[0] : null)

  const getBillingCycleLabel = (cycle: string) => {
    switch (cycle) {
      case "weekly":
        return "Semanal"
      case "monthly":
        return "Mensual"
      case "quarterly":
        return "Trimestral"
      default:
        return "Mensual"
    }
  }

  const isPetite = displayMembership?.id === "petite" || displayMembership?.name?.toLowerCase().includes("petite")

  return (
    <div className="min-h-screen bg-slate-50 pt-32">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-serif text-slate-900 mb-8 text-center">CARRITO</h1>

        {displayMembership && (
          <Card className="mb-6 border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                {displayMembership.image && (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={displayMembership.image || "/placeholder.svg"}
                      alt={displayMembership.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-serif text-xl text-slate-900">Membresía {displayMembership.name}</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        {displayMembership.description ||
                          `Membresía ${getBillingCycleLabel(displayMembership.billingCycle).toLowerCase()} ${displayMembership.name}`}
                      </p>
                      <span className="inline-block mt-2 px-3 py-1 bg-rose-50 text-[#1a2c4e] text-xs rounded-full">
                        {getBillingCycleLabel(displayMembership.billingCycle)}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-serif text-2xl text-slate-900">{displayMembership.price}</p>
                      <p className="text-sm text-slate-500">
                        /
                        {displayMembership.billingCycle === "weekly"
                          ? "semana"
                          : displayMembership.billingCycle === "monthly"
                            ? "mes"
                            : "trimestre"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {isPetite && (
                <div className="mt-4 p-4 bg-rose-50 rounded-lg flex items-start gap-3">
                  <Info className="w-5 h-5 text-[#1a2c4e] flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-[#1a2c4e]">
                    <p className="font-medium">Membresía Petite</p>
                    <p className="mt-1">
                      Después del pago, podrás elegir tu bolso del catálogo. Puedes renovar semanalmente hasta 3 meses.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Resumen de pedido */}
        <Card className="mb-6 border-0 shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-serif text-lg text-slate-900 mb-4">Resumen del pedido</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="text-slate-900">{displayMembership?.price || `${total.toFixed(2)}€`}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Envío</span>
                <span className="text-green-600">Gratis</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-medium text-slate-900">Total</span>
                <span className="font-serif text-xl text-slate-900">
                  {displayMembership?.price || `${total.toFixed(2)}€`}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Términos y condiciones */}
        <Card className="mb-6 border-0 shadow-sm">
          <CardContent className="p-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-500"
              />
              <span className="text-sm text-slate-600">
                He leído y acepto los{" "}
                <Link href="/legal/terms" className="text-slate-900 underline hover:text-slate-700">
                  Términos y Condiciones
                </Link>{" "}
                y la{" "}
                <Link href="/legal/privacy" className="text-slate-900 underline hover:text-slate-700">
                  Política de Privacidad
                </Link>
              </span>
            </label>
          </CardContent>
        </Card>

        {/* Botones de acción */}
        <div className="flex flex-col gap-4">
          <Button
            onClick={handleFinalizarCompra}
            disabled={!termsAccepted}
            className="w-full py-6 text-lg bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50"
          >
            FINALIZAR COMPRA
          </Button>
          <Link href="/catalog" className="w-full">
            <Button variant="outline" className="w-full py-6 text-lg bg-transparent">
              SEGUIR COMPRANDO
            </Button>
          </Link>
        </div>

        <SMSAuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={handleAuthSuccess} />
      </div>
    </div>
  )
}

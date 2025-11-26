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
  const { items, removeItem, itemCount } = useCart()
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

  const getBillingCycleLabel = (cycle: string) => {
    switch (cycle) {
      case "weekly":
        return "/semana"
      case "quarterly":
        return "/trimestre"
      default:
        return "/mes"
    }
  }

  const getBillingCycleName = (cycle: string) => {
    switch (cycle) {
      case "weekly":
        return "Semanal"
      case "quarterly":
        return "Trimestral"
      default:
        return "Mensual"
    }
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

  const getDisplayPrice = () => {
    if (!displayMembership?.price) return "0"
    const priceStr =
      typeof displayMembership.price === "string"
        ? displayMembership.price.replace("€", "").replace(",", ".")
        : displayMembership.price
    return Number.parseFloat(priceStr).toFixed(2).replace(".", ",")
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-32">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-serif text-slate-900 mb-8 text-center">CARRITO</h1>

        {displayMembership && (
          <div className="mb-8">
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-0">
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="relative h-64 md:h-80">
                    <Image
                      src={displayMembership.image || "/placeholder.svg"}
                      alt={displayMembership.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg">
                      <div className="text-sm font-medium text-slate-900">{displayMembership.brand}</div>
                      <div className="text-xs text-slate-600">Membresía {displayMembership.name}</div>
                    </div>
                  </div>

                  <div className="p-6 flex flex-col justify-center">
                    <div className="mb-4">
                      <h2 className="font-serif text-2xl text-slate-900 mb-2">Membresía {displayMembership.name}</h2>
                      <p className="text-slate-600 mb-4">{displayMembership.description}</p>

                      <div className="mb-4">
                        <span className="font-serif text-3xl font-light text-slate-900">{displayMembership.price}</span>
                        <span className="text-base text-slate-600 ml-2">
                          {getBillingCycleLabel(displayMembership.billingCycle)}
                        </span>
                        {displayMembership.billingCycle === "quarterly" && (
                          <div className="mt-2 text-[#1a2c4e] font-medium text-sm bg-rose-50 px-2 py-1 rounded-md inline-block">
                            ¡Ahorras un 20%!
                          </div>
                        )}
                        {(displayMembership.id === "petite" || displayMembership.billingCycle === "weekly") && (
                          <div className="mt-3 p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-start gap-3">
                            <Info className="h-5 w-5 text-[#1a2c4e] mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-[#1a2c4e] font-medium">Siguiente paso: Elige tu bolso</p>
                              <p className="text-sm text-slate-600 mt-1">
                                Después del pago, podrás elegir un bolso del catálogo. El Pase de Bolso se cobra aparte
                                según categoría: L'Essenciel (52€), Signature (99€), Privé (137€).
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {displayMembership.features && (
                        <ul className="space-y-2 text-sm text-slate-700">
                          {displayMembership.features.map((feature: string, index: number) => (
                            <li key={index} className="flex items-center">
                              <div className="w-2 h-2 bg-rose-nude rounded-full mr-3"></div>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="bg-slate-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-4 gap-4 text-sm font-medium text-slate-700 uppercase tracking-wide">
            <div>PRODUCTO</div>
            <div className="text-center">CANT</div>
            <div className="text-center">PRECIO</div>
            <div className="text-center">TOTAL</div>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          {items.map((item) => (
            <Card key={item.id} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="grid grid-cols-4 gap-4 items-center">
                  <div className="flex items-center space-x-4">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-100">
                      <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">{item.name}</h3>
                      <p className="text-sm text-slate-600">{item.brand}</p>
                      <p className="text-xs text-slate-500">{getBillingCycleName(item.billingCycle)}</p>
                    </div>
                  </div>

                  <div className="text-center">
                    <span className="text-slate-900">1</span>
                  </div>

                  <div className="text-center">
                    <span className="text-slate-900">{item.price}</span>
                  </div>

                  <div className="text-center">
                    <span className="text-slate-900">{item.price}</span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="ml-4 text-slate-400 hover:text-slate-600 text-sm underline"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-between items-center mb-8">
          <Link href="/catalog">
            <Button variant="outline" className="border-slate-300 text-slate-700 bg-transparent">
              SEGUIR COMPRANDO
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => {
              /* Clear cart functionality can be added */
            }}
            className="border-slate-300 text-slate-700"
          >
            LIMPIAR CARRITO
          </Button>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
          <h3 className="text-xl font-serif text-slate-900 mb-4">Resumen del pedido</h3>

          <div className="flex justify-between items-center text-lg font-medium text-slate-900 mb-4">
            <span>Subtotal</span>
            <span>
              {getDisplayPrice()}€{getBillingCycleLabel(displayMembership?.billingCycle || "monthly")}
            </span>
          </div>

          <p className="text-sm text-slate-600 mb-4">
            Impuestos incluidos. <span className="underline">Envío</span> calculado al finalizar la compra.
          </p>

          <div className="flex items-center mb-6">
            <input
              type="checkbox"
              id="terms"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mr-2 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="terms" className="text-sm text-slate-600 cursor-pointer">
              He leído y acepto los <span className="underline">Términos y Condiciones</span>
            </label>
          </div>

          <Button
            onClick={handleFinalizarCompra}
            disabled={!termsAccepted}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg disabled:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            FINALIZAR COMPRA
          </Button>
        </div>

        <div className="text-center">
          <Link href="/#membresias">
            <Button variant="outline" className="border-slate-300 text-slate-700 bg-transparent">
              Cambiar membresía
            </Button>
          </Link>
        </div>
      </div>

      <SMSAuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={handleAuthSuccess} />
    </div>
  )
}

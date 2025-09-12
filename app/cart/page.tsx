"use client"

import { useCart } from "@/app/components/cart-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { SMSAuthModal } from "@/app/components/sms-auth-modal"

export default function CartPage() {
  const { items, removeItem, total, itemCount } = useCart()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [user, setUser] = useState(null)

  const handleAuthSuccess = (authenticatedUser: any) => {
    setUser(authenticatedUser)
    console.log("[v0] User authenticated via SMS, proceeding to checkout:", authenticatedUser)

    // Obtener el plan de la membresía del carrito
    const firstItem = items[0]
    let planParam = ""

    if (firstItem?.name.toLowerCase().includes("essentiel")) {
      planParam = "essentiel"
    } else if (firstItem?.name.toLowerCase().includes("privé")) {
      planParam = "prive"
    } else {
      planParam = "signature"
    }

    // Redirigir al checkout con el plan
    window.location.href = `/checkout?plan=${planParam}`
  }

  if (itemCount === 0) {
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

  return (
    <div className="min-h-screen bg-slate-50 pt-32">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-serif text-slate-900 mb-8 text-center">CARRITO</h1>

        {/* Cart Header */}
        <div className="bg-slate-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-4 gap-4 text-sm font-medium text-slate-700 uppercase tracking-wide">
            <div>PRODUCTO</div>
            <div className="text-center">CANT</div>
            <div className="text-center">PRECIO</div>
            <div className="text-center">TOTAL</div>
          </div>
        </div>

        {/* Cart Items */}
        <div className="space-y-4 mb-8">
          {items.map((item) => (
            <Card key={item.id} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="grid grid-cols-4 gap-4 items-center">
                  {/* Product Info */}
                  <div className="flex items-center space-x-4">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-100">
                      <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">{item.name}</h3>
                      <p className="text-sm text-slate-600">{item.brand}</p>
                      <p className="text-xs text-slate-500">
                        {item.billingCycle === "monthly" ? "Mensual" : "Trimestral"}
                      </p>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="text-center">
                    <span className="text-slate-900">1</span>
                  </div>

                  {/* Price */}
                  <div className="text-center">
                    <span className="text-slate-900">{item.price}</span>
                  </div>

                  {/* Total */}
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

        {/* Cart Actions */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/#membresias">
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

        {/* Cart Summary */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center text-lg font-medium text-slate-900 mb-4">
            <span>Subtotal</span>
            <span>€{total.toFixed(2)} EUR</span>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Impuestos incluidos. <span className="underline">Envío</span> calculado al finalizar la compra.
          </p>
          <div className="flex items-center mb-6">
            <input type="checkbox" id="terms" className="mr-2" />
            <label htmlFor="terms" className="text-sm text-slate-600">
              He leído y acepto los <span className="underline">Términos y Condiciones</span>
            </label>
          </div>
          <Button
            onClick={() => setShowAuthModal(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
          >
            FINALIZAR COMPRA
          </Button>
        </div>
      </div>

      {/* SMS Authentication Modal */}
      <SMSAuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={handleAuthSuccess} />
    </div>
  )
}

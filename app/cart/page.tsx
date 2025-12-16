"use client"

import { useCart } from "@/app/contexts/cart-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Info, Tag, Gift, Loader2, X, Check, Trash2 } from "lucide-react"
import { getSupabaseBrowser } from "@/lib/supabase"
import { loadStripe } from "@stripe/stripe-js"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function CartPage() {
  const { items, removeItem, total, itemCount } = useCart()
  const [user, setUser] = useState<any>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [processing, setProcessing] = useState(false)

  const [couponCode, setCouponCode] = useState("")
  const [giftCardCode, setGiftCardCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; type: string } | null>(null)
  const [appliedGiftCard, setAppliedGiftCard] = useState<{ code: string; balance: number } | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [giftCardLoading, setGiftCardLoading] = useState(false)
  const [couponError, setCouponError] = useState("")
  const [giftCardError, setGiftCardError] = useState("")

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseBrowser()
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()
      if (currentUser) {
        setUser(currentUser)
      }
    }
    checkAuth()
  }, [])

  const calculateFinalAmount = () => {
    let amount = total

    if (appliedCoupon) {
      if (appliedCoupon.type === "percent") {
        amount = amount * (1 - appliedCoupon.discount / 100)
      } else {
        amount = Math.max(0, amount - appliedCoupon.discount)
      }
    }

    if (appliedGiftCard) {
      amount = Math.max(0, amount - appliedGiftCard.balance)
    }

    return amount
  }

  const finalAmount = calculateFinalAmount()

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return

    setCouponLoading(true)
    setCouponError("")

    try {
      const response = await fetch("/api/payments/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponCode: couponCode.trim() }),
      })

      const data = await response.json()

      if (data.valid) {
        setAppliedCoupon({
          code: couponCode.trim(),
          discount: data.percentOff || data.amountOff || 0,
          type: data.percentOff ? "percent" : "fixed",
        })
        setCouponCode("")
      } else {
        setCouponError(data.error || "Cupón no válido")
      }
    } catch (error) {
      setCouponError("Error al validar cupón")
    } finally {
      setCouponLoading(false)
    }
  }

  const handleApplyGiftCard = async () => {
    if (!giftCardCode.trim()) return

    setGiftCardLoading(true)
    setGiftCardError("")

    try {
      const response = await fetch("/api/gift-cards/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: giftCardCode.trim() }),
      })

      const data = await response.json()

      if (data.valid) {
        let balanceInEuros = data.balance
        if (balanceInEuros > 1000) {
          balanceInEuros = balanceInEuros / 100
        }

        setAppliedGiftCard({
          code: giftCardCode.trim(),
          balance: balanceInEuros,
        })
        setGiftCardCode("")
      } else {
        setGiftCardError(data.error || "Gift card no válida")
      }
    } catch (error) {
      setGiftCardError("Error al validar gift card")
    } finally {
      setGiftCardLoading(false)
    }
  }

  const handleDirectCheckout = async () => {
    if (!termsAccepted) {
      alert("Por favor, acepta los Términos y Condiciones para continuar.")
      return
    }

    if (items.length === 0) {
      alert("No hay items en el carrito")
      return
    }

    if (!user) {
      alert("Debes estar autenticado para continuar")
      return
    }

    setProcessing(true)

    try {
      const firstItem = items[0]
      const isBagPass = firstItem.itemType === "bag-pass"

      // Si el total es 0, activar directamente sin Stripe
      if (finalAmount === 0) {
        const response = await fetch("/api/user/update-membership", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            membershipType: firstItem.id.includes("petite")
              ? "petite"
              : firstItem.id.includes("essentiel")
                ? "essentiel"
                : firstItem.id.includes("signature")
                  ? "signature"
                  : "prive",
            paymentId: `gift_${Date.now()}`,
            couponCode: appliedCoupon?.code,
            giftCardCode: appliedGiftCard?.code,
            isBagPass,
          }),
        })

        if (response.ok) {
          alert("¡Compra completada exitosamente!")
          window.location.href = "/dashboard"
        } else {
          const errorData = await response.json()
          alert(errorData.error || "Error al procesar la compra")
        }
        return
      }

      // Crear sesión de Stripe Checkout
      const checkoutResponse = await fetch("/api/payments/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          items: items.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.priceValue,
            itemType: item.itemType,
          })),
          couponCode: appliedCoupon?.code,
          giftCardCode: appliedGiftCard?.code,
          finalAmount: finalAmount * 100, // en centavos
        }),
      })

      if (!checkoutResponse.ok) {
        const errorData = await checkoutResponse.json()
        alert(errorData.error || "Error al crear la sesión de pago")
        setProcessing(false)
        return
      }

      const { sessionId } = await checkoutResponse.json()

      // Redirigir a Stripe Checkout
      const stripe = await stripePromise
      const { error } = await stripe!.redirectToCheckout({ sessionId })

      if (error) {
        alert(error.message)
        setProcessing(false)
      }
    } catch (error) {
      console.error("[v0] Error en checkout:", error)
      alert("Error al procesar el pago")
      setProcessing(false)
    }
  }

  if (itemCount === 0) {
    return (
      <div className="min-h-screen bg-white pt-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-serif text-indigo-dark mb-6">Tu Carrito</h1>
          <p className="text-indigo-dark/70 mb-8">Tu carrito está vacío</p>
          <Link href="/#membresias">
            <Button className="bg-indigo-dark hover:bg-indigo-dark/90 text-white">Ver Membresías</Button>
          </Link>
        </div>
      </div>
    )
  }

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

  const isPetiteCart = items.some((item) => item.id.includes("petite-membership"))

  return (
    <div className="min-h-screen bg-white pt-32">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-serif text-indigo-dark mb-8 text-center">CARRITO</h1>

        {items.length > 0 && (
          <div className="space-y-4 mb-6">
            {items.map((item) => (
              <Card key={item.id} className="border border-indigo-dark/10 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-rose-nude">
                      <Image
                        src={item.image || "/images/jacquemus-le-chiquito.jpg"}
                        alt={item.name}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/images/jacquemus-le-chiquito.jpg"
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-serif text-lg text-indigo-dark">{item.name}</h3>
                          <p className="text-sm text-indigo-dark/60 mt-1">{item.description}</p>
                          <span className="inline-block mt-2 px-3 py-1 bg-rose-pastel/30 text-indigo-dark text-xs rounded-full">
                            {getBillingCycleLabel(item.billingCycle)}
                          </span>
                        </div>
                        <div className="text-right flex items-start gap-3">
                          <div>
                            <p className="font-serif text-xl text-indigo-dark">{item.price}</p>
                            <p className="text-sm text-indigo-dark/60">
                              /
                              {item.billingCycle === "weekly"
                                ? "semana"
                                : item.billingCycle === "monthly"
                                  ? "mes"
                                  : "trimestre"}
                            </p>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-2 text-indigo-dark/40 hover:text-rose-pastel hover:bg-rose-nude rounded-lg transition-colors"
                            title="Eliminar del carrito"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {isPetiteCart && (
          <Card className="mb-6 border border-indigo-dark/10 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3 bg-rose-nude border border-rose-pastel/30 p-4 rounded-lg">
                <Info className="w-5 h-5 text-indigo-dark flex-shrink-0 mt-0.5" />
                <div className="text-sm text-indigo-dark">
                  <p className="font-medium">Membresía Petite + Pase de Bolso</p>
                  <p className="mt-1 text-indigo-dark/70">
                    Tu reserva incluye la membresía semanal y el pase para el bolso seleccionado. Puedes renovar
                    semanalmente hasta 3 meses.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6 border border-indigo-dark/10 shadow-sm">
          <CardContent className="p-6 space-y-4">
            {/* Cupón */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4 text-indigo-dark" />
                <span className="text-sm font-medium text-indigo-dark">¿Tienes un código de descuento?</span>
              </div>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-rose-nude border border-rose-pastel/30 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-indigo-dark" />
                    <span className="text-sm text-indigo-dark">
                      Cupón {appliedCoupon.code} aplicado (-{appliedCoupon.discount}
                      {appliedCoupon.type === "percent" ? "%" : "€"})
                    </span>
                  </div>
                  <button onClick={() => setAppliedCoupon(null)} className="text-indigo-dark/40 hover:text-indigo-dark">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Código de cupón"
                    className="flex-1 border-indigo-dark/20 focus:border-indigo-dark"
                  />
                  <Button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    variant="outline"
                    className="border-indigo-dark/20 text-indigo-dark hover:bg-rose-nude bg-transparent"
                  >
                    {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aplicar"}
                  </Button>
                </div>
              )}
              {couponError && <p className="text-sm text-red-500 mt-1">{couponError}</p>}
            </div>

            {/* Gift Card */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-4 h-4 text-indigo-dark" />
                <span className="text-sm font-medium text-indigo-dark">¿Tienes una Gift Card?</span>
              </div>
              {appliedGiftCard ? (
                <div className="flex items-center justify-between bg-rose-nude border border-rose-pastel/30 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-indigo-dark" />
                    <span className="text-sm text-indigo-dark">
                      Gift Card aplicada (Saldo: {appliedGiftCard.balance.toFixed(2)}€)
                    </span>
                  </div>
                  <button
                    onClick={() => setAppliedGiftCard(null)}
                    className="text-indigo-dark/40 hover:text-indigo-dark"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={giftCardCode}
                    onChange={(e) => setGiftCardCode(e.target.value)}
                    placeholder="SEMZO-XXXX-XXXX"
                    className="flex-1 border-indigo-dark/20 focus:border-indigo-dark"
                  />
                  <Button
                    onClick={handleApplyGiftCard}
                    disabled={giftCardLoading || !giftCardCode.trim()}
                    variant="outline"
                    className="border-indigo-dark/20 text-indigo-dark hover:bg-rose-nude bg-transparent"
                  >
                    {giftCardLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aplicar"}
                  </Button>
                </div>
              )}
              {giftCardError && <p className="text-sm text-red-500 mt-1">{giftCardError}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Resumen del pedido */}
        <Card className="mb-6 border border-indigo-dark/10 shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-serif text-lg text-indigo-dark mb-4">Resumen del pedido</h3>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-indigo-dark/70">{item.name}</span>
                  <span className="text-indigo-dark">{item.price}</span>
                </div>
              ))}

              {appliedCoupon && (
                <div className="flex justify-between text-sm text-rose-pastel">
                  <span>Descuento ({appliedCoupon.code})</span>
                  <span>
                    -{appliedCoupon.type === "percent" ? `${appliedCoupon.discount}%` : `${appliedCoupon.discount}€`}
                  </span>
                </div>
              )}

              {appliedGiftCard && (
                <div className="flex justify-between text-sm text-rose-pastel">
                  <span>Gift Card</span>
                  <span>
                    -
                    {Math.min(
                      appliedGiftCard.balance,
                      total -
                        (appliedCoupon?.type === "percent"
                          ? (total * appliedCoupon.discount) / 100
                          : appliedCoupon?.discount || 0),
                    ).toFixed(2)}
                    €
                  </span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-indigo-dark/70">Envío</span>
                <span className="text-indigo-dark/70">Gratis</span>
              </div>
              <div className="border-t border-indigo-dark/10 pt-3 flex justify-between">
                <span className="font-medium text-indigo-dark">Total</span>
                <span className="font-serif text-xl text-indigo-dark">{finalAmount.toFixed(2)}€</span>
              </div>

              {finalAmount === 0 && (
                <div className="bg-rose-nude border border-rose-pastel/30 p-3 rounded-lg mt-2">
                  <p className="text-sm text-indigo-dark text-center">
                    Tu pedido está completamente cubierto. No se realizará ningún cargo.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Términos y condiciones */}
        <Card className="mb-6 border border-indigo-dark/10 shadow-sm">
          <CardContent className="p-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-indigo-dark/30 text-indigo-dark focus:ring-indigo-dark"
              />
              <span className="text-sm text-indigo-dark/70">
                He leído y acepto los{" "}
                <Link href="/legal/terms" className="text-indigo-dark underline hover:text-rose-pastel">
                  Términos y Condiciones
                </Link>{" "}
                y la{" "}
                <Link href="/legal/privacy" className="text-indigo-dark underline hover:text-rose-pastel">
                  Política de Privacidad
                </Link>
              </span>
            </label>
          </CardContent>
        </Card>

        {/* Botones de acción */}
        <div className="flex flex-col gap-4 pb-12">
          <Button
            onClick={handleDirectCheckout}
            disabled={!termsAccepted || processing}
            className="w-full py-6 text-lg bg-[#1a1a2e] hover:bg-[#1a1a2e]/90 text-white disabled:opacity-50"
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Procesando...
              </>
            ) : finalAmount === 0 ? (
              "CONFIRMAR PEDIDO"
            ) : (
              "PAGAR AHORA"
            )}
          </Button>
          <Link href="/catalog" className="w-full">
            <Button
              variant="outline"
              className="w-full py-6 text-lg border-indigo-dark text-indigo-dark hover:bg-rose-nude bg-transparent"
            >
              SEGUIR COMPRANDO
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

"use client"
import { useCart } from "@/app/contexts/cart-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Info, Tag, Gift, Loader2, X, Check, Trash2, CreditCard, ShieldCheck } from "lucide-react"
import { getSupabaseBrowser } from "@/lib/supabase-browser"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Checkbox } from "@/components/ui/checkbox"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "")

function analyzeCartItems(items: any[]) {
  console.log("[v0] analyzeCartItems - items:", JSON.stringify(items, null, 2))

  const bagPassItem = items.find((item) => {
    const itemType = (item.itemType || "").toLowerCase()

    // SOLO confiar en itemType === "bag-pass"
    // NO usar id ni name porque pueden ser confusos
    const isBagPass = itemType === "bag-pass"

    console.log("[v0] Checking item for bag-pass:", {
      id: item.id,
      name: item.name,
      itemType,
      isBagPass,
    })

    return isBagPass
  })

  const membershipItem = items.find((item) => {
    const itemType = (item.itemType || "").toLowerCase()

    // SOLO confiar en itemType === "membership"
    const isMembership = itemType === "membership"

    console.log("[v0] Checking item for membership:", {
      id: item.id,
      itemType,
      isMembership,
    })

    return isMembership
  })

  // Determinar el tier del bag-pass usando el NOMBRE del item
  let bagPassTier: string | null = null
  if (bagPassItem) {
    const itemName = (bagPassItem.name || "").toLowerCase()

    if (itemName.includes("privé") || itemName.includes("prive")) {
      bagPassTier = "prive"
    } else if (itemName.includes("signature")) {
      bagPassTier = "signature"
    } else {
      bagPassTier = "essentiel"
    }
    console.log("[v0] Detected bagPassTier from name:", bagPassTier)
  }

  // Determinar membership type SOLO del item de membresía (NO de bag-pass)
  let membershipType: string | null = null
  if (membershipItem) {
    const itemId = (membershipItem.id || "").toLowerCase()
    const itemName = (membershipItem.name || "").toLowerCase()

    // Usar SOLO el itemId para determinar tipo (más confiable que el nombre)
    if (itemId.includes("prive")) {
      membershipType = "prive"
    } else if (itemId.includes("signature")) {
      membershipType = "signature"
    } else if (itemId.includes("essentiel")) {
      membershipType = "essentiel"
    } else if (itemId.includes("petite")) {
      membershipType = "petite"
    }

    console.log("[v0] Detected membershipType from ID:", membershipType)
  }

  const billingCycle = membershipItem?.billingCycle || bagPassItem?.billingCycle || "monthly"

  const isBagPassOnly = !!bagPassItem && !membershipItem

  console.log("[v0] Cart analysis result:", {
    membershipItem: membershipItem
      ? { id: membershipItem.id, name: membershipItem.name, itemType: membershipItem.itemType }
      : null,
    bagPassItem: bagPassItem ? { id: bagPassItem.id, name: bagPassItem.name, itemType: bagPassItem.itemType } : null,
    membershipType,
    bagPassTier,
    billingCycle,
    isBagPassOnly,
  })

  return {
    membershipItem,
    bagPassItem,
    membershipType,
    bagPassTier,
    billingCycle,
    isBagPassOnly,
  }
}

function PaymentForm({
  finalAmount,
  user,
  items,
  appliedCoupon,
  appliedGiftCard,
  termsAccepted,
  onSuccess,
  onError,
}: {
  finalAmount: number
  user: any
  items: any[]
  appliedCoupon: any
  appliedGiftCard: any
  termsAccepted: boolean
  onSuccess: () => void
  onError: (error: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [cardError, setCardError] = useState("")

  const handlePayment = async () => {
    if (!termsAccepted) {
      onError("Por favor, acepta los Términos y Condiciones para continuar.")
      return
    }

    if (!user) {
      onError("Debes estar autenticado para continuar")
      return
    }

    setProcessing(true)
    setCardError("")

    try {
      const cartAnalysis = analyzeCartItems(items)

      console.log("[v0] handlePayment - cartAnalysis:", cartAnalysis)
      console.log("[v0] handlePayment - isBagPassOnly:", cartAnalysis.isBagPassOnly)

      // CASO 1: Pago cubierto por gift card (finalAmount <= 0)
      if (finalAmount <= 0.01) {
        if (cartAnalysis.isBagPassOnly && cartAnalysis.bagPassTier) {
          console.log("[v0] Comprando SOLO bag-pass con gift card - NO cambiar membresía")
          const response = await fetch("/api/bag-passes/purchase", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              passTier: cartAnalysis.bagPassTier,
              quantity: 1,
              paymentMethod: "gift_card",
              giftCardCode: appliedGiftCard?.code,
            }),
          })

          const data = await response.json()
          console.log("[v0] bag-passes/purchase response:", data)

          if (response.ok) {
            onSuccess()
          } else {
            onError(data.error || "Error al procesar la compra del pase")
          }
          return // IMPORTANTE: terminar aquí
        }

        // Si hay membresía (nueva suscripción o upgrade)
        if (cartAnalysis.membershipType) {
          console.log("[v0] Comprando membresía con gift card:", cartAnalysis.membershipType)
          const response = await fetch("/api/user/update-membership", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              membershipType: cartAnalysis.membershipType,
              paymentId: `gift_${Date.now()}`,
              couponCode: appliedCoupon?.code,
              giftCardUsed: appliedGiftCard
                ? { code: appliedGiftCard.code, amountUsed: appliedGiftCard.balance * 100 }
                : null,
              billingCycle: cartAnalysis.billingCycle,
              bagPassTier:
                cartAnalysis.membershipType === "petite" && cartAnalysis.bagPassTier ? cartAnalysis.bagPassTier : null,
            }),
          })

          const responseData = await response.json()
          console.log("[v0] update-membership response:", responseData)

          if (response.ok) {
            onSuccess()
          } else {
            onError(responseData.error || "Error al procesar la compra")
          }
          return
        }

        // Fallback: no se pudo determinar qué comprar
        onError("No se pudo determinar el tipo de compra. Verifica tu carrito.")
        return
      }

      // CASO 2: Pago con tarjeta Stripe
      if (!stripe || !elements) {
        onError("Error de inicialización de Stripe. Recarga la página.")
        return
      }

      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        onError("Error con el formulario de tarjeta.")
        return
      }

      // Crear payment intent
      const intentResponse = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          membershipType: cartAnalysis.isBagPassOnly ? null : cartAnalysis.membershipType,
          bagPassPurchase: cartAnalysis.isBagPassOnly,
          bagPassTier: cartAnalysis.bagPassTier,
          userEmail: user.email,
          couponCode: appliedCoupon?.code,
          giftCardUsed: appliedGiftCard
            ? { code: appliedGiftCard.code, amountUsed: appliedGiftCard.balance * 100 }
            : null,
        }),
      })

      if (!intentResponse.ok) {
        const errorData = await intentResponse.json()
        onError(errorData.error || "Error al crear el pago")
        return
      }

      const { clientSecret } = await intentResponse.json()

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: { email: user.email },
        },
      })

      if (error) {
        let errorMessage = "Error al procesar el pago"
        if (error.code === "card_declined") {
          errorMessage = "Tu tarjeta ha sido denegada por intentos repetidos de compra con demasiada frecuencia."
        } else if (error.code === "insufficient_funds") {
          errorMessage = "Fondos insuficientes."
        } else if (error.code === "expired_card") {
          errorMessage = "Tarjeta expirada."
        } else if (error.message) {
          errorMessage = error.message
        }
        setCardError(errorMessage)
        onError(errorMessage)
        return
      }

      if (paymentIntent?.status === "succeeded") {
        if (cartAnalysis.isBagPassOnly && cartAnalysis.bagPassTier) {
          console.log("[v0] Pago Stripe exitoso - registrando SOLO bag-pass - NO cambiar membresía")
          const bagPassResponse = await fetch("/api/bag-passes/purchase", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              passTier: cartAnalysis.bagPassTier,
              quantity: 1,
              paymentMethod: "stripe",
              stripePaymentId: paymentIntent.id,
            }),
          })

          const data = await bagPassResponse.json()
          console.log("[v0] bag-passes/purchase (stripe) response:", data)

          if (bagPassResponse.ok) {
            onSuccess()
          } else {
            onError(data.error || "Pago exitoso pero error al registrar pase. Contacta soporte.")
          }
          return // IMPORTANTE: terminar aquí
        }

        // Si hay membresía
        if (cartAnalysis.membershipType) {
          console.log("[v0] Pago Stripe exitoso - registrando membresía:", cartAnalysis.membershipType)
          const membershipResponse = await fetch("/api/user/update-membership", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              membershipType: cartAnalysis.membershipType,
              paymentId: paymentIntent.id,
              couponCode: appliedCoupon?.code,
              giftCardCode: appliedGiftCard?.code,
              billingCycle: cartAnalysis.billingCycle,
              bagPassTier:
                cartAnalysis.membershipType === "petite" && cartAnalysis.bagPassTier ? cartAnalysis.bagPassTier : null,
            }),
          })

          const membershipData = await membershipResponse.json()
          console.log("[v0] update-membership (stripe) response:", membershipData)

          if (membershipResponse.ok) {
            onSuccess()
          } else {
            onError(membershipData.error || "Pago exitoso pero error al activar membresía. Contacta soporte.")
          }
          return
        }

        onError("Pago exitoso pero no se pudo determinar el tipo de compra. Contacta soporte.")
      } else {
        onError("El pago no se completó correctamente")
      }
    } catch (error) {
      console.error("Payment error:", error)
      onError("Error al procesar el pago. Inténtalo de nuevo.")
    } finally {
      setProcessing(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#1a1a4b",
        "::placeholder": { color: "#9ca3af" },
        fontFamily: "system-ui, sans-serif",
      },
      invalid: { color: "#dc2626" },
    },
    hidePostalCode: true,
  }

  return (
    <Card className="border-[#f4c4cc]/30">
      <CardContent className="pt-6">
        <h3 className="font-medium text-[#1a1a4b] mb-4 flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Datos de pago
        </h3>

        {cardError && (
          <div className="mb-4 p-3 bg-[#fff0f3] border border-[#f4c4cc] rounded-lg">
            <p className="text-sm text-[#1a1a4b]">{cardError}</p>
          </div>
        )}

        {finalAmount <= 0 ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
            <p className="text-green-700 text-sm text-center">
              Tu pedido está completamente cubierto. No se realizará ningún cargo.
            </p>
          </div>
        ) : (
          <div className="border rounded-lg p-4 mb-4">
            <CardElement options={cardElementOptions} />
          </div>
        )}

        <Button
          onClick={handlePayment}
          disabled={processing || !termsAccepted}
          className="w-full bg-[#1a1a4b] hover:bg-[#1a1a4b]/90 text-white py-6"
        >
          {processing ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Procesando...
            </span>
          ) : finalAmount <= 0 ? (
            "Confirmar Pedido"
          ) : (
            `Pagar ${finalAmount.toFixed(2)}€`
          )}
        </Button>

        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
          <ShieldCheck className="h-4 w-4 text-green-600" />
          <span>Pago 100% seguro</span>
        </div>
        <p className="text-xs text-gray-400 text-center mt-1">Procesado por Stripe. Tus datos están protegidos.</p>
      </CardContent>
    </Card>
  )
}

export default function CartPage() {
  const { items, removeItem, total, itemCount, clearCart } = useCart()
  const [user, setUser] = useState<any>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)

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

  const handleSuccess = () => {
    clearCart()
    window.location.href = "/dashboard?welcome=true"
  }

  const handleError = (error: string) => {
    alert(error)
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
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 border border-indigo-dark/10 shadow-sm">
          <CardContent className="p-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
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

        <Elements stripe={stripePromise}>
          <PaymentForm
            finalAmount={finalAmount}
            user={user}
            items={items}
            appliedCoupon={appliedCoupon}
            appliedGiftCard={appliedGiftCard}
            termsAccepted={termsAccepted}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        </Elements>

        <div className="pb-12">
          <Link href="/catalog" className="w-full block">
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

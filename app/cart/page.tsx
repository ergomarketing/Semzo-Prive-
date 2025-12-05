"use client"

import type React from "react"
import { useCart } from "@/app/contexts/cart-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { SMSAuthModal } from "@/app/components/sms-auth-modal"
import { Info, Tag, Gift, Loader2, X, Check, Trash2, CreditCard, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/app/hooks/useAuth"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { getSupabaseBrowser } from "@/app/lib/supabaseClient"

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null

export default function CartPage() {
  const { items, removeItem, total, itemCount, clearCart } = useCart()
  const { user, loading: authLoading, refreshSession } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentError, setPaymentError] = useState("")
  const [activatingMembership, setActivatingMembership] = useState(false)

  const [couponCode, setCouponCode] = useState("")
  const [giftCardCode, setGiftCardCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; type: string } | null>(null)
  const [appliedGiftCard, setAppliedGiftCard] = useState<{ code: string; balance: number } | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [giftCardLoading, setGiftCardLoading] = useState(false)
  const [couponError, setCouponError] = useState("")
  const [giftCardError, setGiftCardError] = useState("")

  const [profileEmail, setProfileEmail] = useState<string>("")

  useEffect(() => {
    const fetchProfileEmail = async () => {
      if (!user) {
        setProfileEmail("")
        return
      }

      const supabase = getSupabaseBrowser()
      if (!supabase) return

      try {
        const { data, error } = await supabase.from("profiles").select("email").eq("id", user.id).maybeSingle()

        if (data?.email) {
          setProfileEmail(data.email)
        } else if (
          user.email &&
          !user.email.includes("@phone.") &&
          !user.email.includes("@temp.") &&
          !user.email.includes("@sms.")
        ) {
          setProfileEmail(user.email)
        } else if (user.user_metadata?.email) {
          setProfileEmail(user.user_metadata.email)
        }
      } catch (error) {
        console.error("[Cart] Error fetching profile email:", error)
      }
    }

    fetchProfileEmail()
  }, [user])

  const userEmail = profileEmail

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
        // Convertir centavos a euros si es necesario
        if (balanceInEuros > 1000) {
          balanceInEuros = balanceInEuros / 100
        }

        if (balanceInEuros <= 0) {
          setGiftCardError("Esta gift card no tiene saldo disponible")
          return
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

  const handleFinalizarCompra = () => {
    if (!termsAccepted) {
      alert("Por favor, acepta los Términos y Condiciones para continuar.")
      return
    }

    if (user) {
      setShowPaymentForm(true)
    } else {
      setShowAuthModal(true)
    }
  }

  const handleAuthSuccess = async (authenticatedUser?: any) => {
    setShowAuthModal(false)

    const supabase = getSupabaseBrowser()
    if (supabase) {
      const {
        data: { user: freshUser },
      } = await supabase.auth.getUser()
      if (freshUser) {
        setShowPaymentForm(true)
      }
    } else if (authenticatedUser) {
      setShowPaymentForm(true)
    }
  }

  const handlePaymentSuccess = async (paymentId: string) => {
    if (!user) {
      setPaymentError("Usuario no autenticado")
      return
    }

    setActivatingMembership(true)

    try {
      const cartItem = items[0]
      const membershipType = cartItem?.name || "essentiel"
      const bagId = cartItem?.bagId || null
      const bagDescription = cartItem?.description || ""

      console.log("[v0] Processing payment success - Membership:", membershipType, "BagId:", bagId)

      const response = await fetch("/api/user/update-membership", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          membershipType: membershipType,
          paymentId: paymentId,
          bagId: bagId, // Pass bagId to create reservation
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error activando membresía")
      }

      const result = await response.json()
      console.log("[v0] Membership activated successfully:", result)

      // Success - clear cart and show success message
      setPaymentSuccess(true)
      clearCart()

      // Clear applied discounts from localStorage
      localStorage.removeItem("appliedCoupon")
      localStorage.removeItem("appliedGiftCard")

      if (bagId) {
        setTimeout(() => {
          window.location.href = "/dashboard/reservas"
        }, 2000)
      }
    } catch (error) {
      console.error("[Cart] Error activating membership:", error)
      setPaymentError(error instanceof Error ? error.message : "Error activando membresía")
    } finally {
      setActivatingMembership(false)
    }
  }

  const handlePaymentError = (error: string) => {
    setPaymentError(error)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-32">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 pt-32">
        <div className="container mx-auto px-4 text-center max-w-md">
          <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-serif text-slate-900 mb-4">¡Pago Completado!</h1>
          <p className="text-slate-600 mb-8">Tu membresía ha sido activada exitosamente.</p>
          <Link href="/dashboard">
            <Button className="bg-[#1a2c4e] hover:bg-[#0f1a2e] text-white">Ir a Mi Dashboard</Button>
          </Link>
        </div>
      </div>
    )
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
  const firstItem = items[0]
  const membershipName = firstItem?.name || "Membresía"

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-serif text-slate-900 mb-8 text-center">CARRITO</h1>

        {items.length > 0 && (
          <div className="space-y-4 mb-6">
            {items.map((item) => (
              <Card key={item.id} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    {item.image && (
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                        <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-serif text-lg text-slate-900">{item.name}</h3>
                          <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                          <span className="inline-block mt-2 px-3 py-1 bg-rose-50 text-[#1a2c4e] text-xs rounded-full">
                            {getBillingCycleLabel(item.billingCycle)}
                          </span>
                        </div>
                        <div className="text-right flex items-start gap-3">
                          <div>
                            <p className="font-serif text-xl text-slate-900">{item.price}</p>
                            <p className="text-sm text-slate-500">
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
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
          <Card className="mb-6 border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3 bg-rose-50 p-4 rounded-lg">
                <Info className="w-5 h-5 text-[#1a2c4e] flex-shrink-0 mt-0.5" />
                <div className="text-sm text-[#1a2c4e]">
                  <p className="font-medium">Membresía Petite + Pase de Bolso</p>
                  <p className="mt-1">Tu reserva incluye la membresía semanal y el pase para el bolso seleccionado.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6 border-0 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">¿Tienes un código de descuento?</span>
              </div>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700">
                      Cupón {appliedCoupon.code} aplicado (-{appliedCoupon.discount}
                      {appliedCoupon.type === "percent" ? "%" : "€"})
                    </span>
                  </div>
                  <button onClick={() => setAppliedCoupon(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Código de cupón"
                    className="flex-1"
                  />
                  <Button onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim()} variant="outline">
                    {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aplicar"}
                  </Button>
                </div>
              )}
              {couponError && <p className="text-sm text-red-500 mt-1">{couponError}</p>}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">¿Tienes una Gift Card?</span>
              </div>
              {appliedGiftCard ? (
                <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700">
                      Gift Card aplicada (Saldo: {appliedGiftCard.balance}€)
                    </span>
                  </div>
                  <button onClick={() => setAppliedGiftCard(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={giftCardCode}
                    onChange={(e) => setGiftCardCode(e.target.value)}
                    placeholder="SEMZO-XXXX-XXXX"
                    className="flex-1"
                  />
                  <Button
                    onClick={handleApplyGiftCard}
                    disabled={giftCardLoading || !giftCardCode.trim()}
                    variant="outline"
                  >
                    {giftCardLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aplicar"}
                  </Button>
                </div>
              )}
              {giftCardError && <p className="text-sm text-red-500 mt-1">{giftCardError}</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 border-0 shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-serif text-lg text-slate-900 mb-4">Resumen del pedido</h3>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-slate-600">{item.name}</span>
                  <span className="text-slate-900">{item.price}</span>
                </div>
              ))}

              {appliedCoupon && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Descuento ({appliedCoupon.code})</span>
                  <span>
                    -{appliedCoupon.type === "percent" ? `${appliedCoupon.discount}%` : `${appliedCoupon.discount}€`}
                  </span>
                </div>
              )}

              {appliedGiftCard && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Gift Card</span>
                  <span>
                    -
                    {Math.min(
                      appliedGiftCard.balance,
                      total -
                        (appliedCoupon?.type === "percent"
                          ? (total * appliedCoupon.discount) / 100
                          : appliedCoupon?.discount || 0),
                    )}
                    €
                  </span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Envío</span>
                <span className="text-green-600">Gratis</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-medium text-slate-900">Total</span>
                <span className="font-serif text-xl text-slate-900">{finalAmount.toFixed(2)}€</span>
              </div>

              {finalAmount === 0 && (
                <div className="bg-green-50 p-3 rounded-lg mt-2">
                  <p className="text-sm text-green-700 text-center">
                    Tu pedido está completamente cubierto. No se realizará ningún cargo.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {showPaymentForm && stripePromise && (
          <Card className="mb-6 border-0 shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-serif text-lg text-slate-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Datos de pago
              </h3>

              {paymentError && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{paymentError}</div>}

              <Elements stripe={stripePromise}>
                <PaymentFormInCart
                  amount={finalAmount}
                  membershipType={membershipName}
                  userEmail={userEmail}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  appliedGiftCard={appliedGiftCard}
                  appliedCoupon={appliedCoupon}
                />
              </Elements>
            </CardContent>
          </Card>
        )}

        {!showPaymentForm && (
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
        )}

        {!showPaymentForm && (
          <div className="space-y-4">
            <Button
              onClick={handleFinalizarCompra}
              disabled={!termsAccepted}
              className="w-full bg-[#1a2c4e] hover:bg-[#0f1a2e] text-white py-6 text-lg"
            >
              FINALIZAR COMPRA
            </Button>

            <Link href="/#membresias" className="block">
              <Button variant="outline" className="w-full py-6 text-lg border-[#1a2c4e] text-[#1a2c4e] bg-transparent">
                SEGUIR COMPRANDO
              </Button>
            </Link>
          </div>
        )}
      </div>

      <SMSAuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={handleAuthSuccess} />
    </div>
  )
}

function PaymentFormInCart({
  amount,
  membershipType,
  userEmail,
  onSuccess,
  onError,
  appliedGiftCard,
  appliedCoupon,
}: {
  amount: number
  membershipType: string
  userEmail: string
  onSuccess: (paymentId: string) => void
  onError: (error: string) => void
  appliedGiftCard: { code: string; balance: number } | null
  appliedCoupon: { code: string; discount: number; type: string } | null
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      onError("Error de inicialización. Recarga la página.")
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement && amount > 0) {
      onError("Error con el formulario de tarjeta.")
      return
    }

    setIsProcessing(true)

    try {
      if (amount <= 0.01) {
        if (appliedGiftCard) {
          await fetch("/api/gift-cards/redeem", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code: appliedGiftCard.code,
              amountToUse: Math.round(appliedGiftCard.balance * 100),
              orderReference: `${membershipType}-${Date.now()}`,
            }),
          })
        }
        onSuccess(`FREE_${Date.now()}`)
        return
      }

      const response = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          membershipType,
          userEmail,
          couponCode: appliedCoupon?.code,
          giftCardUsed: appliedGiftCard ? { code: appliedGiftCard.code, amountUsed: appliedGiftCard.balance } : null,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al crear el pago")
      }

      const data = await response.json()

      if (!data.clientSecret) {
        throw new Error("No se pudo crear el pago")
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: cardElement!,
          billing_details: { email: userEmail },
        },
      })

      if (error) {
        onError(error.message || "Error al procesar el pago")
      } else if (paymentIntent?.status === "succeeded") {
        if (appliedGiftCard) {
          await fetch("/api/gift-cards/redeem", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code: appliedGiftCard.code,
              amountToUse: Math.round(appliedGiftCard.balance * 100),
              orderReference: paymentIntent.id,
            }),
          })
        }
        onSuccess(paymentIntent.id)
      } else {
        onError("El pago no pudo completarse.")
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : "Error de conexión")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {amount > 0 ? (
        <div className="p-4 border border-slate-200 rounded-lg">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#424770",
                  "::placeholder": { color: "#aab7c4" },
                },
              },
            }}
          />
        </div>
      ) : (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
          <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="text-green-800 font-medium">¡Membresía cubierta!</p>
          <p className="text-green-600 text-sm">No necesitas ingresar datos de pago</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-[#1a2c4e] hover:bg-[#0f1a2e] text-white py-6 text-lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="animate-spin h-4 w-4 mr-2" />
            Procesando...
          </>
        ) : amount > 0 ? (
          `Pagar ${amount.toFixed(2)}€`
        ) : (
          "Activar membresía"
        )}
      </Button>

      <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-slate-900 text-sm">Pago 100% seguro</p>
          <p className="text-xs text-slate-600">Procesado por Stripe. Tus datos están protegidos.</p>
        </div>
      </div>
    </form>
  )
}

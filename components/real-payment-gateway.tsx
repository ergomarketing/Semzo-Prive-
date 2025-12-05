"use client"

import type React from "react"

import { useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, Loader2, CheckCircle2, AlertTriangle, Tag, X, Gift } from "lucide-react"
import { Input } from "@/components/ui/input"

const stripePublishableKey =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
  "pk_live_51RP3lcKBSKEgBoTnr4wD4bc7kQjyBS2uvdpVARXyUeXRs3XePkTt1qOJA8GHobCxEjxGZrk5q5HpQpDm00qcY9lh00Y07H4mwB"

const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null

interface PaymentFormProps {
  amount: number
  membershipType: string
  userEmail: string
  onSuccess: (paymentId: string) => void
  onError: (error: string) => void
}

interface AppliedCoupon {
  code: string
  name: string
  percentOff?: number
  amountOff?: number
  finalAmount: number
}

interface AppliedGiftCard {
  id: string
  code: string
  availableAmount: number
  amountToUse: number
}

function PaymentForm({ amount, membershipType, userEmail, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [couponCode, setCouponCode] = useState("")
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)
  const [couponError, setCouponError] = useState("")

  const [giftCardCode, setGiftCardCode] = useState("")
  const [isValidatingGiftCard, setIsValidatingGiftCard] = useState(false)
  const [appliedGiftCard, setAppliedGiftCard] = useState<AppliedGiftCard | null>(null)
  const [giftCardError, setGiftCardError] = useState("")

  const isStripeConfigured = !!(
    stripePublishableKey &&
    (stripePublishableKey.startsWith("pk_live_") || stripePublishableKey.startsWith("pk_test_"))
  )

  const amountAfterCoupon = appliedCoupon ? appliedCoupon.finalAmount : amount
  const giftCardDiscount = appliedGiftCard ? appliedGiftCard.amountToUse : 0
  const finalAmount = Math.max(0, amountAfterCoupon - giftCardDiscount / 100)

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return

    setIsValidatingCoupon(true)
    setCouponError("")

    try {
      const response = await fetch("/api/payments/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          couponCode: couponCode.trim(),
          amount,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setCouponError(data.error || "Cupón no válido")
        return
      }

      setAppliedCoupon({
        code: couponCode.trim(),
        name: data.name,
        percentOff: data.percentOff,
        amountOff: data.amountOff,
        finalAmount: data.finalAmount,
      })
      setCouponCode("")
    } catch (err) {
      setCouponError("Error al validar el cupón")
    } finally {
      setIsValidatingCoupon(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponError("")
  }

  const handleApplyGiftCard = async () => {
    if (!giftCardCode.trim()) return

    setIsValidatingGiftCard(true)
    setGiftCardError("")

    try {
      const response = await fetch("/api/gift-cards/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: giftCardCode.trim() }),
      })

      const data = await response.json()

      if (!response.ok || !data.valid) {
        setGiftCardError(data.error || "Gift card no válida")
        return
      }

      // Calculate how much to use (max = remaining amount to pay)
      const remainingToPay = Math.round(amountAfterCoupon * 100) // Convert to cents and round to avoid float issues
      const amountToUse = Math.min(data.giftCard.amount, remainingToPay)

      setAppliedGiftCard({
        id: data.giftCard.id,
        code: data.giftCard.code,
        availableAmount: data.giftCard.amount,
        amountToUse,
      })
      setGiftCardCode("")
    } catch (err) {
      setGiftCardError("Error al validar la gift card")
    } finally {
      setIsValidatingGiftCard(false)
    }
  }

  const handleRemoveGiftCard = () => {
    setAppliedGiftCard(null)
    setGiftCardError("")
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      onError("Error de inicialización. Recarga la página.")
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement && finalAmount > 0) {
      onError("Error con el formulario de tarjeta.")
      return
    }

    setIsProcessing(true)

    try {
      if (appliedGiftCard && appliedGiftCard.amountToUse > 0) {
        const redeemResponse = await fetch("/api/gift-cards/redeem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: appliedGiftCard.code,
            amountToUse: appliedGiftCard.amountToUse,
            orderReference: `${membershipType}-${Date.now()}`,
          }),
        })

        if (!redeemResponse.ok) {
          const error = await redeemResponse.json()
          throw new Error(error.error || "Error al usar la gift card")
        }
      }

      // If fully covered by gift card (and/or coupon), no payment needed
      // Check if finalAmount is close to zero (due to floating point arithmetic)
      if (finalAmount <= 0.01) {
        onSuccess(`FREE_${Date.now()}`)
        return
      }

      const response = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({
          amount: finalAmount,
          membershipType,
          userEmail,
          couponCode: appliedCoupon?.code,
          giftCardUsed: appliedGiftCard
            ? {
                code: appliedGiftCard.code,
                amountUsed: appliedGiftCard.amountToUse,
              }
            : null,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Error del servidor (${response.status}): ${errorText}`)
      }

      const data = await response.json()

      if (!data.clientSecret) {
        throw new Error("No se pudo crear el pago - respuesta inválida del servidor")
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: cardElement!,
          billing_details: {
            email: userEmail,
          },
        },
      })

      if (error) {
        let errorMessage = "Error al procesar el pago"
        if (error.code === "card_declined") {
          errorMessage = "Tarjeta rechazada. Verifica los datos."
        } else if (error.code === "insufficient_funds") {
          errorMessage = "Fondos insuficientes."
        } else if (error.code === "expired_card") {
          errorMessage = "Tarjeta expirada."
        } else if (error.message) {
          errorMessage = error.message
        }
        onError(errorMessage)
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        onSuccess(paymentIntent.id)
      } else {
        onError("El pago no pudo completarse.")
      }
    } catch (err) {
      let errorMessage = "Error de conexión. Inténtalo de nuevo."
      if (err instanceof Error) {
        errorMessage = err.message
      }
      onError(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isStripeConfigured) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-4">Configuración de Pagos Requerida</h3>
          <p className="text-slate-600 mb-6">
            Para procesar pagos reales, necesitas configurar tu clave pública de Stripe en las variables de entorno.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <code className="text-sm">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>
          </div>
          <Button
            onClick={() => window.open("https://dashboard.stripe.com/apikeys", "_blank")}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Obtener clave de Stripe
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-indigo-dark/90 to-indigo-dark text-white rounded-t-lg">
        <CardTitle className="flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Información de pago
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Price summary */}
        <div className="mb-6 space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-lg font-medium text-slate-900">Membresía {membershipType}:</p>
            <p
              className={`text-lg ${appliedCoupon || appliedGiftCard ? "line-through text-slate-400" : "font-bold text-indigo-dark"}`}
            >
              {amount}€
            </p>
          </div>

          {appliedCoupon && (
            <div className="flex justify-between items-center text-green-600">
              <p className="text-sm flex items-center">
                <Tag className="h-4 w-4 mr-1" />
                Cupón ({appliedCoupon.percentOff ? `${appliedCoupon.percentOff}%` : `${appliedCoupon.amountOff}€`})
              </p>
              <p className="text-sm">-{(amount - appliedCoupon.finalAmount).toFixed(2)}€</p>
            </div>
          )}

          {appliedGiftCard && (
            <div className="flex justify-between items-center text-purple-600">
              <p className="text-sm flex items-center">
                <Gift className="h-4 w-4 mr-1" />
                Gift Card ({appliedGiftCard.code})
              </p>
              <p className="text-sm">-{(appliedGiftCard.amountToUse / 100).toFixed(2)}€</p>
            </div>
          )}

          {(appliedCoupon || appliedGiftCard) && (
            <div className="flex justify-between items-center border-t pt-2">
              <p className="text-lg font-bold text-slate-900">Total a pagar:</p>
              <p className="text-2xl font-bold text-indigo-dark">{finalAmount.toFixed(2)}€</p>
            </div>
          )}

          {!appliedCoupon && !appliedGiftCard && (
            <div className="flex justify-between items-center">
              <p className="text-lg font-bold text-slate-900">Total a pagar:</p>
              <p className="text-2xl font-bold text-indigo-dark">{amount}€</p>
            </div>
          )}
        </div>

        {/* Coupon section */}
        <div className="mb-4 p-4 bg-slate-50 rounded-lg">
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            <Tag className="h-4 w-4 inline mr-1" />
            ¿Tienes un código de descuento?
          </label>

          {appliedCoupon ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <p className="font-medium text-green-800">{appliedCoupon.code}</p>
                  <p className="text-xs text-green-600">{appliedCoupon.name}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveCoupon}
                className="text-slate-500 hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Ingresa tu código"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value)
                  setCouponError("")
                }}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleApplyCoupon}
                disabled={isValidatingCoupon || !couponCode.trim()}
              >
                {isValidatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
              </Button>
            </div>
          )}

          {couponError && <p className="text-red-500 text-sm mt-2">{couponError}</p>}
        </div>

        <div className="mb-6 p-4 bg-purple-50 rounded-lg">
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            <Gift className="h-4 w-4 inline mr-1" />
            ¿Tienes una Gift Card?
          </label>

          {appliedGiftCard ? (
            <div className="flex items-center justify-between bg-purple-100 border border-purple-200 rounded-lg p-3">
              <div className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-purple-600 mr-2" />
                <div>
                  <p className="font-medium text-purple-800">{appliedGiftCard.code}</p>
                  <p className="text-xs text-purple-600">
                    Usando {(appliedGiftCard.amountToUse / 100).toFixed(2)}€ de{" "}
                    {(appliedGiftCard.availableAmount / 100).toFixed(2)}€ disponibles
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveGiftCard}
                className="text-slate-500 hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="SEMZO-XXXX-XXXX"
                value={giftCardCode}
                onChange={(e) => {
                  setGiftCardCode(e.target.value.toUpperCase())
                  setGiftCardError("")
                }}
                className="flex-1 uppercase font-mono"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleApplyGiftCard}
                disabled={isValidatingGiftCard || !giftCardCode.trim()}
                className="border-purple-200 hover:bg-purple-50 bg-transparent"
              >
                {isValidatingGiftCard ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
              </Button>
            </div>
          )}

          {giftCardError && <p className="text-red-500 text-sm mt-2">{giftCardError}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {finalAmount > 0 ? (
            <div className="p-4 border border-slate-200 rounded-lg">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: "16px",
                      color: "#424770",
                      "::placeholder": {
                        color: "#aab7c4",
                      },
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
            className="w-full bg-indigo-dark text-white hover:bg-indigo-dark/90 h-12"
          >
            {isProcessing ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Procesando...
              </>
            ) : finalAmount > 0 ? (
              `Pagar ${finalAmount.toFixed(2)}€`
            ) : (
              "Activar membresía"
            )}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-slate-50 rounded-lg flex items-start">
          <CheckCircle2 className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
          <div>
            <h4 className="font-medium text-slate-900 mb-1">Pago 100% seguro</h4>
            <p className="text-sm text-slate-600">Procesado por Stripe. Tus datos están protegidos.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function RealPaymentGateway(props: PaymentFormProps) {
  if (!stripePromise) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-4">Stripe no configurado</h3>
          <p className="text-slate-600">
            Configura NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY en las variables de entorno para habilitar pagos.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  )
}

export { RealPaymentGateway }

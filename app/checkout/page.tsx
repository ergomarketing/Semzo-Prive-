"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Check, Gift, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import RealPaymentGateway from "@/components/real-payment-gateway"
import { useAuth } from "../hooks/useAuth"

type CheckoutState = "summary" | "payment" | "success" | "error"

export default function CheckoutPage() {
  const { user, loading } = useAuth()
  const [checkoutState, setCheckoutState] = useState<CheckoutState>("summary")
  const [paymentId, setPaymentId] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [selectedPlan, setSelectedPlan] = useState({
    name: "Signature",
    price: 129,
    description: "Membresía mensual Signature",
  })

  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; type: string } | null>(null)
  const [appliedGiftCard, setAppliedGiftCard] = useState<{ code: string; balance: number } | null>(null)
  const [finalAmount, setFinalAmount] = useState(129)
  const [hasActiveMembership, setHasActiveMembership] = useState(false)
  const [membershipCheckLoading, setMembershipCheckLoading] = useState(true)
  const [activating, setActivating] = useState(false)

  useEffect(() => {
    const checkMembership = async () => {
      if (!user?.id) return

      try {
        const baseUrl =
          typeof window !== "undefined"
            ? window.location.origin
            : process.env.NEXT_PUBLIC_SITE_URL || "https://www.semzoprive.com"
        const response = await fetch(`${baseUrl}/api/user/check-membership-status?userId=${user.id}`)

        if (!response.ok) {
          throw new Error("Failed to check membership status")
        }

        const data = await response.json()

        if (data.hasActiveMembership) {
          setHasActiveMembership(true)
          setErrorMessage(
            `Ya tienes una membresía ${data.membershipType} activa hasta el ${new Date(data.endDate).toLocaleDateString("es-ES")}`,
          )
          setCheckoutState("error")
        }
      } catch (error) {
        console.error("[v0] Error checking membership:", error)
        setMembershipCheckLoading(false)
      } finally {
        setMembershipCheckLoading(false)
      }
    }

    if (user && !loading) {
      checkMembership()
    }
  }, [user, loading])

  useEffect(() => {
    const checkAccountAndAvailability = async () => {
      if (!user?.id) return

      try {
        // Verificar estado de cuenta
        const accountRes = await fetch("/api/user/account-status")
        if (accountRes.ok) {
          const accountData = await accountRes.json()
          // setAccountStatus(accountData)

          if (!accountData.canCheckout) {
            setErrorMessage(accountData.message || "No puedes realizar checkout en este momento")
            setCheckoutState("error")
            return
          }
        }

        // Verificar disponibilidad del plan
        const availabilityRes = await fetch("/api/membership/check-availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ membershipType: selectedPlan.name.toLowerCase() }),
        })

        if (availabilityRes.ok) {
          const availabilityData = await availabilityRes.json()
          if (!availabilityData.available) {
            setErrorMessage(availabilityData.reason || "Plan no disponible")
            setCheckoutState("error")
            return
          }
        }

        // setAvailabilityChecked(true)
      } catch (error) {
        console.error("Error checking account/availability:", error)
      }
    }

    if (user && !loading && !membershipCheckLoading) {
      checkAccountAndAvailability()
    }
  }, [user, loading, membershipCheckLoading, selectedPlan.name])

  useEffect(() => {
    if (typeof window === "undefined") return

    const params = new URLSearchParams(window.location.search)
    const planFromUrl = params.get("plan")

    let price = 129
    let name = "Signature"

    if (planFromUrl === "essentiel") {
      price = 59
      name = "L'Essentiel"
    } else if (planFromUrl === "prive") {
      price = 189
      name = "Privé"
    } else if (planFromUrl === "petite") {
      price = 19.99
      name = "Petite"
    }

    setSelectedPlan({ name, price, description: `Membresía mensual ${name}` })

    const couponCode = params.get("coupon")
    const couponDiscount = params.get("couponDiscount")
    const giftCardCode = params.get("giftCard")
    const giftCardBalance = params.get("giftCardBalance")

    let amount = price

    if (couponCode && couponDiscount) {
      const discount = Number.parseFloat(couponDiscount)
      setAppliedCoupon({ code: couponCode, discount, type: "percent" })
      amount = amount * (1 - discount / 100)
    }

    if (giftCardCode && giftCardBalance) {
      const balance = Number.parseFloat(giftCardBalance)
      setAppliedGiftCard({ code: giftCardCode, balance })
      amount = Math.max(0, amount - balance)
    }

    setFinalAmount(amount)
  }, [])

  const handleZeroAmountCheckout = async () => {
    setActivating(true)
    try {
      const response = await fetch("/api/user/update-membership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          membershipType: selectedPlan.name.toLowerCase(),
          paymentId: `gift_${Date.now()}`,
          couponCode: appliedCoupon?.code,
          giftCardCode: appliedGiftCard?.code,
        }),
      })

      if (response.ok) {
        setCheckoutState("success")
      } else {
        const errorData = await response.json()
        setErrorMessage(errorData.error || "Error al activar membresía")
        setCheckoutState("error")
      }
    } catch (error) {
      setErrorMessage("Error de conexión")
      setCheckoutState("error")
    } finally {
      setActivating(false)
    }
  }

  const handlePaymentSuccess = async (id: string) => {
    setPaymentId(id)

    try {
      if (appliedGiftCard && finalAmount > 0) {
        const amountToRedeem = Math.min(appliedGiftCard.balance * 100, selectedPlan.price * 100 - finalAmount * 100)
        await fetch("/api/gift-cards/redeem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: appliedGiftCard.code,
            amountToUse: amountToRedeem,
            orderReference: `membership_${selectedPlan.name.toLowerCase()}_${id}`,
          }),
        })
      }

      const response = await fetch("/api/user/update-membership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          membershipType: selectedPlan.name.toLowerCase(),
          paymentId: id,
          couponCode: appliedCoupon?.code,
          giftCardCode: appliedGiftCard?.code,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error updating membership:", errorData)
      }
    } catch (error) {
      console.error("Error updating membership status:", error)
    }

    setCheckoutState("success")
  }

  const handlePaymentError = (error: string) => {
    setErrorMessage(error)
    setCheckoutState("error")
  }

  const handleRetryPayment = () => {
    if (hasActiveMembership) {
      window.location.href = "/dashboard/membresia"
      return
    }
    setCheckoutState("payment")
  }

  const handleContinueToAccount = () => {
    window.location.href = "/dashboard"
  }

  if (loading || membershipCheckLoading) {
    return (
      <div className="min-h-screen bg-white pt-32 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-dark mx-auto mb-4"></div>
          <p className="text-indigo-dark/60">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/cart"
    }
    return null
  }

  return (
    <div className="min-h-screen bg-white pt-32">
      <div className="container mx-auto px-4 max-w-4xl pb-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/cart" className="inline-flex items-center text-indigo-dark hover:text-rose-pastel mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al resumen
          </Link>
          <h1 className="text-4xl font-serif text-indigo-dark text-center mb-2">CHECKOUT</h1>
          <p className="text-center text-indigo-dark/60">Completa tu pedido de manera segura</p>
        </div>

        {checkoutState === "summary" && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Plan seleccionado */}
            <Card className="border border-indigo-dark/10 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-serif text-lg text-indigo-dark mb-4">Información de pago</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-indigo-dark/10">
                    <div>
                      <h4 className="font-serif text-xl text-indigo-dark">Membresía {selectedPlan.name}</h4>
                      <p className="text-sm text-indigo-dark/60 mt-1">{selectedPlan.description}</p>
                    </div>
                    <p className="font-serif text-xl text-indigo-dark">{selectedPlan.price}€</p>
                  </div>

                  {appliedCoupon && (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-rose-pastel">
                        <Check className="w-4 h-4" />
                        <span>Cupón {appliedCoupon.code}</span>
                      </div>
                      <span className="text-rose-pastel">
                        -
                        {appliedCoupon.type === "percent" ? `${appliedCoupon.discount}%` : `${appliedCoupon.discount}€`}
                      </span>
                    </div>
                  )}

                  {appliedGiftCard && (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-rose-pastel">
                        <Gift className="w-4 h-4" />
                        <span>Gift Card {appliedGiftCard.code}</span>
                      </div>
                      <span className="text-rose-pastel">
                        -{Math.min(appliedGiftCard.balance, selectedPlan.price).toFixed(2)}€
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between pt-3 border-t border-indigo-dark/10">
                    <span className="font-medium text-indigo-dark">Total a pagar:</span>
                    <span className="font-serif text-2xl text-indigo-dark">{finalAmount.toFixed(2)}€</span>
                  </div>

                  {finalAmount === 0 && (
                    <div className="bg-rose-nude border border-rose-pastel/30 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-indigo-dark mb-1">
                        <Check className="w-5 h-5" />
                        <span className="font-medium">¡Membresía cubierta!</span>
                      </div>
                      <p className="text-sm text-indigo-dark/70">No necesitas ingresar datos de pago</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Botón de acción */}
            <Button
              onClick={() => (finalAmount === 0 ? handleZeroAmountCheckout() : setCheckoutState("payment"))}
              disabled={activating}
              className="w-full py-6 text-lg bg-indigo-dark hover:bg-indigo-dark/90 text-white"
            >
              {activating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Activando...
                </>
              ) : finalAmount === 0 ? (
                "Activar membresía"
              ) : (
                "Continuar al pago"
              )}
            </Button>
          </div>
        )}

        {checkoutState === "payment" && (
          <div className="max-w-md mx-auto">
            <Card className="border border-indigo-dark/10 shadow-sm">
              <CardContent className="p-6">
                <RealPaymentGateway
                  amount={finalAmount}
                  membershipType={selectedPlan.name}
                  userEmail={user?.email || `temp_${user?.id}@semzoprive.com`}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {checkoutState === "success" && (
          <div className="max-w-2xl mx-auto">
            <Card className="border border-indigo-dark/10 shadow-sm">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-serif text-indigo-dark mb-2">¡Membresía Activada!</h2>
                <p className="text-indigo-dark/60 mb-6">Tu membresía {selectedPlan.name} está activa</p>
                <Button
                  onClick={handleContinueToAccount}
                  className="w-full bg-indigo-dark hover:bg-indigo-dark/90 text-white"
                >
                  Ir al Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {checkoutState === "error" && (
          <div className="max-w-2xl mx-auto">
            <Card className="border border-red-200 shadow-sm">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-serif text-indigo-dark mb-2">Error</h2>
                <p className="text-indigo-dark/60 mb-6">{errorMessage}</p>
                <Button
                  onClick={handleRetryPayment}
                  className="w-full bg-indigo-dark hover:bg-indigo-dark/90 text-white"
                >
                  {hasActiveMembership ? "Ir a Mi Membresía" : "Intentar nuevamente"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

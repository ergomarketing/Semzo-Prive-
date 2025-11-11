"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ShoppingBag, Check } from "lucide-react"
import Link from "next/link"
import RealPaymentGateway from "@/components/real-payment-gateway"
import { PaymentSuccess, PaymentError } from "@/components/payment-gateway"
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const planFromUrl = new URLSearchParams(window.location.search).get("plan")

      if (planFromUrl === "essentiel") {
        setSelectedPlan({
          name: "L'Essentiel",
          price: 59,
          description: "Membresía mensual L'Essentiel",
        })
      } else if (planFromUrl === "prive") {
        setSelectedPlan({
          name: "Privé",
          price: 189,
          description: "Membresía mensual Privé",
        })
      }
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-nude/10 to-rose-pastel/5 py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-dark mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando checkout...</p>
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

  const handlePaymentSuccess = async (id: string) => {
    setPaymentId(id)

    try {
      let membershipType = "essentiel"
      if (selectedPlan.name.includes("Privé")) {
        membershipType = "prive"
      } else if (selectedPlan.name.includes("Signature")) {
        membershipType = "signature"
      }

      const response = await fetch("/api/user/update-membership", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.id,
          membershipType: membershipType,
          paymentId: id,
        }),
      })

      if (response.ok) {
        console.log("[v0] Membership status updated successfully")
      }
    } catch (error) {
      console.error("[v0] Error updating membership status:", error)
    }

    setCheckoutState("success")
  }

  const handlePaymentError = (error: string) => {
    setErrorMessage(error)
    setCheckoutState("error")
  }

  const handleRetryPayment = () => {
    setCheckoutState("payment")
  }

  const handleContinueToAccount = () => {
    window.location.href = "/dashboard"
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-nude/10 to-rose-pastel/5 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <Link href="/cart" className="inline-flex items-center text-indigo-dark hover:underline mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al carrito
          </Link>
          <h1 className="font-serif text-3xl text-slate-900">Finalizar compra</h1>

          <div className="mt-6 relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2"></div>
            <div className="relative flex justify-between">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                    checkoutState === "summary" ? "bg-indigo-dark text-white" : "bg-green-500 text-white"
                  }`}
                >
                  {checkoutState === "summary" ? "1" : <Check className="h-5 w-5" />}
                </div>
                <span className="text-xs mt-2">Resumen</span>
              </div>

              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                    checkoutState === "payment"
                      ? "bg-indigo-dark text-white"
                      : checkoutState === "success" || checkoutState === "error"
                        ? "bg-green-500 text-white"
                        : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {checkoutState === "success" || checkoutState === "error" ? <Check className="h-5 w-5" /> : "2"}
                </div>
                <span className="text-xs mt-2">Pago</span>
              </div>

              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                    checkoutState === "success" ? "bg-green-500 text-white" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {checkoutState === "success" ? <Check className="h-5 w-5" /> : "3"}
                </div>
                <span className="text-xs mt-2">Confirmación</span>
              </div>
            </div>
          </div>
        </div>

        {checkoutState === "summary" && (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ShoppingBag className="h-5 w-5 mr-2" />
                    Resumen de tu pedido
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <div>
                        <h3 className="font-serif text-xl text-slate-900">Membresía {selectedPlan.name}</h3>
                        <p className="text-slate-600">{selectedPlan.description}</p>
                      </div>
                      <p className="text-xl font-bold text-indigo-dark">{selectedPlan.price}€</p>
                    </div>

                    <div className="flex justify-between pt-2">
                      <p className="text-lg font-medium text-slate-900">Total</p>
                      <p className="text-2xl font-bold text-indigo-dark">{selectedPlan.price}€</p>
                    </div>

                    <div className="pt-4">
                      <Button
                        onClick={() => setCheckoutState("payment")}
                        className="w-full bg-indigo-dark text-white hover:bg-indigo-dark/90"
                      >
                        Continuar al pago
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Detalles de la membresía</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm">
                    <p className="text-slate-600">Tu membresía {selectedPlan.name} incluye:</p>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <span>1 bolso por mes</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <span>Envío gratuito</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <span>Seguro incluido</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {checkoutState === "payment" && (
          <div className="max-w-md mx-auto">
            <RealPaymentGateway
              amount={selectedPlan.price}
              membershipType={selectedPlan.name}
              userEmail={
                user?.email && user.email !== ""
                  ? user.email
                  : user?.phone
                    ? `sms_${user.phone}@semzoprive.temp`
                    : "guest@semzoprive.temp"
              }
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </div>
        )}

        {checkoutState === "success" && <PaymentSuccess paymentId={paymentId} onContinue={handleContinueToAccount} />}

        {checkoutState === "error" && <PaymentError error={errorMessage} onRetry={handleRetryPayment} />}
      </div>
    </div>
  )
}

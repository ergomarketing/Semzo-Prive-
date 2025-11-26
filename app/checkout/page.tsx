"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ShoppingBag, Check, Info } from "lucide-react"
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
  const [selectedPlan, setSelectedPlan] = useState<{
    name: string
    price: number
    description: string
    billingCycle: "weekly" | "monthly" | "quarterly"
    features: string[]
  } | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedMembership = localStorage.getItem("selectedMembership")

      if (storedMembership) {
        try {
          const parsed = JSON.parse(storedMembership)
          const priceNumber =
            typeof parsed.price === "string"
              ? Number.parseFloat(parsed.price.replace("€", "").replace(",", "."))
              : parsed.price

          setSelectedPlan({
            name: parsed.name,
            price: priceNumber,
            description:
              parsed.billingCycle === "weekly"
                ? `Membresía semanal ${parsed.name}`
                : parsed.billingCycle === "quarterly"
                  ? `Membresía trimestral ${parsed.name}`
                  : `Membresía mensual ${parsed.name}`,
            billingCycle: parsed.billingCycle || "monthly",
            features: parsed.features || [],
          })
          return
        } catch (e) {
          console.error("[v0] Error parsing stored membership:", e)
        }
      }

      // Fallback to URL params
      const planFromUrl = new URLSearchParams(window.location.search).get("plan")

      if (planFromUrl === "petite") {
        setSelectedPlan({
          name: "Petite",
          price: 19.99,
          description: "Membresía semanal Petite",
          billingCycle: "weekly",
          features: ["1 bolso por semana", "Envío gratuito", "Seguro incluido", "Sin compromiso"],
        })
      } else if (planFromUrl === "essentiel") {
        setSelectedPlan({
          name: "L'Essentiel",
          price: 59,
          description: "Membresía mensual L'Essentiel",
          billingCycle: "monthly",
          features: ["1 bolso por mes", "Envío gratuito", "Seguro incluido", "Atención al cliente prioritaria"],
        })
      } else if (planFromUrl === "prive") {
        setSelectedPlan({
          name: "Privé",
          price: 189,
          description: "Membresía mensual Privé",
          billingCycle: "monthly",
          features: ["1 bolso por mes", "Envío express gratuito", "Seguro premium incluido", "Acceso VIP"],
        })
      } else {
        // Default to Signature
        setSelectedPlan({
          name: "Signature",
          price: 129,
          description: "Membresía mensual Signature",
          billingCycle: "monthly",
          features: [
            "1 bolso por mes",
            "Envío express gratuito",
            "Seguro premium incluido",
            "Acceso a colecciones exclusivas",
          ],
        })
      }
    }
  }, [])

  if (loading || !selectedPlan) {
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
      const response = await fetch("/api/user/update-membership", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.id,
          membershipType: selectedPlan.name.toLowerCase(),
          paymentId: id,
          billingCycle: selectedPlan.billingCycle,
        }),
      })

      if (response.ok) {
        console.log("[v0] Membership status updated successfully")
        // Clear the stored membership after successful payment
        localStorage.removeItem("selectedMembership")
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
    if (selectedPlan.billingCycle === "weekly") {
      window.location.href = "/catalog"
    } else {
      window.location.href = "/dashboard"
    }
  }

  const getBillingLabel = () => {
    switch (selectedPlan.billingCycle) {
      case "weekly":
        return "/semana"
      case "quarterly":
        return "/trimestre"
      default:
        return "/mes"
    }
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
                      <p className="text-xl font-bold text-indigo-dark">
                        {selectedPlan.price.toFixed(2).replace(".", ",")}€{getBillingLabel()}
                      </p>
                    </div>

                    {selectedPlan.billingCycle === "weekly" && (
                      <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-start gap-3">
                        <Info className="h-5 w-5 text-rose-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-slate-700 font-medium">Siguiente paso: Elige tu bolso</p>
                          <p className="text-sm text-slate-600 mt-1">
                            Después del pago, podrás elegir un bolso del catálogo. El precio del Pase de Bolso varía
                            según la categoría: L'Essenciel (52€), Signature (99€), Privé (137€).
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between pt-2">
                      <p className="text-lg font-medium text-slate-900">Total</p>
                      <p className="text-2xl font-bold text-indigo-dark">
                        {selectedPlan.price.toFixed(2).replace(".", ",")}€
                      </p>
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
                      {selectedPlan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
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

        {checkoutState === "success" && (
          <PaymentSuccess
            paymentId={paymentId}
            onContinue={handleContinueToAccount}
            customMessage={
              selectedPlan.billingCycle === "weekly"
                ? "¡Tu membresía Petite está activa! Ahora puedes elegir tu primer bolso."
                : undefined
            }
            customButtonText={selectedPlan.billingCycle === "weekly" ? "Elegir mi bolso" : undefined}
          />
        )}

        {checkoutState === "error" && <PaymentError error={errorMessage} onRetry={handleRetryPayment} />}
      </div>
    </div>
  )
}

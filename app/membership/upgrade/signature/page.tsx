"use client"

import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, Check } from "lucide-react"
import RealPaymentGateway from "@/components/real-payment-gateway"

export default function SignatureUpgradePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [showPayment, setShowPayment] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  const handlePaymentSuccess = async (paymentId: string) => {
    try {
      // Update user membership in database
      const response = await fetch("/api/membership/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.id,
          membershipType: "signature",
          paymentId: paymentId,
        }),
      })

      if (response.ok) {
        router.push("/dashboard?upgrade=success")
      } else {
        console.error("Error updating membership")
        alert("Pago procesado pero error al actualizar membresía. Contacta soporte.")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al procesar el upgrade. Contacta soporte.")
    }
  }

  const handlePaymentError = (error: string) => {
    console.error("Payment error:", error)
    alert(`Error en el pago: ${error}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin h-8 w-8 text-slate-600" />
      </div>
    )
  }

  if (!user) return null

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-12">
        <Button onClick={() => router.push("/")} variant="ghost" className="mb-8 text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Membresías
        </Button>

        <div className="max-w-2xl mx-auto">
          {!showPayment ? (
            <Card className="border-0 shadow-lg ring-2 ring-rose-200">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center mb-4">
                    <span className="bg-rose-100 text-slate-900 px-4 py-1 rounded-full text-sm font-medium">
                      Más Popular
                    </span>
                  </div>
                  <h1 className="font-serif text-4xl text-slate-900 mb-4">Signature</h1>
                  <div className="mb-4">
                    <span className="font-serif text-5xl font-light text-slate-900">129€</span>
                    <span className="text-lg text-slate-600 font-light">/mes</span>
                  </div>
                  <p className="text-slate-700 font-light">
                    La experiencia preferida por nuestras clientas más exigentes.
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-600 mr-3" />
                    <span>1 bolso por mes</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-600 mr-3" />
                    <span>Envío express gratuito</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-600 mr-3" />
                    <span>Seguro premium incluido</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-600 mr-3" />
                    <span>Acceso a colecciones exclusivas</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-600 mr-3" />
                    <span>Personal shopper dedicado</span>
                  </div>
                </div>

                <Button
                  className="w-full bg-rose-100 hover:bg-rose-200 text-slate-900 py-3"
                  onClick={() => setShowPayment(true)}
                >
                  Confirmar Upgrade a Signature
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Button
                onClick={() => setShowPayment(false)}
                variant="ghost"
                className="text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al resumen
              </Button>

              <RealPaymentGateway
                amount={129}
                membershipType="Signature"
                userEmail={user.email || ""}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

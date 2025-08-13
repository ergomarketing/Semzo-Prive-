"use client"

import type React from "react"

import { useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, Loader2, CheckCircle2, AlertTriangle } from "lucide-react"

const stripePublishableKey =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
  "pk_live_51RP3lcKBSKEgBoTnr4wD4bc7kQjyBS2uvdpVARXyUeXRs3XePkTt1qOJA8GHobCxEjxGZrk5q5HpQpDm00qcY9lh00Y07H4mwB"

// Debug log para verificar la clave
console.log("🔑 Stripe Key Status:", {
  hasKey: !!stripePublishableKey,
  keyPrefix: stripePublishableKey?.substring(0, 8),
  keyLength: stripePublishableKey?.length,
})

// Inicializar Stripe solo si hay clave configurada
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null

interface PaymentFormProps {
  amount: number
  membershipType: string
  userEmail: string
  onSuccess: (paymentId: string) => void
  onError: (error: string) => void
}

function PaymentForm({ amount, membershipType, userEmail, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)

  const isStripeConfigured = !!(
    stripePublishableKey &&
    (stripePublishableKey.startsWith("pk_live_") || stripePublishableKey.startsWith("pk_test_"))
  )

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      onError("Error de inicialización. Recarga la página.")
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      onError("Error con el formulario de tarjeta.")
      return
    }

    setIsProcessing(true)

    try {
      console.log("💳 Iniciando proceso de pago...")
      console.log("📊 Datos:", { amount, membershipType, userEmail })

      // Crear payment intent
      const response = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({
          amount,
          membershipType,
          userEmail,
        }),
      })

      console.log("🌐 Respuesta del servidor:", response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Error del servidor:", errorText)
        throw new Error(`Error del servidor (${response.status}): ${errorText}`)
      }

      const data = await response.json()
      console.log("📦 Datos recibidos:", data)

      if (!data.clientSecret) {
        console.error("❌ No se recibió clientSecret")
        throw new Error("No se pudo crear el pago - respuesta inválida del servidor")
      }

      console.log("🔐 Confirmando pago con Stripe...")

      // Confirmar el pago
      const { error, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: userEmail,
          },
        },
      })

      if (error) {
        console.error("❌ Error de Stripe:", error)
        let errorMessage = "Error al procesar el pago"

        if (error.code === "card_declined") {
          errorMessage = "Tarjeta rechazada. Verifica los datos."
        } else if (error.code === "insufficient_funds") {
          errorMessage = "Fondos insuficientes."
        } else if (error.code === "expired_card") {
          errorMessage = "Tarjeta expirada."
        } else if (error.code === "network_error") {
          errorMessage = "Error de conexión. Verifica tu internet."
        } else if (error.message) {
          errorMessage = error.message
        }

        onError(errorMessage)
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        console.log("✅ Pago exitoso:", paymentIntent.id)
        onSuccess(paymentIntent.id)
      } else {
        console.error("❌ Estado inesperado:", paymentIntent?.status)
        onError("El pago no pudo completarse.")
      }
    } catch (err) {
      console.error("❌ Error general:", err)

      let errorMessage = "Error de conexión. Inténtalo de nuevo."

      if (err instanceof Error) {
        if (err.message.includes("fetch")) {
          errorMessage = "Error de conexión con el servidor. Verifica tu internet."
        } else if (err.message.includes("NetworkError")) {
          errorMessage = "Error de red. Verifica tu conexión a internet."
        } else {
          errorMessage = err.message
        }
      }

      onError(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  // Si Stripe no está configurado, mostrar mensaje de configuración
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
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <p className="text-lg font-medium text-slate-900">Total a pagar:</p>
            <p className="text-2xl font-bold text-indigo-dark">{amount}€</p>
          </div>
          <p className="text-slate-600 text-sm">Membresía {membershipType}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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

          <Button
            type="submit"
            disabled={!stripe || isProcessing}
            className="w-full bg-indigo-dark text-white hover:bg-indigo-dark/90 h-12"
          >
            {isProcessing ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Procesando pago...
              </>
            ) : (
              `Pagar ${amount}€`
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

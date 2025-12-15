"use client"

import type React from "react"

import { useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, Loader2, CheckCircle2, Shield } from "lucide-react"

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null

interface SetupIntentFormProps {
  userId: string
  membershipType: string
  onSuccess: () => void
  onError: (error: string) => void
}

function SetupIntentForm({ userId, membershipType, onSuccess, onError }: SetupIntentFormProps) {
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
    if (!cardElement) {
      onError("Error con el formulario de tarjeta.")
      return
    }

    setIsProcessing(true)

    try {
      const response = await fetch("/api/stripe/create-setup-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, membershipType }),
      })

      if (!response.ok) {
        throw new Error("Error creating setup intent")
      }

      const { clientSecret, setupIntentId } = await response.json()

      const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      })

      if (error) {
        onError(error.message || "Error al verificar la tarjeta")
        return
      }

      const confirmResponse = await fetch("/api/stripe/confirm-payment-method", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setupIntentId: setupIntent.id, userId }),
      })

      if (!confirmResponse.ok) {
        throw new Error("Error confirming payment method")
      }

      onSuccess()
    } catch (err) {
      onError(err instanceof Error ? err.message : "Error de conexión")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-indigo-dark/90 to-indigo-dark text-white rounded-t-lg">
        <CardTitle className="flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Verifica tu Tarjeta
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Verificación Segura</h4>
              <p className="text-sm text-blue-700">
                Solo verificaremos que tu tarjeta sea válida. No se realizará ningún cargo ahora. El primer cobro será
                el día de tu renovación mensual.
              </p>
            </div>
          </div>
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
                Verificando tarjeta...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Verificar Tarjeta
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-slate-50 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-slate-900 mb-1">Protección Total</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>✓ Verificación 3D Secure automática</li>
                <li>✓ Sin cargos hasta tu renovación</li>
                <li>✓ Cancela en cualquier momento</li>
                <li>✓ Tus datos están encriptados</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function SetupIntentPayment(props: SetupIntentFormProps) {
  if (!stripePromise) {
    return <div>Error: Stripe no configurado</div>
  }

  return (
    <Elements stripe={stripePromise}>
      <SetupIntentForm {...props} />
    </Elements>
  )
}

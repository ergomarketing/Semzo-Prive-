"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Elements, IbanElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { getStripePromise } from "@/lib/stripe-client"
import { Check, Loader2, CreditCard, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

const stripePromise = getStripePromise()

function SepaForm({ onComplete }: { onComplete: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")

  useEffect(() => {
    // Obtener datos del usuario
    fetch("/api/user/profile")
      .then(res => res.json())
      .then(data => {
        if (data.profile) {
          setName(data.profile.full_name || "")
          setEmail(data.profile.email || "")
        }
      })
      .catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError(null)

    try {
      // 1. Crear SetupIntent en el servidor
      const intentRes = await fetch("/api/sepa/create-setup-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (!intentRes.ok) {
        const errData = await intentRes.json()
        throw new Error(errData.error || "Error creando el mandato")
      }

      const { clientSecret } = await intentRes.json()

      // 2. Confirmar el SetupIntent con IBAN
      const ibanElement = elements.getElement(IbanElement)
      if (!ibanElement) {
        throw new Error("No se pudo cargar el formulario bancario")
      }

      const { error: stripeError, setupIntent } = await stripe.confirmSepaDebitSetup(clientSecret, {
        payment_method: {
          sepa_debit: ibanElement,
          billing_details: {
            name: name,
            email: email,
          },
        },
      })

      if (stripeError) {
        throw new Error(stripeError.message || "Error al procesar el mandato SEPA")
      }

      if (setupIntent?.status === "succeeded") {
        // 3. Guardar el payment_method_id en el perfil
        await fetch("/api/sepa/save-mandate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentMethodId: setupIntent.payment_method,
          }),
        })

        // 4. Activar membresía (Identity + SEPA completados)
        const activateRes = await fetch("/api/memberships/activate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })

        const activateData = await activateRes.json()

        if (!activateRes.ok) {
          throw new Error(activateData.error || "Error activando la membresía")
        }

        onComplete()
      } else {
        throw new Error("El mandato no se pudo completar")
      }
    } catch (err: any) {
      setError(err.message || "Error inesperado")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
            Nombre del titular
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-1 focus:ring-foreground"
            placeholder="Nombre completo"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-1 focus:ring-foreground"
            placeholder="tu@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            IBAN
          </label>
          <div className="px-3 py-3 border border-border bg-background rounded-md">
            <IbanElement
              options={{
                supportedCountries: ["SEPA"],
                placeholderCountry: "ES",
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#1a1a4b",
                    "::placeholder": {
                      color: "#a3a3a3",
                    },
                  },
                  invalid: {
                    color: "#ef4444",
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="bg-muted/50 border border-border rounded-md p-4 text-xs text-muted-foreground space-y-2">
        <div className="flex items-start gap-2">
          <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>
            Al proporcionar tu IBAN y confirmar este pago, autorizas a SEMZO PRIVE a enviar instrucciones 
            a tu banco para debitar tu cuenta de acuerdo con dichas instrucciones. Tienes derecho a un 
            reembolso de tu banco bajo los terminos y condiciones de tu acuerdo con tu banco.
          </p>
        </div>
        <p className="pl-6">
          Este mandato SEPA solo se utilizara como mecanismo de seguridad en caso de incidencias graves 
          (no devolucion, perdida o dano grave del bolso). No se realizaran cargos ordinarios.
        </p>
      </div>

      <Button
        type="submit"
        disabled={!stripe || loading || !name}
        className="w-full h-12 bg-foreground text-background hover:bg-foreground/90"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Procesando...
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4 mr-2" />
            Autorizar mandato SEPA
          </>
        )}
      </Button>
    </form>
  )
}

function OnboardingCompleteContent() {
  const router = useRouter()
  const [sepaCompleted, setSepaCompleted] = useState(false)
  const [redirecting, setRedirecting] = useState(false)

  const handleSepaComplete = () => {
    setSepaCompleted(true)
    setRedirecting(true)
    setTimeout(() => {
      router.push("/dashboard")
    }, 2000)
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4 mb-6">
            {/* Step 1: Pago */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                <Check className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm text-muted-foreground hidden sm:inline">Pago</span>
            </div>

            <div className="w-8 h-px bg-green-600" />

            {/* Step 2: Verificacion */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                <Check className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm text-muted-foreground hidden sm:inline">Identidad</span>
            </div>

            <div className={`w-8 h-px ${sepaCompleted ? "bg-green-600" : "bg-border"}`} />

            {/* Step 3: SEPA */}
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                sepaCompleted 
                  ? "bg-green-600" 
                  : "bg-foreground"
              }`}>
                {sepaCompleted ? (
                  <Check className="h-4 w-4 text-white" />
                ) : (
                  <span className="text-sm text-background font-medium">3</span>
                )}
              </div>
              <span className={`text-sm hidden sm:inline ${sepaCompleted ? "text-muted-foreground" : "text-foreground font-medium"}`}>
                Cuenta bancaria
              </span>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-card border border-border p-6 sm:p-8 rounded-lg">
          {sepaCompleted ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-600 flex items-center justify-center">
                <Check className="h-8 w-8 text-white" />
              </div>
              <h1 className="font-serif text-2xl text-foreground">
                Configuracion completada
              </h1>
              <p className="text-muted-foreground">
                Tu cuenta esta lista. Redirigiendo al dashboard...
              </p>
              {redirecting && (
                <Loader2 className="h-5 w-5 mx-auto animate-spin text-muted-foreground" />
              )}
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h1 className="font-serif text-2xl text-foreground mb-2">
                  Ultimo paso
                </h1>
                <p className="text-muted-foreground text-sm">
                  Anade tu cuenta bancaria para completar la configuracion de tu membresia
                </p>
              </div>

              <Elements stripe={stripePromise}>
                <SepaForm onComplete={handleSepaComplete} />
              </Elements>
            </>
          )}
        </div>

        {/* Skip link (fallback) */}
        {!sepaCompleted && (
          <div className="mt-4 text-center">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Completar mas tarde (acceso limitado)
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

export default function OnboardingCompletePage() {
  return <OnboardingCompleteContent />
}

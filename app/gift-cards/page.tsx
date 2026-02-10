"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Gift, Check, Sparkles } from "lucide-react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { toast } from "sonner"
import Link from "next/link"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const PRESET_AMOUNTS = [50, 100, 150, 200, 300, 500]

function GiftCardForm() {
  const [amount, setAmount] = useState(100)
  const [customAmount, setCustomAmount] = useState("")
  const [recipientName, setRecipientName] = useState("")
  const [recipientEmail, setRecipientEmail] = useState("")
  const [personalMessage, setPersonalMessage] = useState("")
  const [step, setStep] = useState<"details" | "payment" | "success">("details")
  const [clientSecret, setClientSecret] = useState("")
  const [giftCardCode, setGiftCardCode] = useState("")
  const [loading, setLoading] = useState(false)

  const handleAmountSelect = (value: number) => {
    setAmount(value)
    setCustomAmount("")
  }

  const handleCustomAmount = (value: string) => {
    setCustomAmount(value)
    const num = Number.parseInt(value)
    if (num >= 25 && num <= 500) {
      setAmount(num)
    }
  }

  const handleContinue = async () => {
    if (amount < 25 || amount > 500) {
      toast.error("El monto debe ser entre 25€ y 500€")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/gift-cards/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          recipientName,
          recipientEmail,
          personalMessage,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al procesar")
      }

      const data = await res.json()
      setClientSecret(data.clientSecret)
      setGiftCardCode(data.code)
      setStep("payment")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (step === "success") {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="pt-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">¡Gift Card Creada!</h2>
          <p className="text-muted-foreground mb-6">Tu gift card ha sido creada exitosamente</p>
          <div className="bg-muted p-4 rounded-lg mb-6">
            <p className="text-sm text-muted-foreground mb-1">Código de Gift Card</p>
            <p className="text-2xl font-mono font-bold">{giftCardCode}</p>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {recipientEmail
              ? `Hemos enviado el código a ${recipientEmail}`
              : "Guarda este código para usarlo en tu próxima compra"}
          </p>
          <Link href="/coleccion">
            <Button className="w-full">Explorar Colección</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  if (step === "payment" && clientSecret) {
    return (
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <PaymentForm amount={amount} onSuccess={() => setStep("success")} onBack={() => setStep("details")} />
      </Elements>
    )
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Gift className="h-8 w-8 text-indigo-600" />
        </div>
        <CardTitle className="text-2xl">Comprar Gift Card</CardTitle>
        <CardDescription>El regalo perfecto para las amantes de la moda</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selector de monto */}
        <div>
          <Label className="mb-3 block">Selecciona el valor</Label>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {PRESET_AMOUNTS.map((preset) => (
              <Button
                key={preset}
                variant={amount === preset && !customAmount ? "default" : "outline"}
                onClick={() => handleAmountSelect(preset)}
                className="h-12"
              >
                {preset}€
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Otro:</span>
            <Input
              type="number"
              min={25}
              max={500}
              placeholder="25-500"
              value={customAmount}
              onChange={(e) => handleCustomAmount(e.target.value)}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">€</span>
          </div>
        </div>

        {/* Datos del destinatario */}
        <div className="space-y-4">
          <div>
            <Label>Nombre del destinatario (opcional)</Label>
            <Input
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="¿Para quién es?"
            />
          </div>
          <div>
            <Label>Email del destinatario (opcional)</Label>
            <Input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="Le enviaremos el código"
            />
          </div>
          <div>
            <Label>Mensaje personal (opcional)</Label>
            <Textarea
              value={personalMessage}
              onChange={(e) => setPersonalMessage(e.target.value)}
              placeholder="¡Feliz cumpleaños! Disfruta eligiendo tu bolso favorito..."
              rows={3}
            />
          </div>
        </div>

        {/* Resumen */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Gift Card</span>
            <span className="text-xl font-bold">{amount}€</span>
          </div>
        </div>

        <Button onClick={handleContinue} disabled={loading || amount < 25} className="w-full h-12">
          {loading ? "Procesando..." : "Continuar al Pago"}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Las gift cards son válidas por 2 años y no son reembolsables
        </p>
      </CardContent>
    </Card>
  )
}

function PaymentForm({
  amount,
  onSuccess,
  onBack,
}: {
  amount: number
  onSuccess: () => void
  onBack: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) return

    setProcessing(true)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/gift-cards/success`,
      },
      redirect: "if_required",
    })

    if (error) {
      toast.error(error.message || "Error en el pago")
      setProcessing(false)
    } else {
      onSuccess()
    }
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Pago de Gift Card</CardTitle>
        <CardDescription>Total: {amount}€</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <PaymentElement />
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onBack} className="flex-1 bg-transparent">
              Volver
            </Button>
            <Button type="submit" disabled={!stripe || processing} className="flex-1">
              {processing ? "Procesando..." : `Pagar ${amount}€`}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default function GiftCardsPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm mb-4">
            <Sparkles className="h-4 w-4" />
            El regalo perfecto
          </div>
          <h1 className="text-4xl font-bold mb-4">Gift Cards Semzó Privé</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Regala la experiencia de llevar bolsos de lujo. Válidas para cualquier membresía o reserva.
          </p>
        </div>

        <GiftCardForm />

        {/* Beneficios */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Gift className="h-6 w-6 text-rose-600" />
            </div>
            <h3 className="font-semibold mb-2">Entrega Instantánea</h3>
            <p className="text-sm text-muted-foreground">El código se genera al momento y puede enviarse por email</p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Sparkles className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="font-semibold mb-2">Sin Restricciones</h3>
            <p className="text-sm text-muted-foreground">Válida para cualquier bolso de nuestra colección</p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="font-semibold mb-2">2 Años de Validez</h3>
            <p className="text-sm text-muted-foreground">Tiempo suficiente para elegir el bolso perfecto</p>
          </div>
        </div>
      </div>
    </div>
  )
}

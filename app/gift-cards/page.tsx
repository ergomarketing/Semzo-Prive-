"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Check } from "lucide-react"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { getStripePromise } from "@/lib/stripe-client"
import { toast } from "sonner"
import Link from "next/link"
import Image from "next/image"

const stripePromise = getStripePromise()

const PRESET_AMOUNTS = [50, 100, 150, 200, 300, 500]

// Logo SP component - usa la imagen real
function LogoSP({ size = 56 }: { size?: number }) {
  return (
    <Image
      src="/images/logo-semzo-sp.png"
      alt="Semzo Prive"
      width={size}
      height={size}
      className="object-contain"
    />
  )
}

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
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 text-center">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: "#f4c4cc" }}
          >
            <Check className="h-10 w-10" style={{ color: "#1a1a4b" }} />
          </div>
          <h2 className="font-serif text-3xl mb-3" style={{ color: "#1a1a4b" }}>Gift Card Creada</h2>
          <p className="text-gray-500 mb-8">Tu gift card ha sido creada exitosamente</p>
          
          <div className="p-6 rounded-xl mb-8" style={{ backgroundColor: "#1a1a4b" }}>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#f4c4cc" }}>Código de Gift Card</p>
            <p className="text-3xl font-mono font-bold text-white tracking-wider">{giftCardCode}</p>
          </div>
          
          <p className="text-sm text-gray-500 mb-6">
            {recipientEmail
              ? `Hemos enviado el código a ${recipientEmail}`
              : "Guarda este código para usarlo en tu próxima compra"}
          </p>
          
          <Link href="/coleccion">
            <Button 
              className="w-full h-14 rounded-none text-sm uppercase tracking-widest font-medium"
              style={{ backgroundColor: "#1a1a4b", color: "#ffffff" }}
            >
              Explorar Colección
            </Button>
          </Link>
        </div>
      </div>
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
    <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header con logo SP */}
      <div className="text-center pt-10 pb-6 px-8">
        <div 
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: "#1a1a4b" }}
        >
          <LogoSP size={56} />
        </div>
        <h2 className="font-serif text-3xl mb-2" style={{ color: "#1a1a4b" }}>Comprar Gift Card</h2>
        <p className="text-gray-500">El regalo perfecto para las amantes de la moda</p>
      </div>

      <div className="px-8 pb-10 space-y-8">
        {/* Selector de monto */}
        <div>
          <Label className="mb-4 block text-sm uppercase tracking-wider" style={{ color: "#1a1a4b" }}>
            Selecciona el valor
          </Label>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {PRESET_AMOUNTS.map((preset) => (
              <button
                key={preset}
                onClick={() => handleAmountSelect(preset)}
                className="h-14 rounded-lg border-2 text-base font-medium transition-all duration-200"
                style={{
                  backgroundColor: amount === preset && !customAmount ? "#1a1a4b" : "transparent",
                  color: amount === preset && !customAmount ? "#ffffff" : "#1a1a4b",
                  borderColor: amount === preset && !customAmount ? "#1a1a4b" : "#e5e7eb",
                }}
              >
                {preset}€
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Otro:</span>
            <Input
              type="number"
              min={25}
              max={500}
              placeholder="25-500"
              value={customAmount}
              onChange={(e) => handleCustomAmount(e.target.value)}
              className="w-28 h-12 rounded-lg border-gray-200 focus:border-[#1a1a4b] focus:ring-[#1a1a4b]"
            />
            <span className="text-sm text-gray-500">€</span>
          </div>
        </div>

        {/* Datos del destinatario */}
        <div className="space-y-5">
          <div>
            <Label className="text-sm mb-2 block" style={{ color: "#1a1a4b" }}>
              Nombre del destinatario <span className="text-gray-400">(opcional)</span>
            </Label>
            <Input
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="¿Para quién es?"
              className="h-12 rounded-lg border-gray-200 focus:border-[#1a1a4b] focus:ring-[#1a1a4b]"
            />
          </div>
          <div>
            <Label className="text-sm mb-2 block" style={{ color: "#1a1a4b" }}>
              Email del destinatario <span className="text-gray-400">(opcional)</span>
            </Label>
            <Input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="Le enviaremos el código"
              className="h-12 rounded-lg border-gray-200 focus:border-[#1a1a4b] focus:ring-[#1a1a4b]"
            />
          </div>
          <div>
            <Label className="text-sm mb-2 block" style={{ color: "#1a1a4b" }}>
              Mensaje personal <span className="text-gray-400">(opcional)</span>
            </Label>
            <Textarea
              value={personalMessage}
              onChange={(e) => setPersonalMessage(e.target.value)}
              placeholder="¡Feliz cumpleaños! Disfruta eligiendo tu bolso favorito..."
              rows={3}
              className="rounded-lg border-gray-200 focus:border-[#1a1a4b] focus:ring-[#1a1a4b] resize-none"
            />
          </div>
        </div>

        {/* Resumen */}
        <div className="p-5 rounded-xl" style={{ backgroundColor: "#fff0f3" }}>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Gift Card</span>
            <span className="text-2xl font-serif font-semibold" style={{ color: "#1a1a4b" }}>{amount}€</span>
          </div>
        </div>

        <Button 
          onClick={handleContinue} 
          disabled={loading || amount < 25} 
          className="w-full h-14 rounded-none text-sm uppercase tracking-widest font-medium transition-all duration-300"
          style={{ backgroundColor: "#1a1a4b", color: "#ffffff" }}
        >
          {loading ? "Procesando..." : "Continuar al Pago"}
        </Button>

        <p className="text-xs text-center text-gray-400">
          Las gift cards son válidas por 2 años y no son reembolsables
        </p>
      </div>
    </div>
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
    <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="text-center pt-10 pb-6 px-8">
        <div 
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: "#1a1a4b" }}
        >
          <LogoSP size={56} />
        </div>
        <h2 className="font-serif text-3xl mb-2" style={{ color: "#1a1a4b" }}>Pago de Gift Card</h2>
        <p className="text-gray-500">Total: {amount}€</p>
      </div>
      
      <div className="px-8 pb-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          <PaymentElement />
          <div className="flex gap-4 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onBack} 
              className="flex-1 h-14 rounded-none text-sm uppercase tracking-widest font-medium bg-transparent border-2"
              style={{ borderColor: "#1a1a4b", color: "#1a1a4b" }}
            >
              Volver
            </Button>
            <Button 
              type="submit" 
              disabled={!stripe || processing} 
              className="flex-1 h-14 rounded-none text-sm uppercase tracking-widest font-medium"
              style={{ backgroundColor: "#1a1a4b", color: "#ffffff" }}
            >
              {processing ? "Procesando..." : `Pagar ${amount}€`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function GiftCardsPage() {
  return (
    <div className="min-h-screen py-16 px-4" style={{ background: "linear-gradient(to bottom, #ffffff, #fff0f3)" }}>
      <div className="max-w-5xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-16">
          <p 
            className="text-xs uppercase tracking-[0.3em] mb-4"
            style={{ color: "#c9a86c" }}
          >
            El regalo perfecto
          </p>
          <h1 className="font-serif text-4xl md:text-5xl mb-6" style={{ color: "#1a1a4b" }}>
            Gift Cards Semzo Prive
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
            Regala la experiencia de llevar bolsos de lujo. Válidas para cualquier membresía o reserva.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Formulario */}
          <GiftCardForm />

          {/* Imagen de Gift Card */}
          <div className="hidden lg:block">
            <div className="relative aspect-square rounded-3xl overflow-hidden">
              <Image
                src="/images/gift-card-semzo.jpg"
                alt="Gift Cards Semzo Prive"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>

        {/* Beneficios */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="text-center p-8">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: "#fff0f3" }}
            >
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#1a1a4b" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </div>
            <h3 className="font-serif text-xl mb-3" style={{ color: "#1a1a4b" }}>Entrega Instantánea</h3>
            <p className="text-sm text-gray-500 leading-relaxed">El código se genera al momento y puede enviarse por email</p>
          </div>
          <div className="text-center p-8">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: "#fff0f3" }}
            >
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#1a1a4b" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </div>
            <h3 className="font-serif text-xl mb-3" style={{ color: "#1a1a4b" }}>Sin Restricciones</h3>
            <p className="text-sm text-gray-500 leading-relaxed">Válida para cualquier bolso de nuestra colección</p>
          </div>
          <div className="text-center p-8">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: "#fff0f3" }}
            >
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#1a1a4b" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-serif text-xl mb-3" style={{ color: "#1a1a4b" }}>2 Años de Validez</h3>
            <p className="text-sm text-gray-500 leading-relaxed">Tiempo suficiente para elegir el bolso perfecto</p>
          </div>
        </div>
      </div>
    </div>
  )
}

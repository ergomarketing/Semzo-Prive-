"use client"

import type React from "react"
import { useState } from "react"
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreditCard, Loader2, Shield } from "lucide-react"
import { toast } from "react-toastify"
import { useRouter } from "next/navigation"

const cardElementOptions = {
  style: {
    base: {
      fontSize: "16px",
      color: "#1a1a4b",
      fontFamily: '"Inter", sans-serif',
      "::placeholder": { color: "#94a3b8" },
    },
    invalid: { color: "#dc2626" },
  },
}

interface PaymentFormContentProps {
  finalAmount: number
  user: any
  items: any[]
  total: number
  appliedCoupon?: any
  appliedGiftCard?: any
  termsAccepted: boolean
  membershipItem: any
  membershipType: string | null
  billingCycle: string
  onSuccess: () => void
  onError: (error: string) => void
  needsExtendedForm?: boolean
  needsVerification?: boolean
  extendedFormData: any
  setExtendedFormData: (fn: (prev: any) => any) => void
  onSaveExtendedForm: () => Promise<void>
  savingExtendedForm: boolean
  extendedFormCompleted: boolean
  identityVerified: boolean
  onVerifyIdentity?: () => void
}

export default function PaymentFormContent({
  finalAmount,
  user,
  items,
  appliedCoupon,
  appliedGiftCard,
  termsAccepted,
  onSuccess,
  onError,
  needsExtendedForm,
  needsVerification,
  extendedFormData,
  setExtendedFormData,
  onSaveExtendedForm,
  savingExtendedForm,
  extendedFormCompleted,
  identityVerified,
  onVerifyIdentity,
}: PaymentFormContentProps) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [processing, setProcessing] = useState(false)
  const [cardError, setCardError] = useState("")

  const handlePayment = async () => {
    if (!termsAccepted) return onError("Acepta los términos para continuar")
    if (!user) return onError("Debes iniciar sesión para continuar")

    if (needsExtendedForm && !extendedFormCompleted) {
      toast.info("Completa tus datos personales para continuar")
      return
    }

    if (needsVerification && !identityVerified) {
      toast.info("Debes verificar tu identidad para continuar")
      onVerifyIdentity?.()
      return
    }

    setProcessing(true)
    setCardError("")

    try {
      if (finalAmount <= 0 && appliedGiftCard) {
        console.log("[v0] Procesando pago con gift card para userId:", user.id)
        const res = await fetch("/api/memberships/purchase-with-gift-card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        })

        const data = await res.json()
        console.log("[v0] Gift card response:", data)
        if (!res.ok) throw new Error(data.error || "Error procesando gift card")
        
        console.log("[v0] Gift card payment successful, redirecting to verification")
        toast.success("Membresía confirmada. Redirigiendo a verificación de identidad...")
        setTimeout(() => {
          router.push("/dashboard/membresia/status")
        }, 1500)
        return
      }

      if (!stripe || !elements) throw new Error("Stripe no disponible")

      const card = elements.getElement(CardElement)
      if (!card) throw new Error("Tarjeta no disponible")

      const intentRes = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          userId: user.id,
          userEmail: user.email,
          items,
          appliedCoupon,
          appliedGiftCard,
        }),
      })

      const intentData = await intentRes.json()
      if (!intentRes.ok) throw new Error(intentData.error)

      const { error, paymentIntent } = await stripe.confirmCardPayment(intentData.clientSecret, {
        payment_method: {
          card,
          billing_details: { email: user.email },
        },
      })

      if (error) throw error

      if (paymentIntent?.status === "succeeded") {
        toast.success("Pago realizado correctamente")
        router.push("/dashboard/membresia/status")
        onSuccess()
      }
    } catch (e: any) {
      setCardError(e.message)
      onError(e.message)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Card className="border border-indigo-dark/10 shadow-sm">
      <CardContent className="pt-6">
        <h3 className="font-medium text-indigo-dark mb-4 flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Datos de pago
        </h3>

        {cardError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{cardError}</p>
          </div>
        )}

        {needsExtendedForm && !extendedFormCompleted && (
          <div className="mb-6 p-6 bg-rose-nude/30 border border-rose-pastel/30 rounded-lg">
            <h4 className="font-medium text-indigo-dark mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Datos de envío y verificación
            </h4>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName" className="text-indigo-dark text-sm mb-1">
                    Nombre completo *
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="Nombre completo"
                    value={extendedFormData.fullName || ""}
                    onChange={(e) => setExtendedFormData((p: any) => ({ ...p, fullName: e.target.value }))}
                    className="border-indigo-dark/20"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-indigo-dark text-sm mb-1">
                    Teléfono *
                  </Label>
                  <Input
                    id="phone"
                    placeholder="+34 612 345 678"
                    value={extendedFormData.phone || ""}
                    onChange={(e) => setExtendedFormData((p: any) => ({ ...p, phone: e.target.value }))}
                    className="border-indigo-dark/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="documentType" className="text-indigo-dark text-sm mb-1">
                    Tipo de documento *
                  </Label>
                  <Select
                    value={extendedFormData.documentType || ""}
                    onValueChange={(value) => setExtendedFormData((p: any) => ({ ...p, documentType: value }))}
                  >
                    <SelectTrigger className="border-indigo-dark/20">
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DNI">DNI</SelectItem>
                      <SelectItem value="NIE">NIE</SelectItem>
                      <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="documentNumber" className="text-indigo-dark text-sm mb-1">
                    Número de documento *
                  </Label>
                  <Input
                    id="documentNumber"
                    placeholder="12345678A"
                    value={extendedFormData.documentNumber || ""}
                    onChange={(e) => setExtendedFormData((p: any) => ({ ...p, documentNumber: e.target.value }))}
                    className="border-indigo-dark/20"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address" className="text-indigo-dark text-sm mb-1">
                  Dirección *
                </Label>
                <Input
                  id="address"
                  placeholder="Calle Principal 123, 2º B"
                  value={extendedFormData.address || ""}
                  onChange={(e) => setExtendedFormData((p: any) => ({ ...p, address: e.target.value }))}
                  className="border-indigo-dark/20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city" className="text-indigo-dark text-sm mb-1">
                    Ciudad *
                  </Label>
                  <Input
                    id="city"
                    placeholder="Madrid"
                    value={extendedFormData.city || ""}
                    onChange={(e) => setExtendedFormData((p: any) => ({ ...p, city: e.target.value }))}
                    className="border-indigo-dark/20"
                  />
                </div>

                <div>
                  <Label htmlFor="postalCode" className="text-indigo-dark text-sm mb-1">
                    Código postal *
                  </Label>
                  <Input
                    id="postalCode"
                    placeholder="28001"
                    value={extendedFormData.postalCode || ""}
                    onChange={(e) => setExtendedFormData((p: any) => ({ ...p, postalCode: e.target.value }))}
                    className="border-indigo-dark/20"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={() => {
                const { fullName, phone, documentType, documentNumber, address, city, postalCode } = extendedFormData
                if (!fullName || !phone || !documentType || !documentNumber || !address || !city || !postalCode) {
                  toast.error("Por favor completa todos los campos obligatorios")
                  return
                }
                onSaveExtendedForm()
              }}
              disabled={savingExtendedForm}
              className="w-full mt-6 bg-indigo-dark hover:bg-indigo-dark/90 text-white"
            >
              {savingExtendedForm ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </span>
              ) : (
                "Guardar y continuar"
              )}
            </Button>
          </div>
        )}

        {!needsExtendedForm || extendedFormCompleted ? (
          <>
            {finalAmount > 0 && (
              <div className="border border-indigo-dark/20 rounded-lg p-4 mb-4">
                <CardElement options={cardElementOptions} />
              </div>
            )}

            {finalAmount <= 0 && (
              <div className="p-4 bg-rose-nude border border-rose-pastel/30 rounded-lg mb-4">
                <p className="text-indigo-dark text-sm text-center">
                  Tu pedido está cubierto. No se realizará ningún cargo.
                </p>
              </div>
            )}

            {/* SEPA LEGAL COPY - OBLIGATORIO ANTES DEL CHECKOUT */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg mb-6">
              <h4 className="text-sm font-semibold text-slate-900 mb-2">
                Mandato SEPA (uso limitado)
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Como medida de seguridad del servicio, SEMZO PRIVÉ podrá solicitar la autorización de un mandato
                SEPA Direct Debit exclusivamente como mecanismo de respaldo para la gestión de incidencias graves,
                incluyendo la no devolución, pérdida o daño grave del bolso, conforme a los{" "}
                <a href="/legal/terms" className="text-indigo-dark underline hover:text-rose-pastel" target="_blank" rel="noopener">
                  Términos y Condiciones
                </a>.
              </p>
              <p className="text-xs text-slate-600 mt-2">
                Este mandato no se utiliza para pagos recurrentes ni cargos ordinarios, y solo se ejecutará como
                último recurso tras los avisos contractuales.
              </p>
            </div>

            <Button
              onClick={handlePayment}
              disabled={processing || !termsAccepted}
              className="w-full bg-indigo-dark hover:bg-indigo-dark/90 text-white py-6"
            >
              {processing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Procesando...
                </span>
              ) : finalAmount <= 0 ? (
                "Confirmar pedido"
              ) : (
                `Pagar ${finalAmount.toFixed(2)}€`
              )}
            </Button>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}

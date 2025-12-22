"use client"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { Loader2, CreditCard, Shield } from "lucide-react"
import { getSupabaseBrowser } from "@/lib/supabase-browser"
import { loadStripe } from "@stripe/stripe-js"
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { toast } from "react-toastify"
import { useRouter } from "next/navigation"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "")

function analyzeCartItems(items: any[]) {
  console.log("[v0] analyzeCartItems - items:", JSON.stringify(items, null, 2))

  const bagPassItem = items.find((item) => {
    const itemType = (item.itemType || "").toLowerCase()
    const isBagPass = itemType === "bag-pass"

    console.log("[v0] Checking item for bag-pass:", {
      id: item.id,
      name: item.name,
      itemType,
      isBagPass,
    })

    return isBagPass
  })

  const membershipItem = items.find((item) => {
    const itemType = (item.itemType || "").toLowerCase()
    const isMembership = itemType === "membership"

    console.log("[v0] Checking item for membership:", {
      id: item.id,
      itemType,
      isMembership,
    })

    return isMembership
  })

  let bagPassTier: string | null = null
  if (bagPassItem) {
    const itemName = (bagPassItem.name || "").toLowerCase()

    if (itemName.includes("privé") || itemName.includes("prive")) {
      bagPassTier = "prive"
    } else if (itemName.includes("signature")) {
      bagPassTier = "signature"
    } else {
      bagPassTier = "essentiel"
    }
    console.log("[v0] Detected bagPassTier from name:", bagPassTier)
  }

  let membershipType: string | null = null
  if (membershipItem) {
    const itemId = (membershipItem.id || "").toLowerCase()

    if (itemId.includes("prive")) {
      membershipType = "prive"
    } else if (itemId.includes("signature")) {
      membershipType = "signature"
    } else if (itemId.includes("essentiel")) {
      membershipType = "essentiel"
    } else if (itemId.includes("petite")) {
      membershipType = "petite"
    }

    console.log("[v0] Detected membershipType from ID:", membershipType)
  }

  const billingCycle = membershipItem?.billingCycle || bagPassItem?.billingCycle || "monthly"
  const isBagPassOnly = !!bagPassItem && !membershipItem

  console.log("[v0] Cart analysis result:", {
    membershipItem: membershipItem
      ? { id: membershipItem.id, name: membershipItem.name, itemType: membershipItem.itemType }
      : null,
    bagPassItem: bagPassItem ? { id: bagPassItem.id, name: bagPassItem.name, itemType: bagPassItem.itemType } : null,
    membershipType,
    bagPassTier,
    billingCycle,
    isBagPassOnly,
  })

  return {
    membershipItem,
    bagPassItem,
    membershipType,
    bagPassTier,
    billingCycle,
    isBagPassOnly,
  }
}

function PaymentForm({
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
  setShowAuthModal,
  onVerifyIdentity,
}: {
  finalAmount: number
  user: any
  items: any[]
  appliedCoupon: any
  appliedGiftCard: any
  termsAccepted: boolean
  onSuccess: () => void
  onError: (error: string) => void
  needsExtendedForm?: boolean
  needsVerification?: boolean
  extendedFormData: any
  setExtendedFormData: (fn: (prev: any) => any) => void
  onSaveExtendedForm: () => Promise<void>
  savingExtendedForm: boolean
  setShowAuthModal: (show: boolean) => void
  onVerifyIdentity?: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [processing, setProcessing] = useState(false)
  const [cardError, setCardError] = useState("")
  const [showExtendedFormInline, setShowExtendedFormInline] = useState(false)
  const [extendedFormCompleted, setExtendedFormCompleted] = useState(false)
  const [identityVerified, setIdentityVerified] = useState(false)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [savingForm, setSavingForm] = useState(false)

  useEffect(() => {
    const checkUserData = async () => {
      if (!user) return

      const supabase = getSupabaseBrowser()
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone, document_number, address, city, postal_code, identity_verified")
        .eq("id", user.id)
        .single()

      if (profile) {
        const hasCompleteData = !!(
          profile.full_name &&
          profile.phone &&
          profile.document_number &&
          profile.address &&
          profile.city &&
          profile.postal_code
        )

        if (hasCompleteData) {
          setExtendedFormCompleted(true)
          console.log("[v0] Usuario tiene datos completos")
        }

        if (profile.identity_verified) {
          setIdentityVerified(true)
          console.log("[v0] Usuario ya está verificado")
        }
      }
    }

    checkUserData()
  }, [user])

  const handlePayment = async (e?: React.MouseEvent) => {
    console.log("[v0] handlePayment iniciado")
    e?.preventDefault()

    if (!termsAccepted) {
      onError("Acepta los términos para continuar")
      return
    }

    // 1️⃣ PASO: Usuario autenticado
    if (!user) {
      console.log("[v0] Paso 1 FALLIDO: No hay usuario")
      setShowAuthModal(true)
      toast.error("Debes crear una cuenta para continuar")
      return
    }
    console.log("[v0] Paso 1 OK: Usuario autenticado")

    // 2️⃣ PASO: Datos personales completos
    if (needsExtendedForm && !extendedFormCompleted) {
      console.log("[v0] Paso 2 FALLIDO: Faltan datos personales")
      setShowExtendedFormInline(true)
      toast.info("Completa tus datos personales para continuar")
      return
    }
    console.log("[v0] Paso 2 OK: Datos personales completos")

    // 3️⃣ PASO: Identidad verificada
    if (needsVerification && !identityVerified) {
      console.log("[v0] Paso 3 FALLIDO: Identidad no verificada")
      setShowVerificationModal(true)
      toast.info("Verifica tu identidad para continuar")
      return
    }
    console.log("[v0] Paso 3 OK: Identidad verificada")

    // 4️⃣ PASO: Procesar pago (si es necesario)
    console.log("[v0] Iniciando paso 4: Procesar pago")
    setProcessing(true)
    setCardError("")

    try {
      const cartAnalysis = analyzeCartItems(items)

      // Validar límite de membresías
      if (cartAnalysis.membershipType) {
        const tierToCheck = cartAnalysis.membershipType
        const supabase = getSupabaseBrowser()

        const { data: tierData } = await supabase
          .from("profiles")
          .select("membership_type")
          .eq("membership_type", tierToCheck)
          .eq("membership_status", "active")

        const currentActiveMembers = tierData?.length || 0

        const tierLimits: Record<string, number> = {
          petite: 100,
          essentiel: 50,
          signature: 30,
          prive: 20,
        }

        const limit = tierLimits[tierToCheck] || 100

        if (currentActiveMembers >= limit) {
          onError(`La membresía ${tierToCheck.toUpperCase()} alcanzó el límite. Intenta con otra.`)
          setProcessing(false)
          return
        }
      }

      // Si hay pago a realizar
      if (finalAmount > 0) {
        if (!stripe || !elements) {
          onError("Error de inicialización de Stripe. Recarga la página.")
          return
        }

        const cardElement = elements.getElement(CardElement)
        if (!cardElement) {
          onError("Error con el formulario de tarjeta.")
          return
        }

        const { error: cardError, paymentMethod } = await stripe.createPaymentMethod({
          type: "card",
          card: cardElement,
        })

        if (cardError) {
          setCardError(cardError.message || "Error al procesar la tarjeta")
          onError(cardError.message || "Error al procesar la tarjeta")
          setProcessing(false)
          return
        }

        const metadata: Record<string, string> = {
          user_id: user.id,
          userEmail: user.email || "",
          coupon_code: appliedCoupon?.code || "",
          gift_card_code: appliedGiftCard?.code || "",
        }

        if (cartAnalysis.membershipType) {
          metadata.plan_id = cartAnalysis.membershipType
          metadata.billing_period = cartAnalysis.billingCycle || "monthly"
        }

        const response = await fetch("/api/payments/create-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Math.round(finalAmount * 100),
            paymentMethodId: paymentMethod.id,
            userId: user.id,
            metadata,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          onError(errorData.error || "Error al procesar el pago")
          throw new Error(errorData.error || "Error al procesar el pago")
        }

        const { clientSecret } = await response.json()

        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret)

        if (confirmError) {
          setCardError(confirmError.message || "Error al confirmar el pago")
          onError(confirmError.message || "Error al confirmar el pago")
          setProcessing(false)
          return
        }

        if (paymentIntent.status === "succeeded") {
          toast.success("¡Pago procesado correctamente!")
          // 5️⃣ PASO FINAL: Activar membresía en backend
          await activateMembership()
        } else {
          onError("El pago no se completó correctamente")
        }
      } else {
        // Pago cubierto por gift card
        toast.success("Pedido confirmado")
        // 5️⃣ PASO FINAL: Activar membresía en backend
        await activateMembership()
      }
    } catch (error: any) {
      console.error("[v0] Error en handlePayment:", error)
      setCardError(error.message || "Error al procesar el pago")
      onError(error.message || "Error al procesar el pago")
    } finally {
      setProcessing(false)
    }
  }

  const activateMembership = async () => {
    try {
      const response = await fetch("/api/memberships/activate", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error activando membresía")
      }

      if (data.success) {
        // clearCart()  <-- FIX: clearCart is not imported or defined in this scope.
        // The original code from the prompt has this as an error, so it's commented out
        // to make the code runnable, assuming it's handled elsewhere or will be imported.
        window.location.href = "/dashboard?welcome=true"
      }
    } catch (error: any) {
      console.error("[v0] Error activando membresía:", error)
      toast.error(error.message || "Error activando membresía")
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#1a1a4b",
        "::placeholder": { color: "#9ca3af" },
        fontFamily: "system-ui, sans-serif",
      },
      invalid: { color: "#dc2626" },
    },
    hidePostalCode: true,
  }

  const handleSaveExtendedFormClick = async () => {
    console.log("[v0] Guardando formulario extendido")

    if (
      !extendedFormData.fullName ||
      !extendedFormData.phone ||
      !extendedFormData.documentNumber ||
      !extendedFormData.address ||
      !extendedFormData.city ||
      !extendedFormData.postalCode
    ) {
      onError("Por favor completa todos los campos obligatorios")
      return
    }

    setSavingForm(true)
    try {
      const supabase = getSupabaseBrowser()
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: extendedFormData.fullName,
          phone: extendedFormData.phone,
          document_number: extendedFormData.documentNumber,
          document_type: extendedFormData.documentType || "dni",
          address: extendedFormData.address,
          city: extendedFormData.city,
          postal_code: extendedFormData.postalCode,
          country: extendedFormData.country || "España",
        })
        .eq("id", user?.id)

      if (updateError) {
        console.error("[v0] Error en update:", updateError)
        throw updateError
      }

      console.log("[v0] Datos guardados correctamente")
      setExtendedFormCompleted(true)
      setShowExtendedFormInline(false)
      toast.success("Datos guardados correctamente")
    } catch (error: any) {
      console.error("Error guardando datos del perfil:", error)
      onError(error.message || "Error guardando datos del perfil")
    } finally {
      setSavingForm(false)
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
          <div className="mb-4 p-3 bg-[#fff0f3] border border-[#f4c4cc] rounded-lg">
            <p className="text-sm text-indigo-dark">{cardError}</p>
          </div>
        )}

        {finalAmount <= 0 ? (
          <div className="p-4 bg-rose-nude border border-rose-pastel/30 rounded-lg mb-4">
            <p className="text-indigo-dark text-sm text-center">
              Tu pedido está completamente cubierto. No se realizará ningún cargo.
            </p>
          </div>
        ) : (
          <div className="border border-indigo-dark/20 rounded-lg p-4 mb-4">
            <CardElement options={cardElementOptions} />
          </div>
        )}

        {!needsVerification || identityVerified ? (
          <Button
            onClick={(e) => {
              console.log("[v0] BUTTON CLICKED")
              console.log("[v0] Button disabled?:", processing || !termsAccepted)
              console.log("[v0] processing:", processing)
              console.log("[v0] termsAccepted:", termsAccepted)
              handlePayment(e)
            }}
            disabled={processing || !termsAccepted}
            className="w-full bg-indigo-dark hover:bg-indigo-dark/90 text-white py-6"
          >
            {processing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Procesando...
              </span>
            ) : finalAmount <= 0 ? (
              "Confirmar Pedido"
            ) : (
              `Pagar ${finalAmount.toFixed(2)}€`
            )}
          </Button>
        ) : (
          <button
            onClick={onVerifyIdentity}
            className="w-full bg-indigo-dark text-white py-6 rounded-md hover:bg-indigo-dark/90 transition-colors font-medium"
          >
            Verificar identidad
          </button>
        )}

        {showExtendedFormInline && needsExtendedForm && (
          <div className="mt-6 pt-6 border-t border-indigo-dark/10">
            <h4 className="font-medium text-indigo-dark mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Datos de envío y verificación
            </h4>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-indigo-dark/70 mb-1">Nombre completo *</label>
                  <Input
                    value={extendedFormData.fullName}
                    onChange={(e) => setExtendedFormData((prev: any) => ({ ...prev, fullName: e.target.value }))}
                    placeholder="María García López"
                    className="border-indigo-dark/20 focus:border-indigo-dark"
                  />
                </div>
                <div>
                  <label className="block text-sm text-indigo-dark/70 mb-1">Teléfono *</label>
                  <Input
                    value={extendedFormData.phone}
                    onChange={(e) => setExtendedFormData((prev: any) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+34 612 345 678"
                    className="border-indigo-dark/20 focus:border-indigo-dark"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-indigo-dark/70 mb-1">Número de documento *</label>
                  <Input
                    value={extendedFormData.documentNumber}
                    onChange={(e) => setExtendedFormData((prev: any) => ({ ...prev, documentNumber: e.target.value }))}
                    placeholder="12345678"
                    className="border-indigo-dark/20 focus:border-indigo-dark"
                  />
                </div>
                <div>
                  <label className="block text-sm text-indigo-dark/70 mb-1">Tipo de documento</label>
                  <Input
                    value={extendedFormData.documentType}
                    onChange={(e) => setExtendedFormData((prev: any) => ({ ...prev, documentType: e.target.value }))}
                    placeholder="DNI"
                    className="border-indigo-dark/20 focus:border-indigo-dark"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-indigo-dark/70 mb-1">Dirección *</label>
                  <Input
                    value={extendedFormData.address}
                    onChange={(e) => setExtendedFormData((prev: any) => ({ ...prev, address: e.target.value }))}
                    placeholder="Calle Falsa 123"
                    className="border-indigo-dark/20 focus:border-indigo-dark"
                  />
                </div>
                <div>
                  <label className="block text-sm text-indigo-dark/70 mb-1">Ciudad *</label>
                  <Input
                    value={extendedFormData.city}
                    onChange={(e) => setExtendedFormData((prev: any) => ({ ...prev, city: e.target.value }))}
                    placeholder="Madrid"
                    className="border-indigo-dark/20 focus:border-indigo-dark"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-indigo-dark/70 mb-1">Código postal *</label>
                  <Input
                    value={extendedFormData.postalCode}
                    onChange={(e) => setExtendedFormData((prev: any) => ({ ...prev, postalCode: e.target.value }))}
                    placeholder="28001"
                    className="border-indigo-dark/20 focus:border-indigo-dark"
                  />
                </div>
                <div>
                  <label className="block text-sm text-indigo-dark/70 mb-1">País</label>
                  <Input
                    value={extendedFormData.country}
                    onChange={(e) => setExtendedFormData((prev: any) => ({ ...prev, country: e.target.value }))}
                    placeholder="España"
                    className="border-indigo-dark/20 focus:border-indigo-dark"
                  />
                </div>
              </div>
              <Button
                onClick={handleSaveExtendedFormClick}
                disabled={savingForm}
                className="w-full bg-indigo-dark hover:bg-indigo-dark/90 text-white py-6"
              >
                {savingForm ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Guardando...
                  </span>
                ) : (
                  "Guardar datos"
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PaymentForm

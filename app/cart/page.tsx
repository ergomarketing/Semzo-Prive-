"use client"
import { useCart } from "@/app/contexts/cart-context"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Info, Tag, Gift, Loader2, X, Check, Trash2, CreditCard, ShieldCheck, Shield, ArrowLeft } from "lucide-react"
import { getSupabaseBrowser } from "@/lib/supabase-browser"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Checkbox } from "@/components/ui/checkbox"
import { IdentityVerificationModal } from "@/app/components/identity-verification-modal"
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
}) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter() // Import router
  const [processing, setProcessing] = useState(false)
  const [cardError, setCardError] = useState("")
  const [showExtendedFormInline, setShowExtendedFormInline] = useState(false)
  const [extendedFormCompleted, setExtendedFormCompleted] = useState(false)
  const [identityVerified, setIdentityVerified] = useState(false)
  const [showVerificationModal, setShowVerificationModal] = useState(false)

  const handlePayment = async () => {
    console.log("[v0] handlePayment iniciado")

    if (!termsAccepted) {
      onError("Acepta los términos para continuar")
      return
    }

    if (!user) {
      setShowAuthModal(true)
      toast.error("Debes crear una cuenta para continuar")
      return
    }

    if (needsExtendedForm && !extendedFormCompleted) {
      setShowExtendedFormInline(true)
      return
    }

    if (needsVerification && !identityVerified) {
      setShowVerificationModal(true)
      return
    }

    setProcessing(true)
    setCardError("")

    try {
      const cartAnalysis = analyzeCartItems(items)

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
          onSuccess() // Use the onSuccess callback
        } else {
          onError("El pago no se completó correctamente")
        }
      } else {
        toast.success("Pedido confirmado")
        onSuccess() // Use the onSuccess callback
      }
    } catch (error: any) {
      console.error("[v0] Error en handlePayment:", error)
      setCardError(error.message || "Error al procesar el pago")
      onError(error.message || "Error al procesar el pago")
    } finally {
      setProcessing(false)
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
    if (!user) {
      setShowAuthModal(true)
      return
    }
    await onSaveExtendedForm()
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

        <Button
          onClick={() => {
            console.log("[v0] BUTTON CLICKED")
            console.log("[v0] Button disabled?:", processing || !termsAccepted)
            console.log("[v0] processing:", processing)
            console.log("[v0] termsAccepted:", termsAccepted)
            handlePayment()
          }}
          disabled={processing || !termsAccepted}
          className="w-full bg-indigo-dark hover:bg-indigo-dark/90 text-white py-6"
        >
          {processing ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Procesando...
            </span>
          ) : needsExtendedForm && !showExtendedFormInline && !extendedFormCompleted ? (
            "Completar datos personales"
          ) : needsVerification && !identityVerified ? (
            "Verificar identidad"
          ) : finalAmount <= 0 ? (
            "Confirmar Pedido"
          ) : (
            `Pagar ${finalAmount.toFixed(2)}€`
          )}
        </Button>

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
                <div>
                  <label className="block text-sm text-indigo-dark/70 mb-1">Tipo de documento *</label>
                  <select
                    value={extendedFormData.documentType}
                    onChange={(e) => setExtendedFormData((prev: any) => ({ ...prev, documentType: e.target.value }))}
                    className="w-full h-10 px-3 border border-indigo-dark/20 rounded-md focus:border-indigo-dark bg-white text-indigo-dark"
                  >
                    <option value="dni">DNI</option>
                    <option value="nie">NIE</option>
                    <option value="passport">Pasaporte</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-indigo-dark/70 mb-1">Número de documento *</label>
                  <Input
                    value={extendedFormData.documentNumber}
                    onChange={(e) => setExtendedFormData((prev: any) => ({ ...prev, documentNumber: e.target.value }))}
                    placeholder="12345678A"
                    className="border-indigo-dark/20 focus:border-indigo-dark"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-indigo-dark/70 mb-1">Dirección *</label>
                  <Input
                    value={extendedFormData.address}
                    onChange={(e) => setExtendedFormData((prev: any) => ({ ...prev, address: e.target.value }))}
                    placeholder="Calle Principal 123, 2º B"
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
                  <label className="block text-sm text-indigo-dark/70 mb-1">Email *</label>
                  <Input
                    value={extendedFormData.email}
                    onChange={(e) => setExtendedFormData((prev: any) => ({ ...prev, email: e.target.value }))}
                    placeholder="tu@email.com"
                    className="border-indigo-dark/20 focus:border-indigo-dark"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowExtendedFormInline(false)}
                  className="flex-1 border-indigo-dark/20 text-indigo-dark hover:bg-rose-nude bg-transparent"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveExtendedFormClick}
                  disabled={savingExtendedForm}
                  className="flex-1 bg-indigo-dark hover:bg-indigo-dark/90 text-white"
                >
                  {savingExtendedForm ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Guardar y continuar
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-indigo-dark/50">
          <ShieldCheck className="h-4 w-4 text-indigo-dark flex-shrink-0 mt-0.5" />
          <span>Pago 100% seguro</span>
        </div>
        <p className="text-xs text-indigo-dark/40 text-center mt-1">
          Procesado por Stripe. Tus datos están protegidos.
        </p>
      </CardContent>
    </Card>
  )
}

export default function CartPage() {
  const { items, removeItem, total, itemCount, clearCart } = useCart()
  const [user, setUser] = useState<any>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [identityVerified, setIdentityVerified] = useState(false)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [checkingVerification, setCheckingVerification] = useState(true)

  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authEmail, setAuthEmail] = useState("")
  const [authPassword, setAuthPassword] = useState("")
  const [authMode, setAuthMode] = useState<"login" | "register">("register")
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState("")

  const [extendedFormData, setExtendedFormData] = useState({
    fullName: "",
    phone: "",
    documentType: "dni",
    documentNumber: "",
    address: "",
    city: "",
    postalCode: "",
    country: "España",
    email: "",
  })
  const [extendedFormCompleted, setExtendedFormCompleted] = useState(false)
  const [savingExtendedForm, setSavingExtendedForm] = useState(false)

  // State for coupons and gift cards
  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState("")

  const [giftCardCode, setGiftCardCode] = useState("")
  const [appliedGiftCard, setAppliedGiftCard] = useState<any>(null)
  const [giftCardLoading, setGiftCardLoading] = useState(false)
  const [giftCardError, setGiftCardError] = useState("")

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseBrowser()
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()
      if (currentUser) {
        setUser(currentUser)
        setAuthEmail(currentUser.email || "")

        const { data: profile } = await supabase
          .from("profiles")
          .select("identity_verified, full_name, phone, document_number, address, city, postal_code")
          .eq("id", currentUser.id)
          .single()

        const hasExtendedData = profile?.full_name && profile?.phone && profile?.document_number && profile?.address
        setExtendedFormCompleted(!!hasExtendedData)
        setIdentityVerified(profile?.identity_verified === true)

        if (profile) {
          setExtendedFormData((prev) => ({
            ...prev,
            fullName: profile.full_name || "",
            phone: profile.phone || "",
            documentNumber: profile.document_number || "",
            address: profile.address || "",
            city: profile.city || "",
            postalCode: profile.postal_code || "",
            email: currentUser.email || "",
          }))
        }
      }
      setCheckingVerification(false)
    }
    checkAuth()
  }, [])

  const handleSaveExtendedForm = async () => {
    if (!user) {
      setShowAuthModal(true)
      toast.error("Debes crear una cuenta antes de continuar")
      return
    }

    setSavingExtendedForm(true)
    try {
      console.log("[v0] Guardando datos personales para userId:", user.id)

      const response = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          ...extendedFormData,
        }),
      })

      if (response.ok) {
        console.log("[v0] Datos guardados exitosamente")
        setExtendedFormCompleted(true)
        // setShowExtendedFormInline(false) // Removed to allow payment after saving
        toast.success("Datos guardados correctamente")
      } else {
        const error = await response.json()
        console.error("[v0] Error:", error)
        toast.error(error.error || "Error al guardar datos")
      }
    } catch (error) {
      console.error("[v0] Error:", error)
      toast.error("Error al guardar la información")
    } finally {
      setSavingExtendedForm(false)
    }
  }

  const calculateFinalAmount = () => {
    let amount = total

    if (appliedCoupon) {
      if (appliedCoupon.type === "percent") {
        amount = amount * (1 - appliedCoupon.discount / 100)
      } else {
        amount = Math.max(0, amount - appliedCoupon.discount)
      }
    }

    if (appliedGiftCard) {
      amount = Math.max(0, amount - appliedGiftCard.balance)
    }

    return amount
  }

  const finalAmount = calculateFinalAmount()

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return

    setCouponLoading(true)
    setCouponError("")

    try {
      const response = await fetch("/api/payments/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponCode: couponCode.trim(), amount: total }), // Pass total amount
      })

      const data = await response.json()

      if (data.valid) {
        setAppliedCoupon({
          code: couponCode.trim(),
          discount: data.percentOff || data.amountOff || 0,
          type: data.percentOff ? "percent" : "fixed",
        })
        setCouponCode("")
      } else {
        setCouponError(data.error || "Cupón no válido")
      }
    } catch (error) {
      setCouponError("Error al validar cupón")
    } finally {
      setCouponLoading(false)
    }
  }

  const handleApplyGiftCard = async () => {
    if (!giftCardCode.trim()) return

    setGiftCardLoading(true)
    setGiftCardError("")

    try {
      const response = await fetch("/api/gift-cards/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: giftCardCode.trim() }),
      })

      const data = await response.json()

      if (data.valid) {
        let balanceInEuros = data.balance
        if (balanceInEuros > 1000) {
          balanceInEuros = balanceInEuros / 100
        }

        setAppliedGiftCard({
          code: giftCardCode.trim(),
          balance: balanceInEuros,
        })
        setGiftCardCode("")
      } else {
        setGiftCardError(data.error || "Gift card no válida")
      }
    } catch (error) {
      setGiftCardError("Error al validar gift card")
    } finally {
      setGiftCardLoading(false)
    }
  }

  const handleSuccess = () => {
    clearCart()
    window.location.href = "/dashboard?welcome=true" // Use window.location.href to navigate
  }

  const handleError = (error: string) => {
    toast.error(error)
  }

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError("")

    try {
      const supabase = getSupabaseBrowser()

      if (authMode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: {
            emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
          },
        })

        if (error) throw error

        if (data.user) {
          setUser(data.user)
          setShowAuthModal(false)
          toast.success("Cuenta creada. Ahora completa tus datos personales")
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        })

        if (error) throw error

        if (data.user) {
          setUser(data.user)
          setShowAuthModal(false)
          window.location.reload()
        }
      }
    } catch (error: any) {
      setAuthError(error.message)
    } finally {
      setAuthLoading(false)
    }
  }

  const getBillingCycleLabel = (cycle: string) => {
    switch (cycle) {
      case "weekly":
        return "Semanal"
      case "monthly":
        return "Mensual"
      case "quarterly":
        return "Trimestral"
      default:
        return "Mensual"
    }
  }

  const isPetiteCart = items.some((item) => item.id.includes("petite-membership"))

  const cartAnalysis = items.length > 0 ? analyzeCartItems(items) : null
  const needsVerification = cartAnalysis?.membershipType && !identityVerified
  const needsExtendedForm = cartAnalysis?.membershipType && !extendedFormCompleted

  const handleVerificationComplete = (verified: boolean) => {
    setIdentityVerified(verified)
    setShowVerificationModal(false)
  }

  if (checkingVerification) {
    return (
      <div className="min-h-screen bg-white pt-32 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#1a1a4b]" />
          <p className="mt-2 text-[#1a1a4b]/70">Verificando tu cuenta...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pt-32">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-[#1a1a4b]/70 hover:text-[#1a1a4b] mb-6">
          <ArrowLeft className="h-4 w-4" />
          Volver al resumen
        </Link>

        {items.length > 0 && (
          <div className="space-y-4 mb-6">
            {items.map((item) => (
              <Card key={item.id} className="border border-indigo-dark/10 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-rose-nude">
                      <Image
                        src={item.image || "/images/jacquemus-le-chiquito.jpg"}
                        alt={item.name}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/images/jacquemus-le-chiquito.jpg"
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-serif text-lg text-indigo-dark">{item.name}</h3>
                          <p className="text-sm text-indigo-dark/60 mt-1">{item.description}</p>
                          <span className="inline-block mt-2 px-3 py-1 bg-rose-pastel/30 text-indigo-dark text-xs rounded-full">
                            {getBillingCycleLabel(item.billingCycle)}
                          </span>
                        </div>
                        <div className="text-right flex items-start gap-3">
                          <div>
                            <p className="font-serif text-xl text-indigo-dark">{item.price}</p>
                            <p className="text-sm text-indigo-dark/60">
                              /
                              {item.billingCycle === "weekly"
                                ? "semana"
                                : item.billingCycle === "monthly"
                                  ? "mes"
                                  : "trimestre"}
                            </p>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-2 text-indigo-dark/40 hover:text-rose-pastel hover:bg-rose-nude rounded-lg transition-colors"
                            title="Eliminar del carrito"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {isPetiteCart && (
          <Card className="mb-6 border border-indigo-dark/10 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3 bg-rose-nude border border-rose-pastel/30 p-4 rounded-lg">
                <Info className="w-5 h-5 text-indigo-dark flex-shrink-0 mt-0.5" />
                <div className="text-sm text-indigo-dark">
                  <p className="font-medium">Membresía Petite + Pase de Bolso</p>
                  <p className="mt-1 text-indigo-dark/70">
                    Tu reserva incluye la membresía semanal y el pase para el bolso seleccionado. Puedes renovar
                    semanalmente hasta 3 meses.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6 border border-indigo-dark/10 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4 text-indigo-dark" />
                <span className="text-sm font-medium text-indigo-dark">¿Tienes un código de descuento?</span>
              </div>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-rose-nude border border-rose-pastel/30 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-indigo-dark" />
                    <span className="text-sm text-indigo-dark">
                      Cupón {appliedCoupon.code} aplicado (-{appliedCoupon.discount}
                      {appliedCoupon.type === "percent" ? "%" : "€"})
                    </span>
                  </div>
                  <button onClick={() => setAppliedCoupon(null)} className="text-indigo-dark/40 hover:text-indigo-dark">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Código de cupón"
                    className="flex-1 border-indigo-dark/20 focus:border-indigo-dark"
                  />
                  <Button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    variant="outline"
                    className="border-indigo-dark/20 text-indigo-dark hover:bg-rose-nude bg-transparent"
                  >
                    {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aplicar"}
                  </Button>
                </div>
              )}
              {couponError && <p className="text-sm text-rose-pastel mt-1">{couponError}</p>}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-4 h-4 text-indigo-dark" />
                <span className="text-sm font-medium text-indigo-dark">¿Tienes una Gift Card?</span>
              </div>
              {appliedGiftCard ? (
                <div className="flex items-center justify-between bg-rose-nude border border-rose-pastel/30 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-indigo-dark" />
                    <span className="text-sm text-indigo-dark">
                      Gift Card aplicada (Saldo: {appliedGiftCard.balance.toFixed(2)}€)
                    </span>
                  </div>
                  <button
                    onClick={() => setAppliedGiftCard(null)}
                    className="text-indigo-dark/40 hover:text-indigo-dark"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={giftCardCode}
                    onChange={(e) => setGiftCardCode(e.target.value)}
                    placeholder="SEMZO-XXXX-XXXX"
                    className="flex-1 border-indigo-dark/20 focus:border-indigo-dark"
                  />
                  <Button
                    onClick={handleApplyGiftCard}
                    disabled={giftCardLoading || !giftCardCode.trim()}
                    variant="outline"
                    className="border-indigo-dark/20 text-indigo-dark hover:bg-rose-nude bg-transparent"
                  >
                    {giftCardLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aplicar"}
                  </Button>
                </div>
              )}
              {giftCardError && <p className="text-sm text-rose-pastel mt-1">{giftCardError}</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 border border-indigo-dark/10 shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-serif text-lg text-indigo-dark mb-4">Resumen del pedido</h3>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-indigo-dark/70">{item.name}</span>
                  <span className="text-indigo-dark">{item.price}</span>
                </div>
              ))}

              {appliedCoupon && (
                <div className="flex justify-between text-sm text-rose-pastel">
                  <span>Descuento ({appliedCoupon.code})</span>
                  <span>
                    -{appliedCoupon.type === "percent" ? `${appliedCoupon.discount}%` : `${appliedCoupon.discount}€`}
                  </span>
                </div>
              )}

              {appliedGiftCard && (
                <div className="flex justify-between text-sm text-rose-pastel">
                  <span>Gift Card</span>
                  <span>
                    -
                    {Math.min(
                      appliedGiftCard.balance,
                      total -
                        (appliedCoupon?.type === "percent"
                          ? (total * appliedCoupon.discount) / 100
                          : appliedCoupon?.discount || 0),
                    ).toFixed(2)}
                    €
                  </span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-indigo-dark/70">Envío</span>
                <span className="text-indigo-dark/70">Gratis</span>
              </div>
              <div className="border-t border-indigo-dark/10 pt-3 flex justify-between">
                <span className="font-medium text-indigo-dark">Total</span>
                <span className="font-serif text-xl text-indigo-dark">{finalAmount.toFixed(2)}€</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 border border-indigo-dark/10 shadow-sm">
          <CardContent className="p-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                className="mt-1 h-4 w-4 rounded border-indigo-dark/30 text-indigo-dark focus:ring-indigo-dark"
              />
              <span className="text-sm text-indigo-dark/70">
                He leído y acepto los{" "}
                <Link href="/legal/terms" className="text-indigo-dark underline hover:text-rose-pastel">
                  Términos y Condiciones
                </Link>{" "}
                y la{" "}
                <Link href="/legal/privacy" className="text-indigo-dark underline hover:text-rose-pastel">
                  Política de Privacidad
                </Link>
              </span>
            </label>
          </CardContent>
        </Card>

        <Elements stripe={stripePromise}>
          <PaymentForm
            finalAmount={finalAmount}
            user={user}
            items={items}
            appliedCoupon={appliedCoupon}
            appliedGiftCard={appliedGiftCard}
            termsAccepted={termsAccepted}
            onSuccess={handleSuccess}
            onError={handleError}
            needsExtendedForm={needsExtendedForm}
            needsVerification={needsVerification}
            extendedFormData={extendedFormData}
            setExtendedFormData={setExtendedFormData}
            onSaveExtendedForm={handleSaveExtendedForm}
            savingExtendedForm={savingExtendedForm}
            setShowAuthModal={setShowAuthModal}
          />
        </Elements>

        <div className="pb-12" />

        {user && (
          <IdentityVerificationModal
            isOpen={showVerificationModal}
            onClose={() => setShowVerificationModal(false)}
            onVerificationComplete={handleVerificationComplete}
            userId={user.id}
            membershipType={cartAnalysis?.membershipType || ""}
          />
        )}

        {showAuthModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-serif text-indigo-dark">
                  {authMode === "register" ? "Crear cuenta" : "Iniciar sesión"}
                </h3>
                <button onClick={() => setShowAuthModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                {authMode === "register"
                  ? "Crea una cuenta para continuar con tu compra"
                  : "Inicia sesión para continuar"}
              </p>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-dark"
                    placeholder="tu@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-dark"
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>

                {authError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">{authError}</div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-indigo-dark text-white py-3 rounded-md hover:bg-indigo-dark/90 disabled:opacity-50 transition-colors"
                >
                  {authLoading ? "Procesando..." : authMode === "register" ? "Crear cuenta" : "Iniciar sesión"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === "register" ? "login" : "register")
                    setAuthError("")
                  }}
                  className="w-full text-sm text-indigo-dark hover:underline"
                >
                  {authMode === "register" ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

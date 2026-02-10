"use client"
import { useCart } from "@/app/contexts/cart-context"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect, useMemo } from "react"
import { Info, Tag, Gift, Loader2, X, Check, Trash2, ArrowLeft, ShoppingBag, Shield, User } from "lucide-react"
import { getSupabaseBrowser } from "@/lib/supabase-browser"
import { Checkbox } from "@/components/ui/checkbox"
import { IdentityVerificationModal } from "@/app/components/identity-verification-modal"
import { toast } from "react-toastify"
import { useRouter } from "next/navigation"
import SMSAuthModal from "@/app/components/sms-auth-modal"

function analyzeCartItems(items: any[]) {
  const bagPassItem = items.find((item) => {
    const itemType = (item.itemType || "").toLowerCase()
    return itemType === "bag-pass"
  })

  const membershipItem = items.find((item) => {
    const itemType = (item.itemType || "").toLowerCase()
    return itemType === "membership"
  })

  let membershipType = null
  if (membershipItem) {
    const itemId = (membershipItem.id || "").toLowerCase()
    if (itemId.includes("petite")) {
      membershipType = "petite"
    } else if (itemId.includes("essentiel")) {
      membershipType = "essentiel"
    } else if (itemId.includes("signature")) {
      membershipType = "signature"
    } else if (itemId.includes("prive") || itemId.includes("privé")) {
      membershipType = "prive"
    }
  }

  let bagPassTier = null
  if (bagPassItem) {
    const itemId = (bagPassItem.id || "").toLowerCase()
    if (itemId.includes("essential") || itemId.includes("essentiel")) {
      bagPassTier = "Essentiel"
    } else if (itemId.includes("premium")) {
      bagPassTier = "Premium"
    }
  }

  const billingCycle =
    membershipItem?.billingCycle ||
    membershipItem?.period ||
    (membershipItem?.id?.toLowerCase().includes("weekly") ? "weekly" : "monthly")

  return {
    membershipItem: membershipItem
      ? {
          id: membershipItem.id,
          name: membershipItem.name,
          itemType: membershipItem.itemType,
        }
      : null,
    bagPassItem: bagPassItem
      ? {
          id: bagPassItem.id,
          name: bagPassItem.name,
          itemType: bagPassItem.itemType,
        }
      : null,
    membershipType,
    bagPassTier,
    billingCycle,
    isBagPassOnly: !membershipItem && !!bagPassItem,
  }
}

export default function CartClient({ initialUser }: { initialUser?: any } = {}) {
  const { items, removeItem, total, itemCount, clearCart } = useCart()
  const [user, setUser] = useState<any>(initialUser || null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [identityVerified, setIdentityVerified] = useState(false)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null)
  const [verificationSessionId, setVerificationSessionId] = useState<string | null>(null)
  const [creatingVerification, setCreatingVerification] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)

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

  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState("")

  const [giftCardCode, setGiftCardCode] = useState("")
  const [appliedGiftCard, setAppliedGiftCard] = useState<any>(null)
  const [giftCardLoading, setGiftCardLoading] = useState(false)
  const [giftCardError, setGiftCardError] = useState("")

  const router = useRouter()

  const [checkoutLoading, setCheckoutLoading] = useState(false)

  const refetchUserProfile = async () => {
    const supabase = getSupabaseBrowser()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const currentUser = session?.user
    if (currentUser) {
      setUser(currentUser)
      setAuthEmail(currentUser.email || "")

      const { data: profile } = await supabase
        .from("profiles")
        .select("identity_verified, full_name, first_name, last_name, phone, document_number, document_type, shipping_address, shipping_city, shipping_postal_code, shipping_country")
        .eq("id", currentUser.id)
        .single()

      const hasExtendedData = profile?.full_name && profile?.phone && profile?.document_number && profile?.shipping_address
      setExtendedFormCompleted(!!hasExtendedData)
      setIdentityVerified(profile?.identity_verified === true)

      if (profile) {
        setExtendedFormData((prev) => ({
          ...prev,
          fullName: profile.full_name || "",
          phone: profile.phone || "",
          documentType: profile.document_type || "",
          documentNumber: profile.document_number || "",
          address: profile.shipping_address || "",
          city: profile.shipping_city || "",
          postalCode: profile.shipping_postal_code || "",
          email: currentUser.email || "",
        }))
      }
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseBrowser()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        setUser(session.user)
        // Fetch profile data to determine extendedFormCompleted
        const { data: profile } = await supabase
          .from("profiles")
          .select("identity_verified, full_name, first_name, last_name, phone, document_number, document_type, shipping_address, shipping_city, shipping_postal_code, shipping_country")
          .eq("id", session.user.id)
          .single()

        const hasExtendedData = profile?.full_name && profile?.phone && profile?.document_number && profile?.shipping_address
        setExtendedFormCompleted(!!hasExtendedData)
        setIdentityVerified(profile?.identity_verified === true)

        if (profile) {
          setExtendedFormData((prev) => ({
            ...prev,
            fullName: profile.full_name || "",
            phone: profile.phone || "",
            documentType: profile.document_type || "",
            documentNumber: profile.document_number || "",
            address: profile.shipping_address || "",
            city: profile.shipping_city || "",
            postalCode: profile.shipping_postal_code || "",
            email: session.user.email || "",
          }))
        }
      }
    }

    if (items.length > 0) {
      checkAuth()
    }
  }, [items.length])

  useEffect(() => {
    if (verificationSessionId && user) {
      const interval = setInterval(async () => {
        const response = await fetch(`/api/identity/check-status?userId=${user.id}`)
        const data = await response.json()

        if (data.status === "verified") {
          setIdentityVerified(true)
          clearInterval(interval)
          clearTimeout(timeout)
          setShowVerificationModal(false)
          await refetchUserProfile()
          toast.success("Verificación completada exitosamente")
        }
      }, 15000) // Reduced from 5s to 15s to save function invocations

      const timeout = setTimeout(() => {
        clearInterval(interval)
      }, 300000)

      return () => {
        clearInterval(interval)
        clearTimeout(timeout)
      }
    }
  }, [verificationSessionId, user])

  const handleSaveExtendedForm = async () => {
    if (!user) {
      setShowAuthModal(true)
      toast.error("Debes crear una cuenta antes de continuar")
      return
    }

    setSavingExtendedForm(true)
    try {
      const response = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          ...extendedFormData,
        }),
      })

      if (response.ok) {
        setExtendedFormCompleted(true)
        toast.success("Datos guardados correctamente")
        await refetchUserProfile()
      } else {
        const error = await response.json()
        console.error("[v0] Error al guardar:", error)
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
        body: JSON.stringify({ couponCode: couponCode.trim(), amount: total }),
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

  const handlePaymentSuccess = () => {
    toast.success("¡Pago procesado exitosamente!")
    clearCart()
    router.push("/dashboard/membresia")
  }

  const handleError = (error: string) => {
    toast.error(error)
  }

  const handleAuthSuccess = async (newUser: any) => {
    console.log("[v0] handleAuthSuccess called with user:", newUser.id)
    setUser(newUser)
    setShowAuthModal(false)
    
    // Sincronizar profile inmediatamente después del signup SMS
    try {
      const syncResponse = await fetch("/api/sync-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: newUser.user_metadata?.first_name || "",
          lastName: newUser.user_metadata?.last_name || "",
          phone: newUser.phone || newUser.user_metadata?.phone || "",
        }),
      })
      
      if (syncResponse.ok) {
        console.log("[v0] Profile synced successfully after SMS signup")
      }
    } catch (error) {
      console.error("[v0] Profile sync error (non-blocking):", error)
    }
    
    toast.success("¡Cuenta creada! Completa tu pedido")
    
    // NO abrir Identity aquí - Identity se activa DESPUÉS del pago cuando existe membership_intent
    // El pago crea el intent, luego el webhook activa Identity verification
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

  const cartAnalysis = useMemo(() => {
    return items.length > 0 ? analyzeCartItems(items) : null
  }, [items])
  
  // Identity verification happens AFTER payment via webhook, not before
  // Users can pay memberships without Identity verified - webhook handles verification flow
  const needsVerification = false
  const needsExtendedForm = cartAnalysis?.membershipType && !extendedFormCompleted

  const handleVerificationComplete = (verified: boolean) => {
    setIdentityVerified(verified)
    setShowVerificationModal(false)
  }

  const handleVerifyIdentity = async () => {
    if (!user) {
      setShowAuthModal(true)
      toast.error("Debes crear una cuenta para continuar")
      return
    }

    setShowVerificationModal(true)
  }
  
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="font-serif text-4xl text-center mb-12">Tu Carrito</h1>
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 text-lg">Tu carrito está vacío</p>
            <Button onClick={() => router.push("/catalog")} className="mt-6 bg-[#2D2A45] hover:bg-[#2D2A45]/90">
              Explorar Catálogo
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const { membershipItem, bagPassItem, membershipType, billingCycle, isBagPassOnly } = cartAnalysis || {
    membershipItem: null,
    bagPassItem: null,
    membershipType: null,
    billingCycle: "weekly",
    isBagPassOnly: false,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 py-12">
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

        {/* FASE 1: AUTH-FIRST - Las secciones de cupones/gift cards/pago requieren autenticación */}
        {user && (
          <div>
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
                      <button onClick={() => setAppliedGiftCard(null)} className="text-indigo-dark/40 hover:text-indigo-dark">
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
                        -{appliedCoupon.discount}
                        {appliedCoupon.type === "percent" ? "%" : "€"}
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

            <div data-payment-section>
              {/* Mandato SEPA (uso limitado) - copy legal obligatorio */}
              <Card className="mb-4 border border-indigo-dark/10 shadow-sm">
                <CardContent className="p-4">
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">
                    Mandato SEPA (uso limitado)
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {"Como medida de seguridad del servicio, SEMZO PRIV\u00C9 podr\u00E1 solicitar la autorizaci\u00F3n de un mandato SEPA Direct Debit exclusivamente como mecanismo de respaldo para la gesti\u00F3n de incidencias graves, incluyendo la no devoluci\u00F3n, p\u00E9rdida o da\u00F1o grave del bolso, conforme a los "}
                    <Link href="/legal/terms" className="text-indigo-dark underline hover:text-rose-pastel" target="_blank" rel="noopener">
                      {"T\u00E9rminos y Condiciones"}
                    </Link>.
                  </p>
                  <p className="text-xs text-slate-600 mt-2">
                    {"Este mandato no se utiliza para pagos recurrentes ni cargos ordinarios, y solo se ejecutar\u00E1 como \u00FAltimo recurso tras los avisos contractuales."}
                  </p>
                </CardContent>
              </Card>

              {/* Boton de pago - PASO 1: create-intent, PASO 2: Stripe Checkout */}
              <Button
                onClick={async () => {
                  setCheckoutLoading(true)
                  try {
                    // Validación crítica: verificar que el usuario existe
                    if (!user || !user.id) {
                      toast.error("Por favor, inicia sesión para continuar")
                      setShowAuthModal(true)
                      setCheckoutLoading(false)
                      return
                    }

                    // Verificar que el perfil existe en la base de datos
                    const supabase = getSupabaseBrowser()
                    const { data: profileCheck, error: profileError } = await supabase
                      .from("profiles")
                      .select("id")
                      .eq("id", user.id)
                      .single()

                    if (profileError || !profileCheck) {
                      console.error("[v0] Profile not found:", profileError)
                      toast.error("Error: Tu perfil no está registrado. Por favor, contacta soporte.")
                      setCheckoutLoading(false)
                      return
                    }

                    const cycle = billingCycle || "monthly"
                    const type = membershipType || "essentiel"

                    console.log("[v0] PASO 1: Creating membership intent for user:", user.id)
                    
                    // PASO 1: Crear intent en DB ANTES de Stripe
                    const intentRes = await fetch("/api/checkout/create-intent", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        userId: user.id,
                        membershipType: type,
                        billingCycle: cycle,
                        amount: finalAmount,
                        coupon: appliedCoupon,
                        giftCard: appliedGiftCard,
                      }),
                    })

                    if (!intentRes.ok) {
                      const intentError = await intentRes.json()
                      throw new Error(intentError.error || "Error al crear intent")
                    }

                    const { intentId } = await intentRes.json()
                    console.log("[v0] Intent created:", intentId)

                    const priceMap: Record<string, Record<string, string>> = {
                      petite: {
                        weekly: "price_1Sx92xKBSKEgBoTnoZwPvKI8",
                        monthly: "price_1Sx92xKBSKEgBoTnoZwPvKI8",
                      },
                      essentiel: {
                        monthly: "price_1RP4LyKBSKEgBoTnJQobCsjs",
                        quarterly: "price_1SxPFdKBSKEgBoTnUvzx5avc",
                      },
                      signature: {
                        monthly: "price_1SSHULKBSKEgBoTn2lGSRuzh",
                        quarterly: "price_1SxPTWKBSKEgBoTnAw5WjZhI",
                      },
                      prive: {
                        monthly: "price_1SSHVKKBSKEgBoTnLoHhpUyV",
                        quarterly: "price_1SxOtWKBSKEgBoTnbuFozBm9",
                      },
                    }

                    const priceId = priceMap[type]?.[cycle]

                    if (!priceId) {
                      toast.error("Plan no disponible. Contacta soporte.")
                      return
                    }

                    console.log("[v0] PASO 2: Creating Stripe checkout with intent_id")

                    // PASO 2: Crear Stripe Checkout con intentId en metadata
                    const res = await fetch("/api/stripe/create-subscription-checkout", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        priceId,
                        membershipType: type,
                        billingCycle: cycle,
                        intentId,
                      }),
                    })

                    const data = await res.json()
                    if (!res.ok) throw new Error(data.error || "Error al crear checkout")

                    console.log("[v0] Redirecting to Stripe:", data.url)
                    window.location.href = data.url
                  } catch (error: any) {
                    console.error("[v0] Checkout error:", error)
                    toast.error(error.message || "Error al procesar el pago")
                  } finally {
                    setCheckoutLoading(false)
                  }
                }}
                disabled={!termsAccepted || checkoutLoading}
                className="w-full bg-indigo-dark hover:bg-indigo-dark/90 text-white py-6 text-base"
              >
                {checkoutLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Redirigiendo a pago seguro...
                  </>
                ) : (
                  <>Pagar {finalAmount.toFixed(2)}{"€"}</>
                )}
              </Button>

              <p className="text-xs text-center text-indigo-dark/50 mt-3">
                {"Ser\u00E1s redirigido a la p\u00E1gina de pago seguro de Stripe"}
              </p>
            </div>
          </div>
        )}

        {/* Prompt de autenticacion unico para usuarios no logueados */}
        {items.length > 0 && !user && (
          <Card className="mb-6 border-2 border-rose-pastel/30 shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-nude flex items-center justify-center">
                <User className="w-8 h-8 text-indigo-dark" />
              </div>
              <h3 className="font-serif text-xl text-indigo-dark mb-2">Inicia sesión para continuar</h3>
              <p className="text-sm text-indigo-dark/70 mb-6">
                Necesitas una cuenta para aplicar descuentos y completar tu compra
              </p>
              <Button
                onClick={() => setShowAuthModal(true)}
                className="bg-indigo-dark hover:bg-indigo-dark/90 text-white px-8"
              >
                Crear cuenta o iniciar sesión
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="pb-12" />

        {showVerificationModal && (
          <IdentityVerificationModal
            isOpen={showVerificationModal}
            onClose={() => setShowVerificationModal(false)}
            userId={user?.id || ""}
          />
        )}

        {showAuthModal && (
          <SMSAuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onSuccess={handleAuthSuccess}
            mode="signup"
          />
        )}
      </div>
    </div>
  )
}

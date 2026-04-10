"use client"
import { useCart } from "@/app/contexts/cart-context"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect, useMemo } from "react"
import { Info, Tag, Gift, Loader2, X, Check, Trash2, ArrowLeft, ShoppingBag, Shield } from "lucide-react"
import { getSupabaseBrowser } from "@/lib/supabase-browser"
import { Checkbox } from "@/components/ui/checkbox"
import { IdentityVerificationModal } from "@/app/components/identity-verification-modal"
import { toast } from "react-toastify"
import { useRouter } from "next/navigation"
import SMSAuthModal from "@/app/components/sms-auth-modal"
import { LoginModal } from "@/app/components/login-modal"
import { useRequireAuth } from "@/app/hooks/useRequireAuth"

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
  
  // Hook para login modal con accion pendiente
  const { 
    showLoginModal, 
    setShowLoginModal, 
    requireAuth, 
    executePendingAction 
  } = useRequireAuth()

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
     .maybeSingle() 

      const hasExtendedData = profile?.full_name && profile?.phone && profile?.document_number && profile?.shipping_address
      setExtendedFormCompleted(!!hasExtendedData)

      // Verificar desde identity_verifications (fuente de verdad)
      const { data: verification } = await supabase
        .from("identity_verifications")
        .select("status")
        .eq("user_id", currentUser.id)
        .maybeSingle()

      const isVerified = verification?.status === "verified" || profile?.identity_verified === true
      setIdentityVerified(isVerified)

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
          .maybeSingle()

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
          code: data.code, // ID de Stripe (no el codigo ingresado)
          displayCode: couponCode.trim().toUpperCase(), // Para mostrar en UI
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
        setAppliedGiftCard({
          id: data.giftCard.id,
          code: giftCardCode.trim(),
          balance: data.balance,
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
    toast.success("¡Pago procesado! Ahora verifica tu identidad.")
    clearCart()
    router.push("/verify-identity")
  }

  const handleError = (error: string) => {
    toast.error(error)
  }

  const handleAuthSuccess = async (newUser: any) => {
    const supabase = getSupabaseBrowser()

    let user = null
    for (let i = 0; i < 3; i++) {
      const res = await supabase.auth.getUser()
      user = res.data.user
      if (user) break
      await new Promise(r => setTimeout(r, 300))
    }

    if (!user) {
      console.warn("[CART] User still null after retry")
      return
    }

    setUser(user)
    setShowAuthModal(false)

    try {
      const syncResponse = await fetch("/api/sync-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: user.user_metadata?.first_name || "",
          lastName: user.user_metadata?.last_name || "",
          phone: user.phone || user.user_metadata?.phone || "",
        }),
      })

      if (!syncResponse.ok) {
        console.error("[CART] sync-profile error:", syncResponse.status)
      }
    } catch (error) {
      console.error("[CART] Profile sync error (non-blocking):", error)
    }

    toast.success("¡Cuenta creada! Completa tu pedido")
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
            // Redirigir al callback con next=/cart para restaurar contexto del carrito
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/cart`,
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
  
  // Bloquear checkout si el carrito tiene membresía y el usuario no está verificado
  // Excepción: si el total es 0€ con gift card, se permite pagar y la verificación va después
  const needsVerification = !!(cartAnalysis?.membershipType && !identityVerified && !(finalAmount === 0 && appliedGiftCard))
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
              Explorar Catalogo
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
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image || "/images/jacquemus-le-chiquito.jpg"}
                        alt={item.name}
                        className="object-cover w-full h-full"
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
                          Cupón {appliedCoupon.displayCode || appliedCoupon.code} aplicado (-{appliedCoupon.discount}
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
                      <span>Descuento ({appliedCoupon.displayCode || appliedCoupon.code})</span>
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
                data-checkout-btn
                onClick={async () => {
                  setCheckoutLoading(true)
                  try {
                    // Validacion critica: verificar que el usuario existe
                    if (!user || !user.id) {
                      // Guardar accion pendiente y mostrar login modal
                      setCheckoutLoading(false)
                      await requireAuth(async () => {
                        // Esta accion se ejecutara automaticamente tras login exitoso
                        toast.info("Sesion iniciada. Procesando checkout...")
                        // Re-trigger checkout
                        const checkoutBtn = document.querySelector('[data-checkout-btn]') as HTMLButtonElement
                        if (checkoutBtn) checkoutBtn.click()
                      })
                      return
                    }

                    // Verificar que el perfil existe en la base de datos
                    const supabase = getSupabaseBrowser()
                    const { data: profileCheck, error: profileError } = await supabase
                      .from("profiles")
                      .select("id")
                      .eq("id", user.id)
                      .maybeSingle()

                    if (profileError || !profileCheck) {
                      console.error("[v0] Profile not found:", profileError)
                      toast.error("Error: Tu perfil no está registrado. Por favor, contacta soporte.")
                      setCheckoutLoading(false)
                      return
                    }

                    const cycle = billingCycle || "monthly"
                    const type = membershipType || "essentiel"

                    // GIFT CARD 100% — no pasa por Stripe
                    if (finalAmount === 0 && appliedGiftCard) {
                      const resolvedType = membershipType || type
                      const resolvedCycle = billingCycle || cycle
                      const gcResponse = await fetch("/api/memberships/purchase-with-gift-card", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          userId: user.id,
                          giftCardId: appliedGiftCard.id,
                          amountCents: Math.round(Math.min(appliedGiftCard.balance, total) * 100),
                          membershipType: resolvedType,
                          billingCycle: resolvedCycle,
                        }),
                      })
                      const gcData = await gcResponse.json()
                      if (!gcResponse.ok) throw new Error(gcData.error || "Error al procesar gift card")
                      clearCart()
                      toast.success("Membresía activada con Gift Card")
                      // Redirigir a verificación de identidad — mismo flujo que membresía via Stripe
                      router.push("/verify-identity")
                      return
                    }

                    // PASO 1: Crear intent en DB ANTES de Stripe
                    const intentRes = await fetch("/api/checkout/create-intent", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
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

                    const priceMap: Record<string, Record<string, string>> = {
                      petite: {
                        weekly: "price_1Sx92xKBSKEgBoTnoZwPvKI8",
                        monthly: "price_1Sx92xKBSKEgBoTnoZwPvKI8",
                      },
                      essentiel: {
                        weekly: "price_1RP4LyKBSKEgBoTnJQobCsjs",
                        monthly: "price_1RP4LyKBSKEgBoTnJQobCsjs",
                        quarterly: "price_1SxPFdKBSKEgBoTnUvzx5avc",
                      },
                      signature: {
                        weekly: "price_1SSHULKBSKEgBoTn2lGSRuzh",
                        monthly: "price_1SSHULKBSKEgBoTn2lGSRuzh",
                        quarterly: "price_1SxPTWKBSKEgBoTnAw5WjZhI",
                      },
                      prive: {
                        weekly: "price_1SSHVKKBSKEgBoTnLoHhpUyV",
                        monthly: "price_1SSHVKKBSKEgBoTnLoHhpUyV",
                        quarterly: "price_1SxOtWKBSKEgBoTnbuFozBm9",
                      },
                    }

                    const { bagPassItem: cartBagPass } = analyzeCartItems(items)
                    let priceId: string | undefined

                    if (!cartBagPass) {
                      // Membresia normal: usar priceId de catalogo
                      priceId = priceMap[type]?.[cycle]
                      if (!priceId) {
                        toast.error("Plan no disponible. Contacta soporte.")
                        return
                      }
                    }
                    // Bag-pass: NO usar priceId de catalogo → price_data dinamico en endpoint

                    // PASO 2: Crear Stripe Checkout
                    // Membresía → priceId fijo + membershipType (mode: subscription)
                    // Bag-pass → amountCents dinamico sin membershipType (mode: payment)
                    const checkoutBody: Record<string, any> = { intentId }
                    if (cartBagPass) {
                      checkoutBody.amountCents = Math.round(finalAmount * 100)
                      checkoutBody.productName = cartBagPass.name || "Pase de Bolso"
                      if (appliedGiftCard) {
                        checkoutBody.gift_card_id = appliedGiftCard.id
                        checkoutBody.giftCardAmountEuros = appliedGiftCard.balance
                      }
                    } else {
                      checkoutBody.priceId = priceId
                      checkoutBody.membershipType = type
                      checkoutBody.billingCycle = cycle
                      if (appliedGiftCard) {
                        checkoutBody.gift_card_id = appliedGiftCard.id
                      }
                    }
                    // Pasar cupón a Stripe para que lo aplique en el checkout
                    if (appliedCoupon) {
                      checkoutBody.coupon = appliedCoupon
                    }

                    // Bag-pass → endpoint de pago único
                    // Membresía → endpoint de suscripción
                    const checkoutEndpoint = cartBagPass
                      ? "/api/stripe/create-payment-checkout"
                      : "/api/stripe/create-subscription-checkout"

                    const res = await fetch(checkoutEndpoint, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(checkoutBody),
                    })

                    const data = await res.json()
                    if (!res.ok) throw new Error(data.error || "Error al crear checkout")

                    window.location.href = data.url
                  } catch (error: any) {
                    console.error("[v0] Checkout error:", error)
                    toast.error(error.message || "Error al procesar el pago")
                  } finally {
                    setCheckoutLoading(false)
                  }
                }}
                  disabled={!termsAccepted || checkoutLoading || !user}
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
  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-nude flex items-center justify-center overflow-hidden">
    <Image src="/images/sp-monogram-v2.png" alt="Semzo Privé" width={40} height={40} className="object-contain" style={{ width: "auto", height: "auto" }} />
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

        {/* Login Modal con accion pendiente */}
        <LoginModal
          open={showLoginModal}
          onOpenChange={setShowLoginModal}
          onSuccess={async () => {
            await refetchUserProfile()
            await executePendingAction()
          }}
          onClose={() => setShowLoginModal(false)}
        />
      </div>
    </div>
  )
}

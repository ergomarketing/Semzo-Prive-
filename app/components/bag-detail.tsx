"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Clock,
  Shield,
  Heart,
  ArrowLeft,
  ZoomIn,
  Star,
  Share2,
  Truck,
  RotateCcw,
  Check,
  Calendar,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { createBrowserClient } from "@supabase/ssr"
import { useCart } from "@/app/contexts/cart-context"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/app/hooks/useAuth"
import { LoginModal } from "@/app/components/login-modal"
import { ModeSelectorDialog } from "@/app/components/mode-selector-dialog"
import { useTranslations, useLocale } from "next-intl"

interface BagDetailProps {
  bag: {
    id: string
    name: string
    brand: string
    description: string
    price: string
    retailPrice: string
    images: string[]
    membership: "essentiel" | "signature" | "prive"
    color: string
    material: string
    dimensions: string
    condition: string
    year: string
    availability: {
      status: "available" | "rented"
      returnDate?: string
    }
    rating: number
    reviews: number
    features: string[]
    careInstructions: string[]
    purchase_price?: number | null
    authenticity_certificate_url?: string | null
  }
  relatedBags?: {
    id: string
    name: string
    brand: string
    price: string
    image: string
    membership: string
  }[]
}

export default function BagDetail({ bag, relatedBags }: BagDetailProps) {
  const t = useTranslations("bagDetail")
  const locale = useLocale()
  const [selectedImage, setSelectedImage] = useState(0)
  const [inWishlist, setInWishlist] = useState(false)
  const [showZoom, setShowZoom] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  const [isAddingToWaitlist, setIsAddingToWaitlist] = useState(false)
  const [isInWaitlist, setIsInWaitlist] = useState(false)
  const [pendingItems, setPendingItems] = useState<any[]>([])
  const [showReplaceDialog, setShowReplaceDialog] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  const [userMembership, setUserMembership] = useState<{
    tier: string | null
    isActive: boolean
  }>({ tier: null, isActive: false })
  const [isReserving, setIsReserving] = useState(false)
  const [showModeSelector, setShowModeSelector] = useState(false)
  const [modeConfirmed, setModeConfirmed] = useState<"discover" | "collect" | null>(null)
  const { user: authUser, loading: authLoading } = useAuth()
  const userId = authUser?.id || null

  const { addItem, addItems, hasMembership, replaceMembership } = useCart()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedMembership, setSelectedMembership] = useState<string>("petite")
  const [autoReserveTriggered, setAutoReserveTriggered] = useState(false)
  const [shareMenuOpen, setShareMenuOpen] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)

  // En movil: navigator.share nativo (Instagram DMs, WhatsApp, etc.).
  // En desktop: menu con Pinterest, X, Facebook, LinkedIn, copiar.
  const handleShareClick = async () => {
    const colorSuffix = bag.color && bag.color !== "Clasico" ? ` ${bag.color}` : ""
    const shareUrl = typeof window !== "undefined" ? window.location.href : ""
    const shareTitle = `${bag.brand} ${bag.name}${colorSuffix} - Semzo Prive`
    const shareText = `Mira este bolso ${bag.brand} ${bag.name}${colorSuffix} en Semzo Prive`

    // En movil/tablets con share nativo, lo usamos directamente
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl })
        return
      } catch {
        // Usuario cancelo o no soportado, continuar con menu
      }
    }
    // Desktop: abrir menu con redes
    setShareMenuOpen((open) => !open)
  }

  const copyShareUrl = async () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : ""
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl)
        setShareCopied(true)
        setTimeout(() => setShareCopied(false), 2000)
      } catch {
        // silencioso
      }
    }
  }

  // URLs de share por red social (intent URLs estandar, no requieren API).
  const shareUrls = (() => {
    const url = typeof window !== "undefined" ? window.location.href : ""
    const colorSuffix = bag.color && bag.color !== "Clasico" ? ` ${bag.color}` : ""
    const text = `Mira este bolso ${bag.brand} ${bag.name}${colorSuffix} en Semzo Prive`
    const image = bag.images[0] || ""
    return {
      // Pinterest: critico para moda/lujo (alto trafico de descubrimiento)
      pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${encodeURIComponent(image)}&description=${encodeURIComponent(text)}`,
      // X/Twitter
      x: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      // Facebook
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      // LinkedIn
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    }
  })()

  const membershipColors = {
    essentiel: "bg-rose-nude text-slate-900",
    signature: "bg-rose-pastel/50 text-slate-900",
    prive: "bg-indigo-dark text-white",
  }

  const membershipNames: Record<string, string> = {
    petite: "Petite",
    essentiel: "L'Essentiel",
    signature: "Signature",
    prive: "Privé",
  }

  const membershipConfig: Record<string, { name: string; price: number; quarterlyPrice: number; description: string }> =
    {
      essentiel: {
        name: `${t("membershipWord")} L'ESSENTIEL`,
        price: 59,
        quarterlyPrice: 149,
        description: t("descEssentiel"),
      },
      signature: {
        name: `${t("membershipWord")} SIGNATURE`,
        price: 149,
        quarterlyPrice: 357,
        description: t("descSignature"),
      },
      prive: {
        name: `${t("membershipWord")} PRIVÉ`,
        price: 279,
        quarterlyPrice: 669,
        description: t("descPrive"),
      },
    }

  // Obtener la configuración correcta según el tier del bolso
  const currentMembershipConfig = membershipConfig[bag.membership] || membershipConfig.essentiel

  const membershipOptions: Record<
    string,
    {
      name: string
      badge: string
      badgeColor: string
      description: string
      price?: number
      monthlyEquivalent?: string
      period: string
      billingCycle: string
    }
  > = {
    petite: {
      name: membershipNames.petite,
      badge: t("badgeWeekly"),
      badgeColor: "bg-rose-50 text-rose-500",
      description: t("petiteDesc"),
      basePrice: 19.99,
      bagPass: bag.membership === "essentiel" ? 52 : bag.membership === "signature" ? 99 : 137,
      period: t("perWeek"),
      billingCycle: "weekly",
    },
    essentiel: {
      name: currentMembershipConfig.name,
      badge: t("badgeMonthly"),
      badgeColor: "bg-rose-50 text-rose-500",
      description: currentMembershipConfig.description,
      price: currentMembershipConfig.price,
      period: t("perMonth"),
      billingCycle: "monthly",
    },
    "essentiel-quarterly": {
      name: currentMembershipConfig.name,
      badge: t("badgeSave16"),
      badgeColor: "bg-rose-50 text-rose-500",
      description: t("quarterlyDesc", { tier: membershipNames[bag.membership] }),
      price: currentMembershipConfig.quarterlyPrice,
      monthlyEquivalent: t("monthlyEquiv", { amount: (currentMembershipConfig.quarterlyPrice / 3).toFixed(2) }),
      period: t("perQuarter"),
      billingCycle: "quarterly",
    },
  }

  const membershipImages: Record<string, string> = {
    petite: "/images/jacquemus-le-chiquito.jpg",
    essentiel: "/images/louis-vuitton-essentiel-new.jpg",
    signature: "/images/dior-lady-bag.jpg",
    prive: "/images/chanel-prive-pink.jpg",
  }

  const availabilityStatus = {
    available: {
      label: t("available"),
      color: "text-[#1a2c4e]",
      bgColor: "bg-rose-50",
      message: t("availableMsg"),
    },
    rented: {
      label: t("rented"),
      color: "text-[#1a2c4e]",
      bgColor: "bg-rose-50",
      message: t("rentedMsg"),
    },
  }

  const bagsToShow = relatedBags || []

  const addToWaitlist = async () => {
    setIsAddingToWaitlist(true)
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setShowLoginModal(true)
        return
      }

      const { data: existing } = await supabase
        .from("waitlist")
        .select("id")
        .eq("user_id", user.id)
        .eq("bag_id", bag.id)
        .single()

      if (existing) {
        setIsInWaitlist(true)
        alert(t("alreadyWaitlist"))
        return
      }

      const { error } = await supabase.from("waitlist").insert({
        user_id: user.id,
        bag_id: bag.id,
        bag_name: `${bag.brand} ${bag.name}`,
      })

      if (error) throw error

      setIsInWaitlist(true)
      alert(t("waitlistAdded"))
    } catch (error) {
      console.error("Error al agregar a lista de espera:", error)
      alert(t("genericError"))
    } finally {
      setIsAddingToWaitlist(false)
    }
  }

  const handleReserve = async () => {
    // GATE DE ELEGIBILIDAD (antes de llevar al carrito).
    // Aplica a cualquier socia logueada. El endpoint deja pasar a socias
    // nuevas (sin membresia) y bloquea morosas (past_due/unpaid) o con un
    // bolso en posesion sin devolver. No usamos userMembership.tier porque
    // ese fetch solo lee status=active y no detecta a las morosas.
    if (userId) {
      try {
        setIsReserving(true)
        const res = await fetch("/api/user/reservation-eligibility")
        const elig = await res.json().catch(() => ({}))
        if (!elig?.allowed) {
          toast({
            title: t("cannotReserve"),
            description: elig?.message || t("cannotReserveDesc"),
            variant: "destructive",
          })
          setIsReserving(false)
          return
        }
      } catch {
        // Si la verificacion falla, el backend (carrito/checkout) sigue
        // bloqueando: no dejamos pasar por seguridad.
        toast({
          title: t("cannotVerify"),
          description: t("cannotVerifyDesc"),
          variant: "destructive",
        })
        setIsReserving(false)
        return
      }
      setIsReserving(false)
    }

    const option = membershipOptions[selectedMembership]
    let itemsToAdd: any[] = []

    if (selectedMembership === "petite") {
      // Para Petite: agregar DOS items separados
      const membershipItem = {
        id: `petite-membership-${Date.now()}`,
        name: t("petiteMembership"),
        price: `${option.basePrice.toFixed(2)}€`,
        billingCycle: option.billingCycle,
        description: t("petiteMembershipDesc"),
        image: membershipImages.petite,
        brand: "Semzo Privé",
        itemType: "membership",
      }

      const bagPassItem = {
        id: `bag-pass-${bag.id}-${Date.now()}`,
        name: t("bagPass", { tier: membershipNames[bag.membership] }),
        price: `${option.bagPass.toFixed(2)}€`,
        billingCycle: option.billingCycle,
        description: `${bag.brand} ${bag.name}`,
        image: bag.images?.[0] || bag.image || "/images/jacquemus-le-chiquito.jpg",
        brand: bag.brand,
        itemType: "bag-pass",
      }

      itemsToAdd = [membershipItem, bagPassItem]
    } else {
      // Para otras membresías: usar la imagen correcta según el tier del bolso
      const membershipImage = membershipImages[bag.membership] || membershipImages.essentiel
      const price = `${option.price}€`
      const cartItem = {
        id: `${selectedMembership}-${bag.id}-${Date.now()}`,
        name: option.name.replace("MEMBRESÍA ", ""),
        price,
        billingCycle: option.billingCycle,
        description: `${bag.brand} ${bag.name}`,
        image: membershipImage,
        brand: bag.brand,
        itemType: "membership",
      }
      itemsToAdd = [cartItem]
    }

    // Simplemente agregamos los items y redirigimos
    if (itemsToAdd.length > 1) {
      addItems(itemsToAdd)
    } else {
      addItem(itemsToAdd[0])
    }
    router.push("/cart")
  }

  const handleConfirmReplace = () => {
    replaceMembership(pendingItems)
    setShowReplaceDialog(false)
    setPendingItems([])
    router.push("/cart")
  }

  const handleDirectReservation = async () => {
    if (!userId) {
      setShowLoginModal(true)
      return
    }

    if (!userMembership.tier || !userMembership.isActive) {
      return
    }

    setIsReserving(true)

    try {
      console.log("[v0] Creating reservation for user:", userId, "bag:", bag.id)

      const startDate = new Date()

      const response = await fetch("/api/user/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          bag_id: bag.id,
          start_date: startDate.toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // fallback, server sobreescribe
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t("reservationCreateError"))
      }

      toast({
        title: t("reservationSuccess"),
        description: t("reservationSuccessDesc", { brand: bag.brand, name: bag.name }),
      })

      router.push("/dashboard/reservas")
    } catch (error: any) {
      console.error("[v0] Error creating reservation:", error)
      toast({
        title: t("error"),
        description: error instanceof Error ? error.message : t("reservationCreateError"),
        variant: "destructive",
      })
    } finally {
      setIsReserving(false)
    }
  }

  // Registra el modo elegido (discover/collect) en ownership_progress.
  // No bloquea la reserva si falla: la socia ha aceptado, y reintentamos en background.
  const registerOwnershipMode = async (mode: "discover" | "collect") => {
    try {
      await fetch("/api/user/ownership-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bag_id: bag.id, mode }),
      })
    } catch (err) {
      console.error("[v0] Error registering ownership mode:", err)
    }
  }

  // Handler invocado desde el modal: registra modo y continua la reserva normal.
  const handleModeSelected = async (mode: "discover" | "collect") => {
    await registerOwnershipMode(mode)
    setModeConfirmed(mode)
    // Disparar la reserva real tras cerrar el modal
    setTimeout(() => {
      handleQuickReserveCore()
    }, 50)
  }

  const handleQuickReserve = async () => {
    if (!authUser) {
      setPendingAction(() => handleQuickReserve)
      setShowLoginModal(true)
      return
    }

    if (!canReserveWithMembership()) {
      toast({
        title: t("insufficientMembership"),
        description: t("insufficientMembershipDesc", { required: bag.membership.toUpperCase(), current: userMembership.tier || "Free" }),
        variant: "destructive",
      })
      return
    }

    // Si el bolso es elegible para Modo Colecciona y aun no se eligio modo,
    // mostrar el selector. Si no tiene purchase_price, la reserva sigue
    // siendo Modo Descubre por defecto (registrado silenciosamente).
    const hasCollectOption = bag.purchase_price != null && Number(bag.purchase_price) > 0
    if (hasCollectOption && !modeConfirmed) {
      setShowModeSelector(true)
      return
    }

    // Si no hay opcion Colecciona, registrar discover silenciosamente y seguir
    if (!hasCollectOption && !modeConfirmed) {
      registerOwnershipMode("discover")
      setModeConfirmed("discover")
    }

    handleQuickReserveCore()
  }

  const handleQuickReserveCore = async () => {
    setIsReserving(true)

    try {
      const startDate = new Date()
      startDate.setHours(0, 0, 0, 0)

      const response = await fetch("/api/user/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": authUser.id,
        },
        body: JSON.stringify({
          bag_id: bag.id,
          start_date: startDate.toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // fallback, server sobreescribe
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t("reservationCreateError"))
      }

      toast({
        title: t("reservationSuccess"),
        description: t("reservationSuccessDesc", { brand: bag.brand, name: bag.name }),
      })

      router.push("/dashboard/reservas")
    } catch (error) {
      console.error("[v0] Error creating quick reservation:", error)
      toast({
        title: t("error"),
        description: error instanceof Error ? error.message : t("reservationCreateError"),
        variant: "destructive",
      })
    } finally {
      setIsReserving(false)
    }
  }

  const canReserveWithMembership = () => {
    return userMembership.isActive
  }

  // ============================================================================
  // FLUJO VALIDADO — NO MODIFICAR SIN CONSULTAR
  // ============================================================================
  // PASO 10 del flujo de suscripcion: AUTO-RESERVA DEL BOLSO
  //
  // Cuando el usuario llega con ?reserve=1 (desde onboarding-complete tras
  // activar membresia), disparar handleQuickReserve automaticamente.
  //
  // Condiciones antes de disparar:
  //  - No se ha disparado ya (autoReserveTriggered)
  //  - searchParams.reserve === "1"
  //  - authUser presente y authLoading terminado
  //  - userMembership.isActive true (esperar a fetchUserMembership)
  //
  // Tras disparar: limpiar ?reserve=1 de la URL con replaceState para que
  // un refresh no vuelva a activarlo.
  // ============================================================================
  useEffect(() => {
    if (autoReserveTriggered) return
    if (searchParams.get("reserve") !== "1") return
    if (authLoading) return
    if (!authUser) return
    if (!userMembership.isActive) return

    setAutoReserveTriggered(true)
    toast({
      title: t("completingReservation"),
      description: t("reserving", { brand: bag.brand, name: bag.name }),
    })
    handleQuickReserve()
    const url = new URL(window.location.href)
    url.searchParams.delete("reserve")
    window.history.replaceState({}, "", url.toString())
  }, [searchParams, authLoading, authUser, userMembership.isActive, autoReserveTriggered])

  useEffect(() => {
    const fetchUserMembership = async () => {
      if (!userId || authLoading) return

      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        )

        // Fuente única de verdad: user_memberships
        const { data: userMembershipData } = await supabase
          .from("user_memberships")
          .select("membership_type, status")
          .eq("user_id", userId)
          .eq("status", "active")
          .maybeSingle()

        setUserMembership({
          tier: userMembershipData?.membership_type || null,
          isActive: !!userMembershipData,
        })
      } catch (error) {
        console.error("[v0] Error in fetchUserMembership:", error)
      }
    }

    fetchUserMembership()
  }, [userId, authLoading])

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-6">
        <Link
          href="/catalog"
          className="inline-flex items-center text-indigo-dark hover:underline mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("backToCatalog")}
        </Link>
      </div>

      <div className="container mx-auto px-4 pb-12">
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="relative aspect-square bg-white rounded-2xl overflow-hidden group">
              {bag.availability.status === "rented" && (
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-10 flex items-center justify-center">
                  <div className="text-center text-white">
                    <p className="text-2xl font-serif mb-2">{t("outWithMember")}</p>
                  </div>
                </div>
              )}
              <Image
                src={bag.images[selectedImage] || "/placeholder.svg"}
                alt={`Alquiler ${bag.brand} ${bag.name}${bag.color && bag.color !== "Clasico" ? ` ${bag.color}` : ""} - Bolso de lujo en Semzo Prive`}
                width={600}
                height={600}
                className="object-contain w-full h-full transition-transform duration-300 group-hover:scale-105"
              />
              <button
                onClick={() => setShowZoom(true)}
                className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
              >
                <ZoomIn className="h-5 w-5 text-slate-700" />
              </button>

              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {bag.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      selectedImage === index ? "bg-indigo-dark" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {bag.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square bg-white rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === index
                      ? "border-indigo-dark shadow-md"
                      : "border-transparent hover:border-slate-200"
                  }`}
                >
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={`${bag.brand} ${bag.name}${bag.color && bag.color !== "Clasico" ? ` ${bag.color}` : ""} - vista ${index + 1}`}
                    width={150}
                    height={150}
                    className="object-cover w-full h-full"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="inline-block px-4 py-2 rounded-full text-sm font-medium bg-rose-50 text-[#1a2c4e]">
                  {membershipNames[bag.membership]}
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setInWishlist(!inWishlist)}
                    className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                  >
                    <Heart className={`h-6 w-6 ${inWishlist ? "fill-rose-500 text-rose-500" : "text-slate-400"}`} />
                  </button>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={handleShareClick}
                      aria-label={t("shareBag")}
                      aria-expanded={shareMenuOpen}
                      aria-haspopup="menu"
                      title={t("share")}
                      className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                    >
                      <Share2 className="h-6 w-6 text-slate-400" />
                    </button>
                    {shareMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShareMenuOpen(false)}
                          aria-hidden="true"
                        />
                        <div
                          role="menu"
                          aria-label={t("shareSocial")}
                          className="absolute right-0 top-full mt-2 z-50 bg-white border border-slate-200 rounded-lg shadow-lg p-2 min-w-[200px]"
                        >
                          <a
                            href={shareUrls.pinterest}
                            target="_blank"
                            rel="noopener noreferrer"
                            role="menuitem"
                            onClick={() => setShareMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-slate-700 hover:bg-slate-100"
                          >
                            <span
                              aria-hidden="true"
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E60023] text-white text-xs font-bold"
                            >
                              P
                            </span>
                            Pinterest
                          </a>
                          <a
                            href={shareUrls.x}
                            target="_blank"
                            rel="noopener noreferrer"
                            role="menuitem"
                            onClick={() => setShareMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-slate-700 hover:bg-slate-100"
                          >
                            <span
                              aria-hidden="true"
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-white text-xs font-bold"
                            >
                              X
                            </span>
                            X (Twitter)
                          </a>
                          <a
                            href={shareUrls.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            role="menuitem"
                            onClick={() => setShareMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-slate-700 hover:bg-slate-100"
                          >
                            <span
                              aria-hidden="true"
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1877F2] text-white text-xs font-bold"
                            >
                              f
                            </span>
                            Facebook
                          </a>
                          <a
                            href={shareUrls.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            role="menuitem"
                            onClick={() => setShareMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-slate-700 hover:bg-slate-100"
                          >
                            <span
                              aria-hidden="true"
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0A66C2] text-white text-xs font-bold"
                            >
                              in
                            </span>
                            LinkedIn
                          </a>
                          <div className="my-1 border-t border-slate-100" />
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              copyShareUrl()
                              setShareMenuOpen(false)
                            }}
                            className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm text-slate-700 hover:bg-slate-100"
                          >
                            <span
                              aria-hidden="true"
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-slate-700"
                            >
                              {shareCopied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                            </span>
                            {shareCopied ? t("linkCopied") : t("copyLink")}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

                <p className="text-lg text-slate-500 mb-1">{bag.brand}</p>
                <h1 className="font-serif text-4xl text-slate-900 mb-2">
                  {t("rent")} {bag.brand} {bag.name}
                  {bag.color && bag.color !== "Clasico" ? ` ${bag.color}` : ""}
                </h1>

              <p className="text-sm text-slate-500 uppercase tracking-wide mb-2">
                {t("estimatedRetail")} <span className="text-slate-700">{bag.retailPrice}</span>
              </p>


            </div>

            {authUser ? (
              // User is logged in - show reservation options
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-xl border-2 ${canReserveWithMembership() ? "border-indigo-dark/30 bg-rose-nude" : "border-rose-pastel bg-rose-nude"}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Check
                      className={`h-5 w-5 ${canReserveWithMembership() ? "text-indigo-dark" : "text-indigo-dark/70"}`}
                    />
                    <span
                      className={`font-semibold ${canReserveWithMembership() ? "text-indigo-dark" : "text-indigo-dark/70"}`}
                    >
                      {canReserveWithMembership()
                        ? t("membershipActive")
                        : t("membershipInactive")}
                    </span>
                  </div>

                  {canReserveWithMembership() ? (
                    <p className="text-sm text-indigo-dark/70">{t("membershipActiveDesc")}</p>
                  ) : (
                    <p className="text-sm text-indigo-dark/70">{t("membershipInactiveDesc")}</p>
                  )}
                </div>

                {canReserveWithMembership() && bag.availability.status === "available" && (
                  <Button
                    onClick={handleDirectReservation}
                    disabled={isReserving}
                    className="w-full py-6 text-lg bg-indigo-dark hover:bg-indigo-dark/90 text-white"
                  >
                    {isReserving ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        {t("processing")}
                      </>
                    ) : (
                      <>
                        <Calendar className="h-5 w-5 mr-2" />
                        {t("reserveNow")}
                      </>
                    )}
                  </Button>
                )}

                {!canReserveWithMembership() && (
                  <Button
                    onClick={() => router.push("/dashboard/membresia")}
                    className="w-full py-6 text-lg bg-rose-pastel hover:bg-rose-pastel/90 text-indigo-dark"
                  >
                    {t("completeVerification")}
                  </Button>
                )}
              </div>
            ) : (
              // User is not logged in - show membership options
              <div className="space-y-4">
                <h3 className="font-medium text-slate-900">{t("chooseMembership")}</h3>

                <div
                  onClick={() => setSelectedMembership("petite")}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedMembership === "petite"
                      ? "border-[#1a2c4e] bg-white"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 uppercase text-sm tracking-wide">
                        {membershipOptions.petite.name}
                      </span>
                      <span className="bg-rose-50 text-rose-500 text-xs px-2 py-0.5 rounded">
                        {membershipOptions.petite.badge}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{membershipOptions.petite.description}</p>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedMembership === "petite" ? "border-[#1a2c4e] bg-[#1a2c4e]" : "border-slate-300"
                      }`}
                    >
                      {selectedMembership === "petite" && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-semibold text-slate-900">
                      {(membershipOptions.petite.basePrice + membershipOptions.petite.bagPass).toFixed(2)}€
                    </span>
                    <span className="text-slate-500">{membershipOptions.petite.period}</span>
                  </div>
                  <p className="text-xs text-[#1a2c4e] mt-1 ml-7">
                    {t("petiteBreakdown", { base: membershipOptions.petite.basePrice, tier: membershipNames[bag.membership], pass: membershipOptions.petite.bagPass })}
                  </p>
                </div>

                <div
                  onClick={() => setSelectedMembership("essentiel")}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedMembership === "essentiel"
                      ? "border-[#1a2c4e] bg-white"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 uppercase text-sm tracking-wide">
                        {membershipOptions.essentiel.name}
                      </span>
                      <span className="bg-rose-50 text-rose-500 text-xs px-2 py-0.5 rounded">
                        {membershipOptions.essentiel.badge}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{membershipOptions.essentiel.description}</p>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedMembership === "essentiel" ? "border-[#1a2c4e] bg-[#1a2c4e]" : "border-slate-300"
                      }`}
                    >
                      {selectedMembership === "essentiel" && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-semibold text-slate-900">{membershipOptions.essentiel.price}€</span>
                    <span className="text-slate-500">{membershipOptions.essentiel.period}</span>
                  </div>
                </div>

                <div
                  onClick={() => setSelectedMembership("essentiel-quarterly")}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedMembership === "essentiel-quarterly"
                      ? "border-[#1a2c4e] bg-white"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 uppercase text-sm tracking-wide">
                        {membershipOptions["essentiel-quarterly"].name}
                      </span>
                      <span className="bg-rose-50 text-rose-500 text-xs px-2 py-0.5 rounded">
                        {membershipOptions["essentiel-quarterly"].badge}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{membershipOptions["essentiel-quarterly"].description}</p>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedMembership === "essentiel-quarterly"
                          ? "border-[#1a2c4e] bg-[#1a2c4e]"
                          : "border-slate-300"
                      }`}
                    >
                      {selectedMembership === "essentiel-quarterly" && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-semibold text-slate-900">
                      {membershipOptions["essentiel-quarterly"].price}€
                    </span>
                    <span className="text-slate-500">{membershipOptions["essentiel-quarterly"].period}</span>
                    <span className="text-sm text-slate-400">
                      ({membershipOptions["essentiel-quarterly"].monthlyEquivalent})
                    </span>
                  </div>
                </div>
              </div>
            )}

            {!authUser && bag.availability.status === "available" && (
              <Button
                onClick={handleQuickReserve}
                className="w-full py-6 text-lg bg-indigo-dark hover:bg-indigo-dark/90 text-white"
              >
                {t("reserveFor")}{" "}
                {selectedMembership === "petite"
                  ? `${(membershipOptions.petite.basePrice + membershipOptions.petite.bagPass).toFixed(2)}€${t("perWeek")}`
                  : selectedMembership === "essentiel"
                    ? `${membershipOptions.essentiel.price}€${t("perMonth")}`
                    : `${membershipOptions["essentiel-quarterly"].price}€${t("perQuarter")}`}
              </Button>
            )}

            <div className={`p-4 rounded-xl ${availabilityStatus[bag.availability.status].bgColor}`}>
              <div className="flex items-center gap-2">
                <Clock className={`h-5 w-5 ${availabilityStatus[bag.availability.status].color}`} />
                <span className={`font-medium ${availabilityStatus[bag.availability.status].color}`}>
                  {availabilityStatus[bag.availability.status].label}
                </span>
              </div>
              <p className={`text-sm mt-1 ${availabilityStatus[bag.availability.status].color}`}>
                {availabilityStatus[bag.availability.status].message}
              </p>
            </div>

            {/* whitespace-pre-line respeta los saltos de linea de la descripcion
                (parrafos, listas) sin necesidad de markdown. Optimo para
                descripciones GEO ricas con datos historicos y especificaciones. */}
            <div className="text-slate-600 leading-relaxed whitespace-pre-line">{bag.description}</div>

            <div className="flex items-center justify-around py-4 border-y border-slate-100">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Truck className="h-5 w-5 text-[#1a2c4e]" />
                <span>{t("freeShipping")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Shield className="h-5 w-5 text-[#1a2c4e]" />
                <span>{t("insuranceIncluded")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <RotateCcw className="h-5 w-5 text-[#1a2c4e]" />
                <span>{t("easyReturn")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-16">
          <div className="border-b border-slate-200">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab("details")}
                className={`pb-4 text-sm font-medium transition-colors ${
                  activeTab === "details"
                    ? "border-b-2 border-[#1a2c4e] text-[#1a2c4e]"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t("tabDetails")}
              </button>
              <button
                onClick={() => setActiveTab("care")}
                className={`pb-4 text-sm font-medium transition-colors ${
                  activeTab === "care"
                    ? "border-b-2 border-[#1a2c4e] text-[#1a2c4e]"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t("tabCare")}
              </button>
            </div>
          </div>

          <div className="py-8">
            {activeTab === "details" && (
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">{t("material")}</span>
                    <span className="text-slate-900">{bag.material}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">{t("dimensions")}</span>
                    <span className="text-slate-900">{bag.dimensions}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">{t("condition")}</span>
                    <span className="text-slate-900">{bag.condition}</span>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "care" && (
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>{t("care1")}</p>
                <p>{t("care2")}</p>
                <p>{t("care3")}</p>
                <p>{t("care4")}</p>
              </div>
            )}
          </div>
        </div>

        {/* Related bags */}
        {bagsToShow.length > 0 && (
          <div className="mt-16">
            <h2 className="font-serif text-2xl text-slate-900 mb-8">{t("youMayLike")}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {bagsToShow.slice(0, 4).map((relatedBag) => (
                <Link
                  key={relatedBag.id}
                  href={`/catalog/${(relatedBag as { slug?: string }).slug || relatedBag.id}`}
                  className="group"
                >
                  <div className="aspect-square bg-white rounded-xl overflow-hidden mb-3">
                    <Image
                      src={relatedBag.image || "/placeholder.svg"}
                      alt={relatedBag.name}
                      width={300}
                      height={300}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <p className="text-sm text-slate-500">{relatedBag.brand}</p>
                  <p className="font-medium text-slate-900">{relatedBag.name}</p>
                  <p className="text-sm text-[#1a2c4e]">{relatedBag.price}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Modal selector de modo (Descubre / Colecciona) */}
        <ModeSelectorDialog
          open={showModeSelector}
          onOpenChange={setShowModeSelector}
          bagName={bag.name}
          bagBrand={bag.brand}
          purchasePrice={bag.purchase_price ?? null}
          monthlyPrice={Number.parseFloat(String(bag.price).replace(/[^\d.]/g, "")) || null}
          onSelect={handleModeSelected}
        />

        {/* Login Modal */}
        <LoginModal
          open={showLoginModal}
          onOpenChange={setShowLoginModal}
          plan={bag.membership}
          bag={bag.id}
          onSuccess={() => {
            setShowLoginModal(false)
            if (pendingAction) {
              pendingAction()
              setPendingAction(null)
            }
          }}
          onClose={() => {
            setShowLoginModal(false)
            setPendingAction(null)
          }}
        />
      </div>
    </div>
  )
}

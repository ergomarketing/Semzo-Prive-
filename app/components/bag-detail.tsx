"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Heart,
  Share2,
  Shield,
  Truck,
  RotateCcw,
  Star,
  ChevronLeft,
  ZoomIn,
  Clock,
  Bell,
  Check,
  Calendar,
  Lock,
} from "lucide-react"
import { getSupabaseBrowser } from "@/app/lib/supabaseClient"
import { useCart } from "@/app/contexts/cart-context"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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

const membershipHierarchy: Record<string, number> = {
  free: 0,
  petite: 1,
  essentiel: 2,
  signature: 3,
  prive: 4,
}

export default function BagDetail({ bag, relatedBags }: BagDetailProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [inWishlist, setInWishlist] = useState(false)
  const [showZoom, setShowZoom] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  const [isAddingToWaitlist, setIsAddingToWaitlist] = useState(false)
  const [isInWaitlist, setIsInWaitlist] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showReplaceDialog, setShowReplaceDialog] = useState(false)
  const [pendingItems, setPendingItems] = useState<any[]>([])
  const [userMembership, setUserMembership] = useState<{
    type: string | null
    status: string | null
    canReserveDirectly: boolean
    canReserveBag: boolean
    subscriptionPeriod: "weekly" | "monthly" | "quarterly" | null
  }>({
    type: null,
    status: null,
    canReserveDirectly: false,
    canReserveBag: false,
    subscriptionPeriod: null,
  })
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [reservationDates, setReservationDates] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  })
  const [isCreatingReservation, setIsCreatingReservation] = useState(false)

  const { addItem, addItems, hasMembership, replaceMembership } = useCart()
  const router = useRouter()
  const [selectedMembership, setSelectedMembership] = useState<"petite" | "essentiel" | "essentiel-quarterly">("petite")

  useEffect(() => {
    const checkAuthAndMembership = async () => {
      const supabase = getSupabaseBrowser()
      if (!supabase) return

      const {
        data: { user },
      } = await supabase.auth.getUser()

      setIsAuthenticated(!!user)

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("membership_type, membership_status, subscription_period")
          .eq("id", user.id)
          .maybeSingle()

        if (profile) {
          const hasActiveMembership =
            profile.membership_status === "active" && profile.membership_type && profile.membership_type !== "free"

          const userMembershipType = (profile.membership_type || "free").toLowerCase().replace("l'", "").trim()
          const bagMembershipType = (bag.membership || "essentiel").toLowerCase().replace("l'", "").trim()

          const userLevel = membershipHierarchy[userMembershipType] || 0
          const bagLevel = membershipHierarchy[bagMembershipType] || 2

          const canReserveBag = hasActiveMembership && userLevel >= bagLevel

          setUserMembership({
            type: profile.membership_type,
            status: profile.membership_status,
            canReserveDirectly: hasActiveMembership,
            canReserveBag: canReserveBag,
            subscriptionPeriod: profile.subscription_period || "monthly",
          })
        }
      }
    }
    checkAuthAndMembership()
  }, [bag.membership])

  useEffect(() => {
    if (showReservationModal && userMembership.subscriptionPeriod) {
      const today = new Date()
      const startDate = today.toISOString().split("T")[0]

      let endDate: Date
      switch (userMembership.subscriptionPeriod) {
        case "weekly":
          endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 días
          break
        case "quarterly":
          endDate = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000) // 90 días
          break
        case "monthly":
        default:
          endDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 días
          break
      }

      setReservationDates({
        start: startDate,
        end: endDate.toISOString().split("T")[0],
      })
    }
  }, [showReservationModal, userMembership.subscriptionPeriod])

  const membershipColors = {
    essentiel: "bg-rose-nude text-slate-900",
    signature: "bg-rose-pastel/50 text-slate-900",
    prive: "bg-indigo-dark text-white",
  }

  const membershipNames = {
    essentiel: "L'Essentiel",
    signature: "Signature",
    prive: "Privé",
  }

  const membershipConfig: Record<string, { name: string; price: number; quarterlyPrice: number; description: string }> =
    {
      essentiel: {
        name: "MEMBRESÍA L'ESSENTIEL",
        price: 59,
        quarterlyPrice: 149,
        description: "Accede a este bolso y cámbialo por otro de la colección L'Essentiel cada mes.",
      },
      signature: {
        name: "MEMBRESÍA SIGNATURE",
        price: 129,
        quarterlyPrice: 329,
        description: "Accede a este bolso y cámbialo por otro de la colección Signature cada mes.",
      },
      prive: {
        name: "MEMBRESÍA PRIVÉ",
        price: 189,
        quarterlyPrice: 479,
        description: "Accede a este bolso y cámbialo por otro de la colección Privé cada mes.",
      },
    }

  const currentMembershipConfig = membershipConfig[bag.membership] || membershipConfig.essentiel

  const membershipOptions = {
    petite: {
      name: "MEMBRESÍA PETITE",
      badge: "Semanal",
      badgeColor: "bg-rose-50/70 text-rose-600",
      description:
        "Accede a este bolso por una semana. Perfecto para eventos especiales o para probar antes de comprometerte.",
      basePrice: 19.99,
      bagPass: bag.membership === "essentiel" ? 52 : bag.membership === "signature" ? 99 : 137,
      period: "/semana",
      billingCycle: "weekly" as const,
    },
    essentiel: {
      name: currentMembershipConfig.name,
      badge: "Mensual",
      badgeColor: "bg-rose-50/70 text-rose-600",
      description: currentMembershipConfig.description,
      price: currentMembershipConfig.price,
      period: "/mes",
      billingCycle: "monthly" as const,
    },
    "essentiel-quarterly": {
      name: currentMembershipConfig.name,
      badge: "Trimestral • Ahorra 15%",
      badgeColor: "bg-indigo-50 text-indigo-600",
      description: currentMembershipConfig.description + " Ahorra 15% con el plan trimestral.",
      price: currentMembershipConfig.quarterlyPrice,
      period: "/trimestre",
      billingCycle: "quarterly" as const,
    },
  }

  const membershipImages = {
    petite: "/petite-luxury-bag-subscription-box-elegant.jpg",
    essentiel: "/essentiel-luxury-bag-subscription-elegant-rose.jpg",
    signature: "/signature-premium-bag-subscription-gold-elegant.jpg",
    prive: "/prive-exclusive-bag-subscription-dark-luxury.jpg",
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${bag.brand} ${bag.name}`,
          text: `Mira este increíble ${bag.brand} ${bag.name} en Semzo Privé`,
          url: window.location.href,
        })
      } catch {
        console.log("Error sharing")
      }
    }
  }

  const handleAddToWaitlist = async () => {
    setIsAddingToWaitlist(true)
    const supabase = getSupabaseBrowser()

    if (!supabase) {
      setIsAddingToWaitlist(false)
      return
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login?redirect=" + encodeURIComponent(window.location.pathname))
        return
      }

      const { error } = await supabase.from("waitlist").insert({
        user_id: user.id,
        bag_id: bag.id,
        status: "waiting",
      })

      if (error) throw error

      setIsInWaitlist(true)
    } catch (error) {
      console.error("Error adding to waitlist:", error)
    } finally {
      setIsAddingToWaitlist(false)
    }
  }

  const handleDirectReservation = async () => {
    setIsCreatingReservation(true)
    const supabase = getSupabaseBrowser()

    if (!supabase) {
      setIsCreatingReservation(false)
      return
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("No autorizado")

      const { data: existingReservations } = await supabase
        .from("reservations")
        .select("id, status")
        .eq("user_id", user.id)
        .in("status", ["confirmed", "active", "pending"])

      if (existingReservations && existingReservations.length > 0) {
        alert("Ya tienes una reserva activa. Solo puedes tener una reserva por período de membresía.")
        setShowReservationModal(false)
        setIsCreatingReservation(false)
        return
      }

      const { data: profile } = await supabase.from("profiles").select("full_name, email").eq("id", user.id).single()

      const { data, error } = await supabase
        .from("reservations")
        .insert({
          user_id: user.id,
          bag_id: bag.id,
          start_date: reservationDates.start,
          end_date: reservationDates.end,
          status: "confirmed",
          total_amount: 0,
        })
        .select()
        .single()

      if (error) throw error

      try {
        await fetch("/api/notifications/new-reservation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reservationId: data.id,
            userName: profile?.full_name || user.email?.split("@")[0] || "Cliente",
            userEmail: profile?.email || user.email,
            bagName: `${bag.brand} ${bag.name}`,
            bagImage: bag.images?.[0],
            startDate: reservationDates.start,
            endDate: reservationDates.end,
            membershipType: userMembership.type,
          }),
        })
      } catch (emailError) {
        console.error("Error sending notification email:", emailError)
      }

      setShowReservationModal(false)
      router.push(`/dashboard/reservas/${data.id}`)
    } catch (error) {
      console.error("Error creating reservation:", error)
      alert("Error al crear la reserva. Por favor intenta de nuevo.")
    } finally {
      setIsCreatingReservation(false)
    }
  }

  const handleReserveClick = () => {
    if (userMembership.canReserveBag) {
      setShowReservationModal(true)
    } else if (userMembership.canReserveDirectly && !userMembership.canReserveBag) {
      alert(
        `Tu membresía ${userMembership.type?.toUpperCase()} no incluye bolsos de la colección ${bag.membership.toUpperCase()}. Necesitas una membresía ${bag.membership.toUpperCase()} o superior.`,
      )
    } else {
      handleReserve()
    }
  }

  const handleReserve = () => {
    if (!bag) return

    if (userMembership.canReserveDirectly && userMembership.canReserveBag) {
      setShowReservationModal(true)
    } else if (userMembership.canReserveDirectly && !userMembership.canReserveBag) {
      return
    } else {
      const membershipType = bag.membership || "essentiel"
      const membershipPrices = {
        essentiel: { weekly: "49€", monthly: "79€", quarterly: "199€" },
        signature: { weekly: "79€", monthly: "129€", quarterly: "329€" },
        prive: { weekly: "129€", monthly: "199€", quarterly: "499€" },
      }

      const prices = membershipPrices[membershipType as keyof typeof membershipPrices] || membershipPrices.essentiel

      replaceMembership([
        {
          id: `${membershipType}-membership-${Date.now()}`,
          name: membershipType.toUpperCase(),
          price: prices.monthly,
          billingCycle: "monthly" as const,
          description: `Membresía ${membershipType.charAt(0).toUpperCase() + membershipType.slice(1)}`,
          image: membershipImages[membershipType] || membershipImages.essentiel,
          brand: "Semzo Privé",
          itemType: "membership",
          bagId: bag.id,
        },
      ])

      router.push("/cart")
    }
  }

  const handleConfirmReplace = () => {
    replaceMembership(pendingItems)
    setShowReplaceDialog(false)
    setPendingItems([])
    router.push("/cart")
  }

  const today = new Date().toISOString().split("T")[0]

  const getDurationLabel = () => {
    switch (userMembership.subscriptionPeriod) {
      case "weekly":
        return "7 días"
      case "quarterly":
        return "3 meses"
      case "monthly":
      default:
        return "30 días"
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Dialog open={showReservationModal} onOpenChange={setShowReservationModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Reservar {bag.name}</DialogTitle>
            <DialogDescription>
              Como miembro {userMembership.type?.toUpperCase()}, puedes reservar este bolso sin costo adicional.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
              <Image
                src={bag.images[0] || "/placeholder.svg"}
                alt={bag.name}
                width={60}
                height={60}
                className="rounded-lg object-cover"
              />
              <div>
                <p className="font-medium">{bag.brand}</p>
                <p className="text-sm text-slate-600">{bag.name}</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm font-medium text-slate-700 mb-2">Período de reserva</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Inicio</p>
                  <p className="font-medium">
                    {new Date(reservationDates.start || today).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500">Duración</p>
                  <p className="font-medium text-indigo-dark">{getDurationLabel()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-600">Fin</p>
                  <p className="font-medium">
                    {reservationDates.end
                      ? new Date(reservationDates.end).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-rose-50/30 border border-rose-100 rounded-lg p-3">
              <div className="flex items-center gap-2 text-slate-700">
                <Check className="h-4 w-4 text-rose-300" />
                <span className="text-sm font-medium">
                  Incluido en tu membresía {userMembership.type?.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">El alquiler está incluido en tu plan</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReservationModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleDirectReservation}
              disabled={isCreatingReservation || !reservationDates.start || !reservationDates.end}
              className="bg-[#1a2c4e] hover:bg-[#0f1d33] text-white"
            >
              {isCreatingReservation ? "Reservando..." : "Confirmar Reserva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showReplaceDialog} onOpenChange={setShowReplaceDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Cambiar membresía</DialogTitle>
            <DialogDescription>
              Ya tienes una membresía en tu carrito. ¿Deseas reemplazarla por esta nueva selección?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReplaceDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmReplace} className="bg-slate-900 hover:bg-slate-800">
              Reemplazar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/catalog" className="flex items-center text-slate-600 hover:text-slate-900">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Volver al catálogo
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div
              className="relative aspect-square bg-slate-100 rounded-2xl overflow-hidden cursor-zoom-in"
              onClick={() => setShowZoom(true)}
            >
              <Image
                src={bag.images[selectedImage] || "/placeholder.svg"}
                alt={bag.name}
                fill
                className="object-cover"
              />
              <button className="absolute top-4 right-4 p-2 bg-white/80 rounded-full hover:bg-white transition-colors">
                <ZoomIn className="h-5 w-5" />
              </button>
              <Badge className={`absolute top-4 left-4 ${membershipColors[bag.membership]}`}>
                {membershipNames[bag.membership]}
              </Badge>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {bag.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 ${
                    selectedImage === index ? "ring-2 ring-slate-900" : ""
                  }`}
                >
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={`${bag.name} ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Bag Details */}
          <div className="space-y-6">
            <div>
              <p className="text-slate-600 text-sm uppercase tracking-wider mb-1">{bag.brand}</p>
              <h1 className="text-3xl font-serif text-slate-900 mb-2">{bag.name}</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < Math.floor(bag.rating) ? "text-yellow-400 fill-yellow-400" : "text-slate-300"}`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-slate-600">
                    {bag.rating} ({bag.reviews} reseñas)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className={
                  bag.availability.status === "available"
                    ? "text-indigo-600 border-indigo-200"
                    : "text-slate-600 border-slate-200"
                }
              >
                {bag.availability.status === "available" ? "Disponible" : "Alquilado"}
              </Badge>
            </div>

            {userMembership.canReserveBag && (
              <div className="bg-rose-50/30 border border-rose-100 rounded-xl p-4">
                <div className="flex items-center gap-2 text-slate-700 mb-1">
                  <Check className="h-5 w-5 text-rose-300" />
                  <span className="font-medium">Tienes membresía {userMembership.type?.toUpperCase()} activa</span>
                </div>
                <p className="text-sm text-slate-500">Puedes reservar este bolso directamente sin costo adicional</p>
              </div>
            )}

            {userMembership.canReserveDirectly && !userMembership.canReserveBag && (
              <div className="bg-rose-50/30 border border-rose-100 rounded-xl p-4">
                <div className="flex items-center gap-2 text-slate-700">
                  <Lock className="h-5 w-5 text-rose-300" />
                  <span className="font-medium">Bolso de colección {bag.membership.toUpperCase()}</span>
                </div>
                <p className="text-sm text-slate-500">
                  Tu membresía {userMembership.type?.toUpperCase()} no incluye esta colección. Actualiza a{" "}
                  {bag.membership.toUpperCase()} para reservar este bolso.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 border-slate-300 text-slate-700 hover:bg-rose-50/50 bg-white"
                  onClick={() => router.push(`/membresias`)}
                >
                  Actualizar membresía
                </Button>
              </div>
            )}

            <p className="text-slate-600 leading-relaxed">{bag.description}</p>

            {bag.availability.status === "rented" && bag.availability.returnDate && (
              <div className="bg-rose-50/30 border border-rose-100 rounded-xl p-4">
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="h-5 w-5 text-rose-300" />
                  <span className="font-medium">Disponible a partir del {bag.availability.returnDate}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 bg-white border-slate-300 text-slate-700 hover:bg-rose-50/50"
                  onClick={handleAddToWaitlist}
                  disabled={isAddingToWaitlist || isInWaitlist}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  {isInWaitlist ? "En lista de espera" : "Notificarme disponibilidad"}
                </Button>
              </div>
            )}

            {!userMembership.canReserveDirectly && bag.availability.status === "available" && (
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <p className="text-sm font-medium text-slate-700">Elige tu plan de membresía:</p>
                <div className="space-y-2">
                  {(
                    Object.entries(membershipOptions) as [
                      keyof typeof membershipOptions,
                      (typeof membershipOptions)[keyof typeof membershipOptions],
                    ][]
                  ).map(([key, option]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedMembership(key as typeof selectedMembership)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        selectedMembership === key
                          ? "border-slate-900 bg-white"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{option.name}</span>
                          <Badge className={option.badgeColor}>{option.badge}</Badge>
                        </div>
                        <span className="font-bold">
                          {key === "petite"
                            ? `${(membershipOptions.petite.basePrice + membershipOptions.petite.bagPass).toFixed(2)}€/semana`
                            : selectedMembership === "essentiel"
                              ? `${membershipOptions.essentiel.price}€/mes`
                              : `${membershipOptions["essentiel-quarterly"].price}€/trimestre`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{option.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Button
                className="w-full bg-[#1a2c4e] text-white hover:bg-[#0f1d33] h-14 text-lg font-medium"
                onClick={handleReserveClick}
                disabled={
                  bag.availability.status !== "available" ||
                  (userMembership.canReserveDirectly && !userMembership.canReserveBag)
                }
              >
                {userMembership.canReserveBag ? (
                  <>
                    <Calendar className="h-5 w-5 mr-2" />
                    Reservar Ahora
                  </>
                ) : userMembership.canReserveDirectly && !userMembership.canReserveBag ? (
                  <>
                    <Lock className="h-5 w-5 mr-2" />
                    Requiere membresía {bag.membership.toUpperCase()}
                  </>
                ) : (
                  <>
                    Reservar por{" "}
                    {selectedMembership === "petite"
                      ? `${(membershipOptions.petite.basePrice + membershipOptions.petite.bagPass).toFixed(2)}€/semana`
                      : selectedMembership === "essentiel"
                        ? `${membershipOptions.essentiel.price}€/mes`
                        : `${membershipOptions["essentiel-quarterly"].price}€/trimestre`}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 h-12 bg-transparent"
                onClick={() => {
                  setInWishlist(!inWishlist)
                }}
              >
                <Heart className={`h-5 w-5 mr-2 ${inWishlist ? "fill-red-500 text-red-500" : ""}`} />
                {inWishlist ? "En tu wishlist" : "Añadir a wishlist"}
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Truck className="h-5 w-5" />
                <span>Envío gratis</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Shield className="h-5 w-5" />
                <span>Seguro incluido</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <RotateCcw className="h-5 w-5" />
                <span>Devolución fácil</span>
              </div>
            </div>

            <Button variant="ghost" size="sm" className="bg-transparent" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Compartir
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-12">
          <TabsList className="bg-slate-100">
            <TabsTrigger value="details">Detalles</TabsTrigger>
            <TabsTrigger value="features">Características</TabsTrigger>
            <TabsTrigger value="care">Cuidados</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-slate-500">Color</p>
                    <p className="font-medium">{bag.color}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Material</p>
                    <p className="font-medium">{bag.material}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Dimensiones</p>
                    <p className="font-medium">{bag.dimensions}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Condición</p>
                    <p className="font-medium">{bag.condition}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="features" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {bag.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-indigo-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="care" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  {bag.careInstructions.map((instruction, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Shield className="h-5 w-5 text-slate-600 mt-0.5" />
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Related Bags */}
        {relatedBags && relatedBags.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-serif text-slate-900 mb-6">También te puede gustar</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedBags.map((relBag) => (
                <Link key={relBag.id} href={`/catalog/${relBag.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative aspect-square">
                      <Image src={relBag.image || "/placeholder.svg"} alt={relBag.name} fill className="object-cover" />
                    </div>
                    <CardContent className="p-4">
                      <p className="text-sm text-slate-500">{relBag.brand}</p>
                      <p className="font-medium truncate">{relBag.name}</p>
                      <p className="text-sm font-bold mt-1">{relBag.price}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

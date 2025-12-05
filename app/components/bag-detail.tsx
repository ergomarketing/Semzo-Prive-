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
  AlertTriangle,
  Calendar,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { createBrowserClient } from "@supabase/ssr"
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
    tier: string | null
    isActive: boolean
  }>({ tier: null, isActive: false })
  const [isReserving, setIsReserving] = useState(false)
  const [showReservationSuccess, setShowReservationSuccess] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const { addItem, addItems, hasMembership, replaceMembership } = useCart()
  const router = useRouter()
  const [selectedMembership, setSelectedMembership] = useState<"petite" | "essentiel" | "essentiel-quarterly">("petite")

  useEffect(() => {
    const checkAuthAndMembership = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)

      if (user) {
        setUserId(user.id)
        const { data: profile } = await supabase
          .from("profiles")
          .select("membership_type, membership_status")
          .eq("id", user.id)
          .single()

        if (profile) {
          const isActive =
            profile.membership_status === "active" ||
            profile.membership_status === "confirmed" ||
            (profile.membership_type && profile.membership_type !== "none")
          setUserMembership({
            tier: profile.membership_type,
            isActive: isActive,
          })
        }
      }
    }
    checkAuthAndMembership()
  }, [])

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

  // Obtener la configuración correcta según el tier del bolso
  const currentMembershipConfig = membershipConfig[bag.membership] || membershipConfig.essentiel

  const membershipOptions = {
    petite: {
      name: "MEMBRESÍA PETITE",
      badge: "Semanal",
      badgeColor: "bg-rose-50 text-rose-500",
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
      badgeColor: "bg-rose-50 text-rose-500",
      description: currentMembershipConfig.description,
      price: currentMembershipConfig.price,
      period: "/mes",
      billingCycle: "monthly" as const,
    },
    "essentiel-quarterly": {
      name: currentMembershipConfig.name,
      badge: "Ahorra 16%",
      badgeColor: "bg-rose-50 text-rose-500",
      description: `Accede a la colección ${membershipNames[bag.membership]} completa durante 3 meses con descuento especial.`,
      price: currentMembershipConfig.quarterlyPrice,
      monthlyEquivalent: `${(currentMembershipConfig.quarterlyPrice / 3).toFixed(2)}€/mes`,
      period: "/trimestre",
      billingCycle: "quarterly" as const,
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
      label: "Disponible",
      color: "text-[#1a2c4e]",
      bgColor: "bg-rose-50",
      message: "Este bolso está disponible para reserva inmediata",
    },
    rented: {
      label: "Fuera con Miembro",
      color: "text-[#1a2c4e]",
      bgColor: "bg-rose-50",
      message: "Este bolso está actualmente con un miembro. Te notificaremos cuando esté disponible.",
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
        alert("Debes iniciar sesión para unirte a la lista de espera")
        window.location.href = "/login"
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
        alert("Ya estás en la lista de espera para este bolso")
        return
      }

      const { error } = await supabase.from("waitlist").insert({
        user_id: user.id,
        bag_id: bag.id,
        bag_name: `${bag.brand} ${bag.name}`,
      })

      if (error) throw error

      setIsInWaitlist(true)
      alert("¡Te notificaremos cuando este bolso esté disponible!")
    } catch (error) {
      console.error("Error al agregar a lista de espera:", error)
      alert("Hubo un error. Por favor intenta de nuevo.")
    } finally {
      setIsAddingToWaitlist(false)
    }
  }

  const handleReserve = () => {
    const option = membershipOptions[selectedMembership]
    let itemsToAdd: any[] = []

    if (selectedMembership === "petite") {
      // Para Petite: agregar DOS items separados
      const membershipItem = {
        id: `petite-membership-${Date.now()}`,
        name: "Membresía Petite",
        price: `${option.basePrice.toFixed(2)}€`,
        billingCycle: option.billingCycle,
        description: "Membresía base semanal",
        image: membershipImages.petite,
        brand: "Semzo Privé",
        itemType: "membership" as const,
      }

      const bagPassItem = {
        id: `bag-pass-${bag.id}-${Date.now()}`,
        name: `Pase Bolso ${membershipNames[bag.membership]}`,
        price: `${option.bagPass.toFixed(2)}€`,
        billingCycle: option.billingCycle,
        description: `${bag.brand} ${bag.name}`,
        image: bag.images[0],
        brand: bag.brand,
        itemType: "bag-pass" as const,
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
        itemType: "membership" as const,
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
    console.log("[v0] handleDirectReservation called")
    console.log("[v0] userId:", userId)
    console.log("[v0] userMembership:", userMembership)

    if (!userId || !userMembership.isActive) {
      console.log("[v0] Redirecting to login - no userId or membership inactive")
      router.push("/auth/login?redirect=" + encodeURIComponent(`/catalog/${bag.id}`))
      return
    }

    setIsReserving(true)
    try {
      console.log("[v0] Creating reservation...")
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      // Calculate dates based on membership type
      const startDate = new Date()
      const endDate = new Date()

      if (userMembership.tier === "petite") {
        endDate.setDate(endDate.getDate() + 7) // 1 week
      } else {
        endDate.setMonth(endDate.getMonth() + 1) // 1 month
      }

      // Create reservation
      const { data: reservation, error } = await supabase
        .from("reservations")
        .insert({
          user_id: userId,
          bag_id: bag.id,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status: "confirmed",
          total_amount: 0, // Already paid through membership
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      console.log("[v0] Reservation result:", reservation)
      console.log("[v0] Reservation error:", error)

      if (error) {
        console.error("[v0] Error creating reservation:", error)
        alert("Error al crear la reserva: " + error.message)
        return
      }

      // Update bag status
      await supabase.from("bags").update({ status: "rented" }).eq("id", bag.id)

      setShowReservationSuccess(true)

      setTimeout(() => {
        window.location.href = "/dashboard/reservas"
      }, 2000)
    } catch (error) {
      console.error("[v0] Reservation error:", error)
      alert("Error al procesar la reserva.")
    } finally {
      setIsReserving(false)
    }
  }

  const canReserveWithMembership = () => {
    if (!userMembership.isActive || !userMembership.tier) return false

    const tierHierarchy: Record<string, number> = {
      petite: 1,
      essentiel: 2,
      signature: 3,
      prive: 4,
    }

    const userTierLevel = tierHierarchy[userMembership.tier] || 0
    const bagTierLevel = tierHierarchy[bag.membership] || 0

    return userTierLevel >= bagTierLevel
  }

  return (
    <div className="min-h-screen bg-white">
      <Dialog open={showReservationSuccess} onOpenChange={setShowReservationSuccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              ¡Reserva Confirmada!
            </DialogTitle>
            <DialogDescription className="pt-2">
              Tu reserva del {bag.brand} {bag.name} ha sido confirmada. Te redirigiremos a tus reservas...
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <Dialog open={showReplaceDialog} onOpenChange={setShowReplaceDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Ya tienes una membresía en el carrito
            </DialogTitle>
            <DialogDescription className="pt-2">
              Solo puedes tener una membresía activa a la vez. ¿Deseas reemplazar la membresía actual por la nueva
              selección?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowReplaceDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmReplace} className="bg-slate-900 hover:bg-slate-800">
              Reemplazar membresía
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto px-4 py-6">
        <Link
          href="/catalog"
          className="inline-flex items-center text-indigo-dark hover:underline mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al catálogo
        </Link>
      </div>

      <div className="container mx-auto px-4 pb-12">
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="relative aspect-square bg-slate-50 rounded-2xl overflow-hidden group">
              {bag.availability.status === "rented" && (
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-10 flex items-center justify-center">
                  <div className="text-center text-white">
                    <p className="text-2xl font-serif mb-2">FUERA CON MIEMBRO</p>
                  </div>
                </div>
              )}
              <Image
                src={bag.images[selectedImage] || "/placeholder.svg"}
                alt={bag.name}
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
                  className={`aspect-square bg-slate-50 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === index
                      ? "border-indigo-dark shadow-md"
                      : "border-transparent hover:border-slate-200"
                  }`}
                >
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={`${bag.name} - vista ${index + 1}`}
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
                  <button className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                    <Share2 className="h-6 w-6 text-slate-400" />
                  </button>
                </div>
              </div>

              <p className="text-lg text-slate-500 mb-1">{bag.brand}</p>
              <h1 className="font-serif text-4xl text-slate-900 mb-2">{bag.name}</h1>

              <p className="text-sm text-slate-500 uppercase tracking-wide mb-2">
                PRECIO DE VENTA ESTIMADO: <span className="text-slate-700">{bag.retailPrice}</span>
              </p>

              {bag.rating && (
                <div className="flex items-center mb-6">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(bag.rating!) ? "fill-yellow-400 text-yellow-400" : "text-slate-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-slate-600">({bag.reviews} reseñas)</span>
                </div>
              )}
            </div>

            {userMembership.isActive ? (
              // User has active membership - show direct reservation
              <div className="space-y-4">
                <div className="p-4 rounded-xl border-2 border-green-500 bg-green-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-800">
                      Membresía {userMembership.tier?.charAt(0).toUpperCase()}
                      {userMembership.tier?.slice(1)} Activa
                    </span>
                  </div>
                  {canReserveWithMembership() ? (
                    <p className="text-sm text-green-700">Puedes reservar este bolso directamente con tu membresía.</p>
                  ) : (
                    <p className="text-sm text-amber-700">
                      Este bolso requiere membresía {bag.membership}. Tu membresía actual es {userMembership.tier}.
                    </p>
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
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Calendar className="h-5 w-5 mr-2" />
                        Reservar Ahora
                      </>
                    )}
                  </Button>
                )}

                {!canReserveWithMembership() && (
                  <Button
                    onClick={() => router.push("/dashboard/membresia")}
                    className="w-full py-6 text-lg bg-rose-pastel hover:bg-rose-pastel/90 text-indigo-dark"
                  >
                    Mejorar Membresía
                  </Button>
                )}
              </div>
            ) : (
              // User doesn't have membership - show membership options
              <div className="space-y-4">
                <h3 className="font-medium text-slate-900">Elige tu membresía</h3>

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
                    Base {membershipOptions.petite.basePrice}€ + Bolso {membershipNames[bag.membership]}{" "}
                    {membershipOptions.petite.bagPass}€
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

            {!userMembership.isActive && bag.availability.status === "available" && (
              <Button
                onClick={handleReserve}
                className="w-full py-6 text-lg bg-indigo-dark hover:bg-indigo-dark/90 text-white"
              >
                Reservar por{" "}
                {selectedMembership === "petite"
                  ? `${(membershipOptions.petite.basePrice + membershipOptions.petite.bagPass).toFixed(2)}€/semana`
                  : selectedMembership === "essentiel"
                    ? `${membershipOptions.essentiel.price}€/mes`
                    : `${membershipOptions["essentiel-quarterly"].price}€/trimestre`}
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

            <p className="text-slate-600 leading-relaxed">{bag.description}</p>

            <div className="flex items-center justify-around py-4 border-y border-slate-100">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Truck className="h-5 w-5 text-[#1a2c4e]" />
                <span>Envío gratis</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Shield className="h-5 w-5 text-[#1a2c4e]" />
                <span>Seguro incluido</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <RotateCcw className="h-5 w-5 text-[#1a2c4e]" />
                <span>Devolución fácil</span>
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
                Características
              </button>
              <button
                onClick={() => setActiveTab("care")}
                className={`pb-4 text-sm font-medium transition-colors ${
                  activeTab === "care"
                    ? "border-b-2 border-[#1a2c4e] text-[#1a2c4e]"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Cuidados
              </button>
            </div>
          </div>

          <div className="py-8">
            {activeTab === "details" && (
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Material</span>
                    <span className="text-slate-900">{bag.material}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Dimensiones</span>
                    <span className="text-slate-900">{bag.dimensions}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Condición</span>
                    <span className="text-slate-900">{bag.condition}</span>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "care" && (
              <div className="space-y-4">
                {bag.careInstructions?.map((instruction, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-[#1a2c4e] flex-shrink-0 mt-0.5" />
                    <span className="text-slate-600">{instruction}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Related bags */}
        {bagsToShow.length > 0 && (
          <div className="mt-16">
            <h2 className="font-serif text-2xl text-slate-900 mb-8">También te puede gustar</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {bagsToShow.slice(0, 4).map((relatedBag) => (
                <Link key={relatedBag.id} href={`/catalog/${relatedBag.id}`} className="group">
                  <div className="aspect-square bg-slate-50 rounded-xl overflow-hidden mb-3">
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
      </div>
    </div>
  )
}

export { BagDetail }

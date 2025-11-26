"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Clock, Shield, Heart, ArrowLeft, ZoomIn, Star, Share2, Truck, RotateCcw, Bell, Check } from "lucide-react"
import Link from "next/link"
import { createBrowserClient } from "@supabase/ssr"

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

const PETITE_BASE_PRICE = 19.99
const PETITE_BAG_PRICES = {
  essentiel: 52,
  signature: 99,
  prive: 137,
}

const MONTHLY_MEMBERSHIP_PRICES = {
  essentiel: { monthly: 59, quarterly: 149 },
  signature: { monthly: 129, quarterly: 329 },
  prive: { monthly: 189, quarterly: 479 },
}

export default function BagDetail({ bag, relatedBags }: BagDetailProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [inWishlist, setInWishlist] = useState(false)
  const [showZoom, setShowZoom] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  const [isAddingToWaitlist, setIsAddingToWaitlist] = useState(false)
  const [isInWaitlist, setIsInWaitlist] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const [selectedMembership, setSelectedMembership] = useState<"petite" | "monthly" | "quarterly">("petite")

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
    }
    checkAuth()
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

  const petiteTotal = PETITE_BASE_PRICE + PETITE_BAG_PRICES[bag.membership]
  const monthlyPrice = MONTHLY_MEMBERSHIP_PRICES[bag.membership].monthly
  const quarterlyPrice = MONTHLY_MEMBERSHIP_PRICES[bag.membership].quarterly
  const quarterlyMonthly = (quarterlyPrice / 3).toFixed(2)
  const quarterlySavings = Math.round((1 - quarterlyPrice / (monthlyPrice * 3)) * 100)

  const getSelectedPrice = () => {
    switch (selectedMembership) {
      case "petite":
        return petiteTotal
      case "monthly":
        return monthlyPrice
      case "quarterly":
        return quarterlyPrice
    }
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
      bgColor: "bg-rose-50/50",
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

  return (
    <div className="min-h-screen bg-white">
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
          {/* Galería de imágenes */}
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

          {/* Panel de información y membresías */}
          <div className="space-y-6">
            {/* Header del bolso */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${membershipColors[bag.membership]}`}
                >
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

              <p className="text-lg text-indigo-dark font-medium mb-1">{bag.brand}</p>
              <h1 className="font-serif text-3xl text-slate-900 mb-3">{bag.name}</h1>

              <p className="text-sm text-slate-500 mb-4">
                PRECIO DE VENTA ESTIMADO: <span className="text-slate-700">{bag.retailPrice}</span>
              </p>

              {bag.rating && (
                <div className="flex items-center mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(bag.rating!) ? "fill-yellow-400 text-yellow-400" : "text-slate-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-slate-600 text-sm">({bag.reviews} reseñas)</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-slate-900 text-lg">Elige tu membresía</h3>

              {/* Tarjeta Petite - Semanal */}
              <div
                onClick={() => setSelectedMembership("petite")}
                className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedMembership === "petite"
                    ? "border-indigo-dark bg-indigo-50/50 shadow-md"
                    : "border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/20"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-slate-900 uppercase tracking-wide">Membresía Petite</h4>
                      <span className="bg-rose-50 text-rose-400 text-xs px-2 py-0.5 rounded-full font-medium">
                        Semanal
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm mb-3">
                      Accede a este bolso por una semana. Perfecto para eventos especiales o para probar antes de
                      comprometerte.
                    </p>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedMembership === "petite" ? "border-indigo-dark bg-indigo-dark" : "border-slate-300"
                        }`}
                      >
                        {selectedMembership === "petite" && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="font-semibold text-slate-900">{petiteTotal.toFixed(2)}€</span>
                      <span className="text-slate-600">/semana</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200/50">
                  <p className="text-xs text-slate-500">
                    Base {PETITE_BASE_PRICE}€ + Bolso {membershipNames[bag.membership]}{" "}
                    {PETITE_BAG_PRICES[bag.membership]}€
                  </p>
                </div>
              </div>

              {/* Tarjeta Mensual */}
              <div
                onClick={() => setSelectedMembership("monthly")}
                className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedMembership === "monthly"
                    ? "border-indigo-dark bg-indigo-50/50 shadow-md"
                    : "border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/20"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-slate-900 uppercase tracking-wide">
                        Membresía {membershipNames[bag.membership]}
                      </h4>
                      <span className="bg-rose-50 text-rose-400 text-xs px-2 py-0.5 rounded-full font-medium">
                        Mensual
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm mb-3">
                      Accede a este bolso y cámbialo por otro de la colección {membershipNames[bag.membership]} cada
                      mes.
                    </p>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedMembership === "monthly" ? "border-indigo-dark bg-indigo-dark" : "border-slate-300"
                        }`}
                      >
                        {selectedMembership === "monthly" && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="font-semibold text-slate-900">{monthlyPrice}€</span>
                      <span className="text-slate-600">/mes</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tarjeta Trimestral */}
              <div
                onClick={() => setSelectedMembership("quarterly")}
                className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedMembership === "quarterly"
                    ? "border-indigo-dark bg-indigo-50/50 shadow-md"
                    : "border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/20"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-slate-900 uppercase tracking-wide">
                        Membresía {membershipNames[bag.membership]}
                      </h4>
                      <span className="bg-rose-50 text-rose-400 text-xs px-2 py-0.5 rounded-full font-medium">
                        Ahorra {quarterlySavings}%
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm mb-3">
                      Accede a la colección {membershipNames[bag.membership]} completa durante 3 meses con descuento
                      especial.
                    </p>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedMembership === "quarterly" ? "border-indigo-dark bg-indigo-dark" : "border-slate-300"
                        }`}
                      >
                        {selectedMembership === "quarterly" && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="font-semibold text-slate-900">{quarterlyPrice}€</span>
                      <span className="text-slate-600">/trimestre</span>
                      <span className="text-slate-400 text-sm">({quarterlyMonthly}€/mes)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col space-y-3 pt-2">
              {bag.availability.status === "available" ? (
                <>
                  <Button
                    className="w-full bg-indigo-dark text-white hover:bg-indigo-dark/90 h-14 text-lg font-medium"
                    onClick={() => {
                      if (isAuthenticated) {
                        window.location.href = `/dashboard/reservas?bag=${bag.id}&membership=${selectedMembership}&price=${getSelectedPrice()}`
                      } else {
                        window.location.href = `/signup?plan=${bag.membership}&bag=${bag.id}&membership=${selectedMembership}`
                      }
                    }}
                  >
                    {selectedMembership === "petite"
                      ? `Reservar por ${petiteTotal.toFixed(2)}€/semana`
                      : selectedMembership === "monthly"
                        ? `Suscribirse por ${monthlyPrice}€/mes`
                        : `Suscribirse por ${quarterlyPrice}€/trimestre`}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-indigo-dark text-indigo-dark hover:bg-indigo-dark hover:text-white h-12 bg-transparent"
                    onClick={() => {
                      const message = `Hola, me interesa consultar sobre el bolso ${bag.brand} ${bag.name}. ¿Podrían darme más información sobre la membresía ${selectedMembership === "petite" ? "Petite (semanal)" : selectedMembership === "monthly" ? "Mensual" : "Trimestral"}?`
                      const whatsappUrl = `https://wa.me/34624239394?text=${encodeURIComponent(message)}`
                      window.open(whatsappUrl, "_blank")
                    }}
                  >
                    Consultar por WhatsApp
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    className="w-full bg-slate-200 text-slate-500 h-14 text-lg font-medium cursor-not-allowed"
                    disabled
                  >
                    Fuera con Miembro
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-indigo-dark text-indigo-dark hover:bg-indigo-dark hover:text-white h-12 bg-transparent"
                    onClick={addToWaitlist}
                    disabled={isAddingToWaitlist || isInWaitlist}
                  >
                    <Bell className="w-5 h-5 mr-2" />
                    {isInWaitlist ? "En Lista de Espera" : "Notificarme cuando esté disponible"}
                  </Button>
                </>
              )}
            </div>

            {/* Disponibilidad */}
            <div className={`p-4 rounded-xl ${availabilityStatus[bag.availability.status].bgColor}`}>
              <div className="flex items-start">
                <Clock className={`h-5 w-5 mr-3 mt-0.5 ${availabilityStatus[bag.availability.status].color}`} />
                <div className="flex-1">
                  <h4 className={`font-semibold text-sm ${availabilityStatus[bag.availability.status].color}`}>
                    {availabilityStatus[bag.availability.status].label}
                  </h4>
                  <p className="text-slate-600 text-sm">{availabilityStatus[bag.availability.status].message}</p>
                </div>
              </div>
            </div>

            {/* Beneficios */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="flex flex-col items-center text-center">
                <Shield className="h-6 w-6 text-indigo-dark mb-2" />
                <p className="font-medium text-slate-900 text-sm">Autenticidad</p>
                <p className="text-slate-500 text-xs">Verificada</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <Truck className="h-6 w-6 text-indigo-dark mb-2" />
                <p className="font-medium text-slate-900 text-sm">Envío gratis</p>
                <p className="text-slate-500 text-xs">24-48h</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <RotateCcw className="h-6 w-6 text-indigo-dark mb-2" />
                <p className="font-medium text-slate-900 text-sm">Devolución</p>
                <p className="text-slate-500 text-xs">Sin coste</p>
              </div>
            </div>

            {/* Tabs de detalles */}
            <div className="border-t pt-6">
              <div className="flex space-x-8 border-b">
                {["details", "features", "care"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-4 text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? "text-indigo-dark border-b-2 border-indigo-dark"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {tab === "details" && "Detalles"}
                    {tab === "features" && "Características"}
                    {tab === "care" && "Cuidados"}
                  </button>
                ))}
              </div>

              <div className="pt-6">
                {activeTab === "details" && (
                  <div className="space-y-6">
                    <p className="text-slate-700 leading-relaxed">{bag.description}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <span className="text-slate-500 text-sm">Color</span>
                          <p className="font-medium text-slate-900">{bag.color}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 text-sm">Material</span>
                          <p className="font-medium text-slate-900">{bag.material}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <span className="text-slate-500 text-sm">Año</span>
                          <p className="font-medium text-slate-900">{bag.year}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 text-sm">Dimensiones</span>
                          <p className="font-medium text-slate-900">{bag.dimensions}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "features" && (
                  <div className="space-y-3">
                    {bag.features.map((feature, index) => (
                      <div key={index} className="flex items-start">
                        <div className="w-1.5 h-1.5 bg-indigo-dark rounded-full mt-2 mr-3 flex-shrink-0" />
                        <p className="text-slate-700 text-sm">{feature}</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "care" && (
                  <div className="space-y-3">
                    {bag.careInstructions.map((instruction, index) => (
                      <div key={index} className="flex items-start">
                        <div className="w-1.5 h-1.5 bg-indigo-dark rounded-full mt-2 mr-3 flex-shrink-0" />
                        <p className="text-slate-700 text-sm">{instruction}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bolsos relacionados */}
        <div className="mt-20">
          <h3 className="font-serif text-3xl text-slate-900 mb-8 text-center">También te puede interesar</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {bagsToShow.map((relatedBag) => (
              <Link href={`/catalog/${relatedBag.id}`} key={relatedBag.id} className="group cursor-pointer">
                <div className="aspect-square bg-slate-50 rounded-xl overflow-hidden mb-4 group-hover:shadow-lg transition-shadow">
                  <Image
                    src={relatedBag.image || "/placeholder.svg"}
                    alt={relatedBag.name}
                    width={300}
                    height={300}
                    className="object-contain w-full h-full p-4 group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="text-center">
                  <p className="text-slate-500 text-sm">{relatedBag.brand}</p>
                  <h4 className="font-serif text-lg text-slate-900 mb-2">{relatedBag.name}</h4>
                  <p className="font-medium text-slate-900">{relatedBag.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de zoom */}
      {showZoom && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowZoom(false)}
        >
          <div className="relative max-w-4xl max-h-full">
            <Image
              src={bag.images[selectedImage] || "/placeholder.svg"}
              alt={bag.name}
              width={800}
              height={800}
              className="object-contain w-full h-full"
            />
            <button
              onClick={() => setShowZoom(false)}
              className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

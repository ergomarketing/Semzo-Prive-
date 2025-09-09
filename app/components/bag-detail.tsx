"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Clock, Shield, Heart, ArrowLeft, ZoomIn, Star, Share2, Truck, RotateCcw } from "lucide-react"
import Link from "next/link"

interface BagDetailProps {
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
    status: "available" | "reserved" | "unavailable"
    date?: string
  }
  features?: string[]
  careInstructions?: string[]
  rating?: number
  reviews?: number
}

export default function BagDetail({ bag }: { bag: BagDetailProps }) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [inWishlist, setInWishlist] = useState(false)
  const [showZoom, setShowZoom] = useState(false)
  const [activeTab, setActiveTab] = useState("details")

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

  const availabilityStatus = {
    available: {
      label: "Disponible",
      color: "text-green-600",
      bgColor: "bg-green-50",
      message: "Este bolso está disponible para reserva inmediata",
    },
    reserved: {
      label: "Reservado",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      message: "Este bolso estará disponible a partir del ",
    },
    unavailable: {
      label: "No disponible",
      color: "text-red-600",
      bgColor: "bg-red-50",
      message: "Este bolso no está disponible actualmente",
    },
  }

  const relatedBags = [
    {
      id: "chanel-classic-flap",
      name: "Classic Flap Medium",
      brand: "Chanel",
      price: "129€/mes",
      image: "/images/catalog/chanel-classic-flap.png",
      membership: "signature",
    },
    {
      id: "dior-lady-dior",
      name: "Lady Dior Medium",
      brand: "Dior",
      price: "129€/mes",
      image: "/images/catalog/dior-lady-dior.png",
      membership: "signature",
    },
    {
      id: "lv-capucines-mm",
      name: "Capucines MM",
      brand: "Louis Vuitton",
      price: "129€/mes",
      image: "/images/catalog/lv-capucines.png",
      membership: "signature",
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navegación superior */}
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
          {/* Galería de imágenes mejorada */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-slate-50 rounded-2xl overflow-hidden group">
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

              {/* Indicadores de imagen */}
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

            {/* Miniaturas */}
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

          {/* Información del producto mejorada */}
          <div className="space-y-8">
            {/* Header del producto */}
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

              <h1 className="font-serif text-4xl text-slate-900 mb-2">{bag.name}</h1>
              <p className="text-2xl text-slate-700 mb-4">{bag.brand}</p>

              {/* Rating */}
              {bag.rating && (
                <div className="flex items-center mb-4">
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

              <div className="flex items-baseline space-x-4">
                <p className="text-3xl font-semibold text-slate-900">{bag.price}</p>
                <p className="text-lg text-slate-500 line-through">{bag.retailPrice}</p>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  Ahorro del 85%
                </span>
              </div>
            </div>

            {/* Estado de disponibilidad */}
            <div className={`p-6 rounded-xl ${availabilityStatus[bag.availability.status].bgColor}`}>
              <div className="flex items-start">
                <Clock className={`h-6 w-6 mr-3 mt-0.5 ${availabilityStatus[bag.availability.status].color}`} />
                <div>
                  <h4 className={`font-semibold mb-2 ${availabilityStatus[bag.availability.status].color}`}>
                    {availabilityStatus[bag.availability.status].label}
                  </h4>
                  <p className="text-slate-700">
                    {availabilityStatus[bag.availability.status].message}
                    {bag.availability.date && bag.availability.status === "reserved" && (
                      <span className="font-medium">{bag.availability.date}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex space-x-4">
              <Button
                className="flex-1 bg-indigo-dark text-white hover:bg-indigo-dark/90 h-14 text-lg font-medium"
                disabled={bag.availability.status !== "available"}
                onClick={() => {
                  if (bag.availability.status === "available") {
                    window.location.href = `/signup?plan=${bag.membership}&bag=${bag.id}`
                  }
                }}
              >
                {bag.availability.status === "available" ? "Reservar ahora" : "No disponible"}
              </Button>
              <Button
                variant="outline"
                className="border-indigo-dark text-indigo-dark hover:bg-indigo-dark hover:text-white h-14 px-6 bg-transparent"
                onClick={() => {
                  const message = `Hola, me interesa consultar sobre el bolso ${bag.brand} ${bag.name} (${bag.id}). ¿Podrían darme más información?`
                  const whatsappUrl = `https://wa.me/34600000000?text=${encodeURIComponent(message)}`
                  window.open(whatsappUrl, "_blank")
                }}
              >
                Consultar
              </Button>
            </div>

            {/* Tabs de información */}
            <div className="border-t pt-8">
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
                    <p className="text-slate-700 leading-relaxed text-lg">{bag.description}</p>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div>
                          <span className="text-slate-500 text-sm">Color</span>
                          <p className="font-medium text-slate-900">{bag.color}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 text-sm">Material</span>
                          <p className="font-medium text-slate-900">{bag.material}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 text-sm">Dimensiones</span>
                          <p className="font-medium text-slate-900">{bag.dimensions}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <span className="text-slate-500 text-sm">Estado</span>
                          <p className="font-medium text-slate-900">{bag.condition}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 text-sm">Año</span>
                          <p className="font-medium text-slate-900">{bag.year}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "features" && (
                  <div className="space-y-4">
                    {bag.features?.map((feature, index) => (
                      <div key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-indigo-dark rounded-full mt-2 mr-3 flex-shrink-0" />
                        <p className="text-slate-700">{feature}</p>
                      </div>
                    )) || (
                      <div className="space-y-4">
                        <div className="flex items-start">
                          <div className="w-2 h-2 bg-indigo-dark rounded-full mt-2 mr-3 flex-shrink-0" />
                          <p className="text-slate-700">Diseño icónico y atemporal</p>
                        </div>
                        <div className="flex items-start">
                          <div className="w-2 h-2 bg-indigo-dark rounded-full mt-2 mr-3 flex-shrink-0" />
                          <p className="text-slate-700">Materiales de la más alta calidad</p>
                        </div>
                        <div className="flex items-start">
                          <div className="w-2 h-2 bg-indigo-dark rounded-full mt-2 mr-3 flex-shrink-0" />
                          <p className="text-slate-700">Perfecto para ocasiones especiales</p>
                        </div>
                        <div className="flex items-start">
                          <div className="w-2 h-2 bg-indigo-dark rounded-full mt-2 mr-3 flex-shrink-0" />
                          <p className="text-slate-700">Compartimentos organizados</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "care" && (
                  <div className="space-y-4">
                    {bag.careInstructions?.map((instruction, index) => (
                      <div key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-indigo-dark rounded-full mt-2 mr-3 flex-shrink-0" />
                        <p className="text-slate-700">{instruction}</p>
                      </div>
                    )) || (
                      <div className="space-y-4">
                        <div className="flex items-start">
                          <div className="w-2 h-2 bg-indigo-dark rounded-full mt-2 mr-3 flex-shrink-0" />
                          <p className="text-slate-700">Evitar el contacto con agua y humedad excesiva</p>
                        </div>
                        <div className="flex items-start">
                          <div className="w-2 h-2 bg-indigo-dark rounded-full mt-2 mr-3 flex-shrink-0" />
                          <p className="text-slate-700">Guardar en lugar seco y ventilado</p>
                        </div>
                        <div className="flex items-start">
                          <div className="w-2 h-2 bg-indigo-dark rounded-full mt-2 mr-3 flex-shrink-0" />
                          <p className="text-slate-700">Limpiar con paño suave y seco</p>
                        </div>
                        <div className="flex items-start">
                          <div className="w-2 h-2 bg-indigo-dark rounded-full mt-2 mr-3 flex-shrink-0" />
                          <p className="text-slate-700">Evitar exposición directa al sol</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Garantías y servicios */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8 border-t">
              <div className="flex items-center space-x-3">
                <Shield className="h-6 w-6 text-indigo-dark" />
                <div>
                  <p className="font-medium text-slate-900 text-sm">Autenticidad</p>
                  <p className="text-slate-600 text-xs">Verificada</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Truck className="h-6 w-6 text-indigo-dark" />
                <div>
                  <p className="font-medium text-slate-900 text-sm">Envío gratis</p>
                  <p className="text-slate-600 text-xs">24-48h</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <RotateCcw className="h-6 w-6 text-indigo-dark" />
                <div>
                  <p className="font-medium text-slate-900 text-sm">Devolución</p>
                  <p className="text-slate-600 text-xs">Sin coste</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Productos relacionados */}
        <div className="mt-20">
          <h3 className="font-serif text-3xl text-slate-900 mb-8 text-center">También te puede interesar</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {relatedBags.map((relatedBag) => (
              <div key={relatedBag.id} className="group cursor-pointer">
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
              </div>
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

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, ShoppingBag, Trash2, Share2 } from "lucide-react"
import Image from "next/image"
import { supabase } from "@/app/lib/supabase"

interface WishlistItem {
  id: string
  name: string
  brand: string
  price: string
  retailPrice: string
  image: string
  membership: "essentiel" | "signature" | "prive"
  availability: boolean
  dateAdded: string
}

export default function WishlistSystem() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadWishlistFromSupabase()
  }, [])

  const loadWishlistFromSupabase = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Load user's wishlist from Supabase
        const { data: wishlist, error } = await supabase.from("wishlists").select("*").eq("user_id", user.id)

        if (error) {
          console.error("Error loading wishlist:", error)
          setDefaultItems()
        } else {
          setWishlistItems(wishlist || [])
        }
      } else {
        setDefaultItems()
      }
    } catch (error) {
      console.error("Error loading wishlist:", error)
      setDefaultItems()
    }
    setIsLoading(false)
  }

  const setDefaultItems = () => {
    // Datos de ejemplo para usuarios no autenticados
    setWishlistItems([
      {
        id: "chanel-classic-flap",
        name: "Classic Flap Medium",
        brand: "Chanel",
        price: "129€/mes",
        retailPrice: "8.200€",
        image: "/placeholder.svg?height=80&width=80",
        membership: "signature",
        availability: true,
        dateAdded: new Date().toISOString().split("T")[0],
      },
    ])
  }

  const removeFromWishlist = async (itemId: string) => {
    if (user) {
      // Remove from Supabase
      await supabase.from("wishlists").delete().eq("user_id", user.id).eq("id", itemId)
    }

    setWishlistItems((prev) => prev.filter((item) => item.id !== itemId))
  }

  const addToWaitingList = (item: WishlistItem) => {
    console.log(`Añadido a lista de espera: ${item.brand} ${item.name}`)
    alert(
      `Te hemos añadido a la lista de espera para ${item.brand} ${item.name}. Te notificaremos cuando esté disponible.`,
    )
  }

  const shareWishlist = () => {
    const wishlistText = wishlistItems.map((item) => `${item.brand} ${item.name}`).join(", ")
    const message = `¡Mira mi wishlist de Semzo Privé! 💎 ${wishlistText}. Descubre bolsos de lujo por suscripción en https://semzoprive.com`

    if (navigator.share) {
      navigator.share({
        title: "Mi Wishlist de Semzo Privé",
        text: message,
        url: "https://semzoprive.com",
      })
    } else {
      navigator.clipboard.writeText(message)
      alert("¡Wishlist copiada al portapapeles!")
    }
  }

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

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return "Fecha no disponible"
      }
      return date.toLocaleDateString()
    } catch (e) {
      console.error("Error formatting date", e)
      return "Fecha no disponible"
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="animate-pulse flex space-x-4">
                <div className="w-20 h-20 bg-slate-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (wishlistItems.length === 0) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="p-8 text-center">
          <Heart className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-serif text-slate-900 mb-2">Tu wishlist está vacía</h3>
          <p className="text-slate-600 mb-4">
            Explora nuestra colección y añade tus bolsos favoritos a tu lista de deseos.
          </p>
          <Button
            className="bg-indigo-dark text-white hover:bg-indigo-dark/90"
            onClick={() => (window.location.href = "/catalog")}
          >
            Explorar Catálogo
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-serif text-indigo-dark">Mi Wishlist</h2>
          <p className="text-slate-600">{wishlistItems.length} bolsos guardados</p>
        </div>
        <Button
          variant="outline"
          onClick={shareWishlist}
          className="border-indigo-dark text-indigo-dark hover:bg-indigo-dark hover:text-white bg-transparent"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Compartir
        </Button>
      </div>

      {/* Wishlist Items */}
      <div className="space-y-4">
        {wishlistItems.map((item) => (
          <Card key={item.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex space-x-4">
                {/* Image */}
                <div className="w-20 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={item.image || "/placeholder.svg?height=80&width=80&query=luxury+bag"}
                    alt={`${item.brand} ${item.name}`}
                    width={80}
                    height={80}
                    className="object-contain w-full h-full p-2"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm text-slate-500">{item.brand}</p>
                      <h3 className="font-serif text-lg text-slate-900 truncate">{item.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${membershipColors[item.membership]}`}
                        >
                          {membershipNames[item.membership]}
                        </span>
                        {!item.availability && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            No disponible
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeFromWishlist(item.id)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-lg font-medium text-slate-900">{item.price}</p>
                      <p className="text-sm text-slate-500">Valor: {item.retailPrice}</p>
                      <p className="text-xs text-slate-400 mt-1">Añadido el {formatDate(item.dateAdded)}</p>
                    </div>
                    <div className="flex gap-2">
                      {item.availability ? (
                        <Button className="bg-indigo-dark text-white hover:bg-indigo-dark/90" size="sm">
                          <ShoppingBag className="h-4 w-4 mr-1" />
                          Reservar
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addToWaitingList(item)}
                          className="border-amber-500 text-amber-700 hover:bg-amber-50"
                        >
                          Lista de espera
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <Card className="border-0 shadow-md bg-slate-50">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-indigo-dark">
                {wishlistItems.filter((item) => item.availability).length}
              </p>
              <p className="text-sm text-slate-600">Disponibles ahora</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">
                {wishlistItems.filter((item) => !item.availability).length}
              </p>
              <p className="text-sm text-slate-600">En lista de espera</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {wishlistItems
                  .reduce((total, item) => {
                    const retailPrice = Number.parseInt(item.retailPrice.replace(/[€.,]/g, ""))
                    const monthlyPrice = Number.parseInt(item.price.replace(/[€/mes.,]/g, ""))
                    return total + (retailPrice - monthlyPrice * 12)
                  }, 0)
                  .toLocaleString()}
                €
              </p>
              <p className="text-sm text-slate-600">Ahorro potencial anual</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

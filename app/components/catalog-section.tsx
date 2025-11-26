"use client"
import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Heart, ShoppingBag, Info } from "lucide-react"
import { supabase } from "../lib/supabaseClient"
import { useAuth } from "../hooks/useAuth"

interface BagItem {
  id: string
  name: string
  brand: string
  description: string
  retail_price: number
  image_url: string
  category: string
  condition: string
  status: string
  membership_type: string // usar membership_type de la base de datos
}

const MEMBERSHIP_PRICES: Record<string, number> = {
  essentiel: 59,
  signature: 129,
  prive: 189,
}

export default function CatalogSection() {
  const { user } = useAuth()
  const [wishlist, setWishlist] = useState<string[]>([])
  const [bags, setBags] = useState<BagItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadBags = async () => {
      try {
        const { data, error } = await supabase
          .from("bags")
          .select("*")
          .eq("status", "available")
          .order("brand", { ascending: true })

        if (error) throw error

        if (data) {
          setBags(data)
        }
      } catch (error) {
        console.error("Error loading bags:", error)
      } finally {
        setLoading(false)
      }
    }

    loadBags()
  }, [])

  useEffect(() => {
    const loadWishlist = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase.from("wishlists").select("bag_id").eq("user_id", user.id)

        if (error) throw error

        if (data) {
          setWishlist(data.map((item) => item.bag_id))
        }
      } catch (error) {
        console.error("Error loading wishlist:", error)
      }
    }

    loadWishlist()
  }, [user])

  const toggleWishlist = async (id: string) => {
    if (!user) {
      window.location.href = "/auth/login"
      return
    }

    try {
      if (wishlist.includes(id)) {
        const { error } = await supabase.from("wishlists").delete().eq("user_id", user.id).eq("bag_id", id)

        if (error) throw error

        setWishlist(wishlist.filter((itemId) => itemId !== id))
      } else {
        const { error } = await supabase.from("wishlists").insert({
          user_id: user.id,
          bag_id: id,
          created_at: new Date().toISOString(),
        })

        if (error) throw error

        setWishlist([...wishlist, id])
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error)
    }
  }

  const essentielBags = bags.filter((bag) => bag.membership_type === "essentiel")
  const signatureBags = bags.filter((bag) => bag.membership_type === "signature")
  const priveBags = bags.filter((bag) => bag.membership_type === "prive")

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-lg text-slate-600">Cargando catálogo...</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-serif font-light text-slate-900 mb-4">Nuestra Colección</h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Descubre nuestra selección de bolsos de lujo disponibles para cada nivel de membresía. Todos los bolsos son
            auténticos y han sido cuidadosamente seleccionados por nuestros expertos.
          </p>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="bg-slate-100">
              <TabsTrigger value="all" className="text-sm">
                Todos los bolsos
              </TabsTrigger>
              <TabsTrigger value="essentiel" className="text-sm">
                L'Essentiel
              </TabsTrigger>
              <TabsTrigger value="signature" className="text-sm">
                Signature
              </TabsTrigger>
              <TabsTrigger value="prive" className="text-sm">
                Privé
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {bags.map((bag) => (
                <BagCard
                  key={bag.id}
                  bag={bag}
                  inWishlist={wishlist.includes(bag.id)}
                  onToggleWishlist={toggleWishlist}
                  membershipTier={(bag.membership_type || "essentiel") as "essentiel" | "signature" | "prive"}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="essentiel">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {essentielBags.map((bag) => (
                <BagCard
                  key={bag.id}
                  bag={bag}
                  inWishlist={wishlist.includes(bag.id)}
                  onToggleWishlist={toggleWishlist}
                  membershipTier="essentiel"
                />
              ))}
            </div>
            <div className="mt-12 p-6 bg-rose-nude/10 rounded-lg">
              <h3 className="font-serif text-xl text-slate-900 mb-4">Membresía L'Essentiel</h3>
              <p className="text-slate-700 mb-4">
                Con nuestra membresía L'Essentiel por solo 59€/mes, puedes disfrutar de estos elegantes bolsos y muchos
                más. La introducción perfecta al mundo de los bolsos de lujo.
              </p>
              <Button className="bg-indigo-dark text-white hover:bg-indigo-dark/90">
                <Link href="/signup?plan=essentiel">Suscribirse a L'Essentiel</Link>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="signature">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {signatureBags.map((bag) => (
                <BagCard
                  key={bag.id}
                  bag={bag}
                  inWishlist={wishlist.includes(bag.id)}
                  onToggleWishlist={toggleWishlist}
                  membershipTier="signature"
                />
              ))}
            </div>
            <div className="mt-12 p-6 bg-rose-pastel/20 rounded-lg">
              <h3 className="font-serif text-xl text-slate-900 mb-4">Membresía Signature</h3>
              <p className="text-slate-700 mb-4">
                Nuestra membresía Signature por 129€/mes te da acceso a bolsos de mayor valor y exclusividad. La
                experiencia preferida por nuestras clientas más exigentes.
              </p>
              <Button className="bg-indigo-dark text-white hover:bg-indigo-dark/90">
                <Link href="/signup?plan=signature">Suscribirse a Signature</Link>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="prive">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {priveBags.map((bag) => (
                <BagCard
                  key={bag.id}
                  bag={bag}
                  inWishlist={wishlist.includes(bag.id)}
                  onToggleWishlist={toggleWishlist}
                  membershipTier="prive"
                />
              ))}
            </div>
            <div className="mt-12 p-6 bg-indigo-dark/10 rounded-lg">
              <h3 className="font-serif text-xl text-slate-900 mb-4">Membresía Privé</h3>
              <p className="text-slate-700 mb-4">
                La membresía Privé por 189€/mes ofrece acceso a nuestros bolsos más exclusivos y codiciados. La
                experiencia definitiva para verdaderas conocedoras.
              </p>
              <Button className="bg-indigo-dark text-white hover:bg-indigo-dark/90">
                <Link href="/signup?plan=prive">Suscribirse a Privé</Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}

function BagCard({
  bag,
  inWishlist,
  onToggleWishlist,
  membershipTier,
}: {
  bag: BagItem
  inWishlist: boolean
  onToggleWishlist: (id: string) => void
  membershipTier: "essentiel" | "signature" | "prive"
}) {
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

  const monthlyPrice = MEMBERSHIP_PRICES[membershipTier] || 59

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md relative group">
      <div className="absolute top-3 left-3 z-20">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${membershipColors[membershipTier]}`}>
          {membershipNames[membershipTier]}
        </span>
      </div>

      <div className="absolute top-3 right-3 z-20">
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onToggleWishlist(bag.id)
          }}
          className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors"
        >
          <Heart className={`h-5 w-5 ${inWishlist ? "fill-rose-500 text-rose-500" : "text-slate-600"}`} />
        </button>
      </div>

      <div className="relative aspect-square bg-gray-50">
        <Image
          src={bag.image_url || "/placeholder.svg"}
          alt={`${bag.brand} ${bag.name}`}
          width={500}
          height={500}
          className="object-contain w-full h-full p-4"
        />
      </div>

      <div className="p-4">
        <p className="text-sm text-slate-500">{bag.brand}</p>
        <h3 className="font-serif text-xl text-indigo-dark mb-2">{bag.name}</h3>
        <div className="mb-4">
          <p className="text-lg font-medium text-indigo-dark">{monthlyPrice}€/mes</p>
          {bag.retail_price && bag.retail_price > 0 && (
            <p className="text-sm text-slate-500">Valor: {bag.retail_price}€</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link href={`/catalog/${bag.id}`} className="block">
            <Button
              variant="outline"
              className="w-full border-indigo-dark text-indigo-dark hover:bg-indigo-dark hover:text-white transition-colors bg-transparent"
            >
              <Info className="h-4 w-4 mr-2" />
              Detalles
            </Button>
          </Link>
          <Link href={`/signup?plan=${membershipTier}&bag=${bag.id}`} className="block">
            <Button className="w-full bg-indigo-dark text-white hover:bg-indigo-dark/90 transition-colors">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Reservar
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

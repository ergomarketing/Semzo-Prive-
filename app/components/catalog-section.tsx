"use client"
import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Heart, ShoppingBag, Info } from "lucide-react"
import { getSupabaseBrowser } from "../lib/supabase"
import { useAuth } from "../hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { addToWaitlist } from "@/lib/waitlistFunctions" // Declare or import the addToWaitlist function
import { useCart } from "@/app/contexts/cart-context"
import { useRouter } from "next/navigation"

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
  membership_type: string
  images?: string[]
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
  const { addItem } = useCart()
  const router = useRouter()

  const supabase = useMemo(() => getSupabaseBrowser(), [])

  useEffect(() => {
    const loadBags = async () => {
      if (!supabase) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase.from("bags").select("*").order("brand", { ascending: true })

        if (error) throw error

        if (data) {
          console.log(
            "[v0] Bolsos cargados:",
            data.map((b) => ({
              name: b.name,
              membership_type: b.membership_type,
            })),
          )
          setBags(data)
        }
      } catch (error) {
        console.error("Error loading bags:", error)
      } finally {
        setLoading(false)
      }
    }

    loadBags()
  }, [supabase])

  useEffect(() => {
    const loadWishlist = async () => {
      if (!user?.id || !supabase) {
        setWishlist([])
        return
      }

      try {
        const { data, error } = await supabase.from("wishlists").select("bag_id").eq("user_id", user.id)

        if (error) {
          console.warn("Could not load wishlist:", error.message)
          setWishlist([])
          return
        }

        if (data) {
          setWishlist(data.map((item) => item.bag_id))
        }
      } catch (error) {
        console.warn("Error loading wishlist:", error)
        setWishlist([])
      }
    }

    loadWishlist()
  }, [user, supabase])

  const toggleWishlist = async (id: string) => {
    if (!user || !supabase) {
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
                  user={user}
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
                  user={user}
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
                  user={user}
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
                  user={user}
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
  user,
}: {
  bag: any
  inWishlist: boolean
  onToggleWishlist: (id: string) => void
  membershipTier: "essentiel" | "signature" | "prive"
  user: any
}) {
  const [isAddingToWaitlist, setIsAddingToWaitlist] = useState(false)
  const [isInWaitlist, setIsInWaitlist] = useState(false)
  const [isReserving, setIsReserving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showPassSelector, setShowPassSelector] = useState(false)
  const [availablePasses, setAvailablePasses] = useState<any[]>([])
  const [selectedPassId, setSelectedPassId] = useState<string | null>(null)
  const [userMembership, setUserMembership] = useState<string | null>(null)

  const { toast } = useToast()
  const { addItem } = useCart()
  const router = useRouter()

  const supabase = useMemo(() => getSupabaseBrowser(), [])

  const isAvailable = bag.status === "available"

  useEffect(() => {
    const loadUserMembership = async () => {
      if (!user || !supabase) return

      try {
        const { data: membership } = await supabase
          .from("user_memberships")
          .select("membership_type")
          .eq("user_id", user.id)
          .maybeSingle()

        const { data: profile } = await supabase.from("profiles").select("membership_type").eq("id", user.id).single()

        setUserMembership((membership?.membership_type || profile?.membership_type || "free").toLowerCase())
      } catch (error) {
        console.error("[v0] Error loading user membership:", error)
      }
    }

    loadUserMembership()
  }, [user, supabase])

  useEffect(() => {
    const checkWaitlist = async () => {
      if (!user || isAvailable || !supabase) return

      try {
        const { data } = await supabase
          .from("waitlist")
          .select("id")
          .eq("user_id", user.id)
          .eq("bag_id", bag.id)
          .maybeSingle()

        setIsInWaitlist(!!data)
      } catch {
        // No está en la lista
      }
    }
    checkWaitlist()
  }, [user, bag.id, isAvailable, supabase])

  const checkIfNeedsPass = async (): Promise<boolean> => {
    if (!user || !userMembership) return false

    const bagTier = bag.membership_type?.toLowerCase() || "essentiel"

    if (userMembership === "petite" && ["essentiel", "signature", "prive"].includes(bagTier)) {
      return true
    }

    if (userMembership === "free") {
      return false
    }

    if (userMembership === "prive") return false
    if (userMembership === "signature" && bagTier !== "prive") return false
    if (userMembership === "essentiel" && bagTier === "essentiel") return false

    return false
  }

  const loadAvailablePasses = async () => {
    if (!user || !supabase) return []

    const bagTier = bag.membership_type?.toLowerCase() || "essentiel"

    try {
      const { data: passes, error } = await supabase
        .from("bag_passes")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "available")
        .eq("pass_tier", bagTier)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Error loading passes:", error)
        return []
      }

      return passes || []
    } catch (error) {
      console.error("[v0] Error loading passes:", error)
      return []
    }
  }

  const handleQuickReserve = async () => {
    if (!user) {
      window.location.href = "/auth/login"
      return
    }

    const needsPass = await checkIfNeedsPass()

    if (needsPass) {
      const passes = await loadAvailablePasses()
      setAvailablePasses(passes)

      if (passes.length === 0) {
        const tierNames = { essentiel: "L'Essentiel", signature: "Signature", prive: "Privé" }
        const tierPrices = { essentiel: 52, signature: 99, prive: 137 }
        const bagTier = bag.membership_type?.toLowerCase() || "essentiel"

        const bagPassItem = {
          id: `bag-pass-${bag.id}-${Date.now()}`,
          name: `Pase Bolso ${tierNames[bagTier as keyof typeof tierNames]}`,
          price: `${tierPrices[bagTier as keyof typeof tierPrices]}€`,
          billingCycle: "weekly" as const,
          description: `${bag.brand} ${bag.name}`,
          image: bag.images?.[0] || "/placeholder.svg?height=200&width=200",
          brand: bag.brand,
          itemType: "bag-pass" as const,
        }

        addItem(bagPassItem)

        toast({
          title: "🎫 Pase agregado al carrito",
          description: `Completa tu compra para reservar este bolso ${tierNames[bagTier as keyof typeof tierNames]}.`,
          duration: 3000,
        })

        setTimeout(() => {
          router.push("/cart")
        }, 500)

        return
      }

      setShowPassSelector(true)
      return
    }

    await executeReservation(null)
  }

  const executeReservation = async (passId: string | null) => {
    setIsReserving(true)
    setShowPassSelector(false)

    try {
      console.log("[v0] Creating reservation from catalog for user:", user.id, "bag:", bag.id, "pass:", passId)

      const startDate = new Date()
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      const requestBody: any = {
        bag_id: bag.id,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      }

      if (passId) {
        requestBody.usePassId = passId
      }

      const response = await fetch("/api/user/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (!response.ok) {
        if (
          data.error?.includes("requiere una membresía") ||
          data.error?.includes("Actualiza tu membresía") ||
          data.requiresPass
        ) {
          setIsReserving(false)
          toast({
            title: "🌟 Actualiza tu membresía",
            description: data.error,
            action: (
              <Button
                size="sm"
                onClick={() => {
                  window.location.href = "/membresias"
                }}
                className="bg-indigo-dark text-white hover:bg-indigo-dark/90"
              >
                Ver Membresías
              </Button>
            ),
            duration: 8000,
          })
          return
        }
        throw new Error(data.error || "Error al crear la reserva")
      }

      setShowSuccess(true)
      setIsReserving(false)

      toast({
        title: "¡Reserva creada!",
        description: "Tu reserva ha sido creada exitosamente. Redirigiendo...",
        duration: 2000,
      })

      setTimeout(() => {
        window.location.href = "/dashboard/reservas"
      }, 1500)
    } catch (error: any) {
      setIsReserving(false)

      toast({
        variant: "destructive",
        title: "Error al crear reserva",
        description: error.message || "Por favor intenta de nuevo o contacta soporte.",
        duration: 5000,
      })
    }
  }

  const addToWaitlistHandler = async () => {
    if (!user || !supabase) {
      window.location.href = "/auth/login"
      return
    }

    setIsAddingToWaitlist(true)
    const success = await addToWaitlist(user.id, bag.id)

    if (success) {
      setIsInWaitlist(true)
    }
    setIsAddingToWaitlist(false)
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

  const monthlyPrice = MEMBERSHIP_PRICES[membershipTier] || 59

  return (
    <>
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

        {!isAvailable && (
          <div className="text-center py-2 border-b border-slate-200">
            <p className="text-sm font-medium tracking-widest text-slate-400">FUERA CON MIEMBRO</p>
          </div>
        )}

        <div className="p-4">
          <p className="text-sm text-slate-500">{bag.brand}</p>
          <h3 className="font-serif text-xl text-indigo-dark mb-2">{bag.name}</h3>
          <div className="mb-4">
            <p className="text-lg font-medium text-indigo-dark">{monthlyPrice}€/mes</p>
            {bag.retail_price && bag.retail_price > 0 && (
              <p className="text-sm text-slate-500">Valor: {bag.retail_price}€</p>
            )}
          </div>

          {showSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-sm text-green-800 font-medium">¡Reserva creada exitosamente!</p>
              <p className="text-xs text-green-600 mt-1">Redirigiendo a tus reservas...</p>
            </div>
          )}

          {isAvailable ? (
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
              <Button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleQuickReserve()
                }}
                disabled={isReserving}
                className="w-full bg-indigo-dark text-white hover:bg-indigo-dark/90 transition-colors disabled:opacity-50"
              >
                {isReserving ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⏳</span>
                    Procesando...
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Reservar
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Button
                disabled
                className="w-full bg-indigo-200 text-indigo-dark/70 cursor-not-allowed hover:bg-indigo-200"
              >
                FUERA CON MIEMBRO
              </Button>
              <Button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  addToWaitlistHandler()
                }}
                disabled={isAddingToWaitlist || isInWaitlist}
                variant="outline"
                className="w-full border-indigo-dark text-indigo-dark hover:bg-indigo-dark/5 transition-colors"
              >
                <Heart className={`h-4 w-4 mr-2 ${isInWaitlist ? "fill-rose-500 text-rose-500" : ""}`} />
                {isInWaitlist ? "En Lista de Espera" : "NOTIFICARME"}
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showPassSelector} onOpenChange={setShowPassSelector}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Selecciona un Pase de Bolso</DialogTitle>
            <DialogDescription>
              Tienes {availablePasses.length} pase{availablePasses.length !== 1 ? "s" : ""} disponible
              {availablePasses.length !== 1 ? "s" : ""} para esta categoría
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {availablePasses.map((pass) => (
              <button
                key={pass.id}
                onClick={() => setSelectedPassId(pass.id)}
                className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                  selectedPassId === pass.id
                    ? "border-indigo-dark bg-indigo-50"
                    : "border-slate-200 hover:border-indigo-dark/50"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-slate-900">
                      Pase{" "}
                      {pass.pass_tier === "essentiel"
                        ? "L'Essentiel"
                        : pass.pass_tier === "signature"
                          ? "Signature"
                          : "Privé"}
                    </p>
                    <p className="text-sm text-slate-600">
                      Comprado: {new Date(pass.purchased_at).toLocaleDateString("es-ES")}
                    </p>
                    {pass.expires_at && (
                      <p className="text-xs text-slate-500">
                        Expira: {new Date(pass.expires_at).toLocaleDateString("es-ES")}
                      </p>
                    )}
                  </div>
                  {selectedPassId === pass.id && (
                    <div className="w-6 h-6 rounded-full bg-indigo-dark flex items-center justify-center">
                      <span className="text-white text-sm">✓</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowPassSelector(false)
                setSelectedPassId(null)
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => executeReservation(selectedPassId)}
              disabled={!selectedPassId || isReserving}
              className="flex-1 bg-indigo-dark text-white hover:bg-indigo-dark/90"
            >
              {isReserving ? "Procesando..." : "Confirmar Reserva"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

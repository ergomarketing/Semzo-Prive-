"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, LogOut, ShoppingBag, Loader2, Edit, Save, X, MapPin } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface ShippingInfo {
  shipping_address: string
  shipping_city: string
  shipping_postal_code: string
  shipping_phone: string
  shipping_country: string
}

export default function Dashboard() {
  const router = useRouter()
  const { user, loading, signOut } = useAuth()
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)
  const [isEditingShipping, setIsEditingShipping] = useState(false)
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    shipping_address: "",
    shipping_city: "",
    shipping_postal_code: "",
    shipping_phone: "",
    shipping_country: "España",
  })
  const [loadingShipping, setLoadingShipping] = useState(false)
  const [savingShipping, setSavingShipping] = useState(false)
  const [shippingFetched, setShippingFetched] = useState(false)

  const membershipType = user?.user_metadata?.membership_status || "free"
  const isPremium = membershipType === "premium" || membershipType === "prive"

  useEffect(() => {
    if (!loading) {
      setHasCheckedAuth(true)
      if (!user) {
        router.push("/auth/login")
      }
    }
  }, [user, loading, router])

  const fetchShippingInfo = useCallback(async () => {
    if (!user || shippingFetched || loadingShipping) return

    setLoadingShipping(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        console.error("No access token available")
        return
      }

      const response = await fetch("/api/user/shipping", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        if (response.status === 429) {
          console.warn("Rate limited, will retry later")
          return
        }
        throw new Error(`HTTP ${response.status}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.warn("Non-JSON response received, skipping")
        return
      }

      const data = await response.json()
      if (data.shipping) {
        setShippingInfo({
          shipping_address: data.shipping.shipping_address || "",
          shipping_city: data.shipping.shipping_city || "",
          shipping_postal_code: data.shipping.shipping_postal_code || "",
          shipping_phone: data.shipping.shipping_phone || "",
          shipping_country: data.shipping.shipping_country || "España",
        })
      }
      setShippingFetched(true)
    } catch (error) {
      console.error("Error fetching shipping info:", error)
    } finally {
      setLoadingShipping(false)
    }
  }, [user, shippingFetched]) // Removed getAuthToken dependency

  useEffect(() => {
    if (user && !shippingFetched) {
      fetchShippingInfo()
    }
  }, [user, shippingFetched, fetchShippingInfo])

  const handleSaveShipping = async () => {
    setSavingShipping(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        console.error("No access token available for saving")
        return
      }

      const response = await fetch("/api/user/shipping", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(shippingInfo),
      })

      if (response.ok) {
        setIsEditingShipping(false)
        const urlParams = new URLSearchParams(window.location.search)
        const pendingPlan = urlParams.get("plan")
        if (pendingPlan) {
          console.log("[v0] Redirecting to checkout with plan:", pendingPlan)
          router.push(`/checkout?plan=${pendingPlan}`)
        }
      } else {
        const error = await response.json()
        console.error("Error saving shipping info:", error)
      }
    } catch (error) {
      console.error("Error saving shipping info:", error)
    } finally {
      setSavingShipping(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditingShipping(false)
  }

  const handleLogout = async () => {
    await signOut()
    router.push("/")
  }

  const handleViewCatalog = () => {
    router.push("/catalog")
  }

  const handleViewWishlist = () => {
    router.push("/wishlist")
  }

  const handleViewRecommendations = () => {
    router.push("/recommendations")
  }

  const handleViewReservations = () => {
    router.push("/reservations")
  }

  if (loading || !hasCheckedAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin h-8 w-8 text-slate-600" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <h1 className="text-3xl font-serif text-slate-900 tracking-wide">Semzo Privé</h1>
            </div>
            <div className="flex items-center space-x-6">
              <span className="text-sm font-medium text-slate-700 font-serif">
                Hola, {user.user_metadata?.first_name || user.email?.split("@")[0]}
              </span>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-slate-300 text-slate-700 hover:bg-slate-100 bg-transparent"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-serif text-slate-900 mb-4">
            ¡Bienvenido, {user.user_metadata?.first_name || "Usuario"}!
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">Accede a tu colección de bolsos de lujo</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Personal Information Card */}
          <Card className="relative overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url('/valentino-brown-handbag.png')`,
                filter: "blur(1px)",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-slate-800/80 to-slate-700/85" />
            <div className="relative z-10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-lg font-serif text-white">Información Personal</CardTitle>
                <User className="h-5 w-5 text-white/70" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-white/90">
                    <span className="font-semibold text-white font-serif">Email:</span> {user.email}
                  </p>
                  <p className="text-sm text-white/90">
                    <span className="font-semibold text-white font-serif">Nombre:</span>{" "}
                    {user.user_metadata?.first_name || ""} {user.user_metadata?.last_name || ""}
                  </p>
                  {user.user_metadata?.phone && (
                    <p className="text-sm text-white/90">
                      <span className="font-semibold text-white font-serif">Teléfono:</span> {user.user_metadata.phone}
                    </p>
                  )}
                  <p className="text-sm text-white/90">
                    <span className="font-semibold text-white font-serif">Estado:</span>
                    <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800 border-green-200">
                      {user.email_confirmed_at ? "Confirmado" : "Pendiente"}
                    </Badge>
                  </p>
                </div>
              </CardContent>
            </div>
          </Card>

          <Card className="relative overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url('/beige-quilted-handbag.png')`,
                filter: "blur(1px)",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-rose-100/90 via-rose-50/85 to-pink-50/90" />
            <div className="relative z-10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-lg font-serif text-slate-900">Dirección de Envío</CardTitle>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-slate-600" />
                  {!isEditingShipping && (
                    <Button
                      onClick={() => setIsEditingShipping(true)}
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-white/50"
                    >
                      <Edit className="h-4 w-4 text-slate-600" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loadingShipping ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="animate-spin h-5 w-5 text-slate-600" />
                  </div>
                ) : isEditingShipping ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="address" className="text-sm font-serif text-slate-700">
                        Dirección
                      </Label>
                      <Input
                        id="address"
                        value={shippingInfo.shipping_address}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, shipping_address: e.target.value })}
                        placeholder="Calle, número, piso..."
                        className="bg-white/80 border-slate-300"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="city" className="text-sm font-serif text-slate-700">
                          Ciudad
                        </Label>
                        <Input
                          id="city"
                          value={shippingInfo.shipping_city}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, shipping_city: e.target.value })}
                          placeholder="Madrid"
                          className="bg-white/80 border-slate-300"
                        />
                      </div>
                      <div>
                        <Label htmlFor="postal" className="text-sm font-serif text-slate-700">
                          C.P.
                        </Label>
                        <Input
                          id="postal"
                          value={shippingInfo.shipping_postal_code}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, shipping_postal_code: e.target.value })}
                          placeholder="28001"
                          className="bg-white/80 border-slate-300"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-sm font-serif text-slate-700">
                        Teléfono
                      </Label>
                      <Input
                        id="phone"
                        value={shippingInfo.shipping_phone}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, shipping_phone: e.target.value })}
                        placeholder="+34 600 000 000"
                        className="bg-white/80 border-slate-300"
                      />
                    </div>
                    <div className="flex space-x-2 pt-2">
                      <Button
                        onClick={handleSaveShipping}
                        size="sm"
                        disabled={savingShipping}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-serif flex-1"
                      >
                        {savingShipping ? (
                          <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Guardar
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        size="sm"
                        variant="outline"
                        className="border-slate-300 text-slate-700 hover:bg-white/80 bg-transparent"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {shippingInfo.shipping_address ? (
                      <>
                        <p className="text-sm text-slate-700 font-medium">{shippingInfo.shipping_address}</p>
                        <p className="text-sm text-slate-600">
                          {shippingInfo.shipping_city}, {shippingInfo.shipping_postal_code}
                        </p>
                        <p className="text-sm text-slate-600">{shippingInfo.shipping_country}</p>
                        <p className="text-sm text-slate-600">Tel: {shippingInfo.shipping_phone}</p>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-slate-600 mb-3">No has configurado tu dirección de envío</p>
                        <Button
                          onClick={() => setIsEditingShipping(true)}
                          size="sm"
                          className="bg-slate-900 hover:bg-slate-800 text-white font-serif"
                        >
                          Agregar Dirección
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </div>
          </Card>

          {/* Membership Status Card */}
          <Card className="relative overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url('/pink-quilted-floral-handbag.png')`,
                filter: "blur(1px)",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-100/90 via-slate-50/85 to-white/90" />
            <div className="relative z-10">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-serif text-slate-900">Estado de Membresía</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3 mb-3">
                  <Badge
                    variant="secondary"
                    className={`capitalize px-3 py-1 font-serif ${
                      isPremium ? "bg-slate-900 text-white" : "bg-white/80 text-slate-700 border-slate-200"
                    }`}
                  >
                    {isPremium ? "Privé" : "Free"}
                  </Badge>
                </div>
                <p className="text-sm text-slate-700 mb-4 font-medium">
                  {isPremium ? "Acceso completo a la colección" : "Acceso básico a la colección"}
                </p>
                {!isPremium && (
                  <Button
                    onClick={() => router.push("/membership/upgrade")}
                    size="sm"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-serif shadow-lg"
                  >
                    Upgrade a Privé
                  </Button>
                )}
                <div className="mt-3">
                  <Button
                    onClick={handleViewCatalog}
                    size="sm"
                    className="w-full justify-start bg-slate-900 hover:bg-slate-800 text-white font-serif shadow-lg"
                  >
                    <ShoppingBag className="w-4 h-4 mr-3" />
                    Ver Catálogo
                  </Button>
                </div>
              </CardContent>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Reservations Card */}
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-serif text-slate-900">Últimas Reservas</CardTitle>
              <CardDescription className="text-slate-600">Tus reservas más recientes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-slate-600 mb-4">No tienes reservas recientes</p>
                <Button
                  onClick={() => router.push("/catalog")}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-serif"
                >
                  Explorar Catálogo
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations Card */}
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-serif text-slate-900">Recomendaciones</CardTitle>
              <CardDescription className="text-slate-600">Bolsos seleccionados para ti</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-slate-600 mb-4">Explora nuestro catálogo para ver recomendaciones personalizadas</p>
                <Button
                  onClick={() => router.push("/recommendations")}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-serif"
                >
                  Ver Recomendaciones
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, LogOut, ShoppingBag, Heart, Loader2 } from "lucide-react"

export default function Dashboard() {
  const router = useRouter()
  const { user, loading, signOut } = useAuth()

  const membershipType = user?.user_metadata?.membership_status || "free"
  const isPremium = membershipType === "premium" || membershipType === "prive"

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

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

  const handleUpgradeMembership = () => {
    router.push("/membership/upgrade")
  }

  const handleViewReservations = () => {
    router.push("/reservations")
  }

  if (loading) {
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

          {/* Membership Status Card */}
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
                <CardTitle className="text-lg font-serif text-slate-900">Estado de Membresía</CardTitle>
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
                    onClick={handleUpgradeMembership}
                    size="sm"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-serif shadow-lg"
                  >
                    Upgrade a Privé
                  </Button>
                )}
              </CardContent>
            </div>
          </Card>

          {/* Quick Actions Card */}
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
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-lg font-serif text-slate-900">Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    onClick={handleViewCatalog}
                    size="sm"
                    className="w-full justify-start bg-slate-900 hover:bg-slate-800 text-white font-serif shadow-lg"
                  >
                    <ShoppingBag className="w-4 h-4 mr-3" />
                    Ver Catálogo
                  </Button>
                  <Button
                    onClick={handleViewWishlist}
                    size="sm"
                    variant="outline"
                    className="w-full justify-start border-slate-300 text-slate-700 hover:bg-white/80 font-serif bg-white/60 backdrop-blur-sm shadow-lg"
                  >
                    <Heart className="w-4 h-4 mr-3" />
                    Mi Lista de Deseos
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
                <Button onClick={handleViewCatalog} className="bg-slate-900 hover:bg-slate-800 text-white font-serif">
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
                  onClick={handleViewRecommendations}
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

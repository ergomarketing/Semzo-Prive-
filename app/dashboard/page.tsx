"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, LogOut, Settings, ShoppingBag, Heart, Gift, Loader2 } from "lucide-react"

export default function Dashboard() {
  const router = useRouter()
  const { user, loading, signOut } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  const handleLogout = async () => {
    await signOut()
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rose-50/20">
        <Loader2 className="animate-spin h-8 w-8 text-slate-600" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-rose-50/20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-rose-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <h1 className="text-3xl font-serif text-slate-800 tracking-wide">Semzo Privé</h1>
            </div>
            <div className="flex items-center space-x-6">
              <span className="text-sm font-medium text-slate-600">
                Hola, {user.user_metadata?.first_name || user.email?.split("@")[0]}
              </span>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all duration-200 bg-transparent"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h2 className="text-4xl font-serif text-slate-800 mb-3 tracking-wide">
            ¡Bienvenido, {user.user_metadata?.first_name || "Usuario"}!
          </h2>
          <p className="text-lg text-slate-600 font-light">Accede a tu colección exclusiva de bolsos de lujo</p>
        </div>

        {/* User Info Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card className="border-rose-100/50 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base font-semibold text-slate-700">Información Personal</CardTitle>
              <User className="h-5 w-5 text-rose-400" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  <span className="font-medium text-slate-700">Email:</span> {user.email}
                </p>
                <p className="text-sm text-slate-600">
                  <span className="font-medium text-slate-700">Nombre:</span> {user.user_metadata?.first_name || ""}{" "}
                  {user.user_metadata?.last_name || ""}
                </p>
                {user.user_metadata?.phone && (
                  <p className="text-sm text-slate-600">
                    <span className="font-medium text-slate-700">Teléfono:</span> {user.user_metadata.phone}
                  </p>
                )}
                <p className="text-sm text-slate-600">
                  <span className="font-medium text-slate-700">Estado:</span>
                  <Badge variant="secondary" className="ml-2 bg-green-50 text-green-700 border-green-200">
                    {user.email_confirmed_at ? "Confirmado" : "Pendiente"}
                  </Badge>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-rose-100/50 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base font-semibold text-slate-700">Estado de Membresía</CardTitle>
              <Gift className="h-5 w-5 text-rose-400" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3 mb-3">
                <Badge
                  variant={user.user_metadata?.membership_status === "premium" ? "default" : "secondary"}
                  className={`capitalize px-3 py-1 ${
                    user.user_metadata?.membership_status === "premium"
                      ? "bg-rose-100 text-rose-700 border-rose-200"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {user.user_metadata?.membership_status || "Free"}
                </Badge>
              </div>
              <p className="text-sm text-slate-600 font-light">
                {user.user_metadata?.membership_status === "free"
                  ? "Acceso completo a la colección"
                  : "Acceso premium completo"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-rose-100/50 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base font-semibold text-slate-700">Acciones Rápidas</CardTitle>
              <Settings className="h-5 w-5 text-rose-400" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  size="sm"
                  className="w-full justify-start bg-slate-800 hover:bg-slate-700 text-white transition-colors duration-200"
                >
                  <ShoppingBag className="w-4 h-4 mr-3" />
                  Ver Catálogo
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start border-rose-200 text-slate-700 hover:bg-rose-50 hover:border-rose-300 transition-all duration-200 bg-transparent"
                >
                  <Heart className="w-4 h-4 mr-3" />
                  Mi Lista de Deseos
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-rose-100/50 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-serif text-slate-800">Últimas Reservas</CardTitle>
              <CardDescription className="text-slate-600 font-light">Tus reservas más recientes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-slate-500 font-light">No tienes reservas recientes</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 border-rose-200 text-slate-700 hover:bg-rose-50 bg-transparent"
                >
                  Explorar Catálogo
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-rose-100/50 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-serif text-slate-800">Recomendaciones</CardTitle>
              <CardDescription className="text-slate-600 font-light">Bolsos seleccionados para ti</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-slate-500 font-light">
                  Explora nuestro catálogo para ver recomendaciones personalizadas
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 border-rose-200 text-slate-700 hover:bg-rose-50 bg-transparent"
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

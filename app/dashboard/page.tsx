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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Semzo Privé</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Hola, {user.user_metadata?.first_name || user.email}</span>
              <Button onClick={handleLogout} variant="outline" size="sm" className="flex items-center bg-transparent">
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Bienvenido, {user.user_metadata?.first_name || "Usuario"}!
          </h2>
          <p className="text-gray-600">Accede a tu colección exclusiva de bolsos de lujo</p>
        </div>

        {/* User Info Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Información Personal</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>Email:</strong> {user.email}
                </p>
                <p className="text-sm">
                  <strong>Nombre:</strong> {user.user_metadata?.first_name || ""} {user.user_metadata?.last_name || ""}
                </p>
                {user.user_metadata?.phone && (
                  <p className="text-sm">
                    <strong>Teléfono:</strong> {user.user_metadata.phone}
                  </p>
                )}
                <p className="text-sm">
                  <strong>Estado:</strong> {user.email_confirmed_at ? "Confirmado" : "Pendiente confirmación"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estado de Membresía</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Badge
                  variant={user.user_metadata?.membership_status === "premium" ? "default" : "secondary"}
                  className="capitalize"
                >
                  {user.user_metadata?.membership_status || "free"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {user.user_metadata?.membership_status === "free"
                  ? "Actualiza para acceso completo"
                  : "Acceso completo a la colección"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Acciones Rápidas</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button size="sm" className="w-full justify-start">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Ver Catálogo
                </Button>
                <Button size="sm" variant="outline" className="w-full justify-start bg-transparent">
                  <Heart className="w-4 h-4 mr-2" />
                  Mi Lista de Deseos
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Últimas Reservas</CardTitle>
              <CardDescription>Tus reservas más recientes</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">No tienes reservas recientes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recomendaciones</CardTitle>
              <CardDescription>Bolsos seleccionados para ti</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Explora nuestro catálogo para ver recomendaciones personalizadas</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

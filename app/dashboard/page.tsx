"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthService, type AuthUser } from "@/app/lib/auth-service"

export default function DashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      console.log("[Dashboard] Verificando autenticación...")

      if (!AuthService.isLoggedIn()) {
        console.log("[Dashboard] Usuario no autenticado, redirigiendo al login...")
        window.location.href = "/auth/login"
        return
      }

      const currentUser = AuthService.getCurrentUser()
      console.log("[Dashboard] Usuario actual:", currentUser)

      if (currentUser) {
        setUser(currentUser)
      } else {
        console.log("[Dashboard] No se pudo obtener usuario, redirigiendo al login...")
        window.location.href = "/auth/login"
      }

      setLoading(false)
    }

    checkAuth()
  }, [])

  const handleLogout = async () => {
    console.log("[Dashboard] Cerrando sesión...")

    const result = await AuthService.logout()

    if (result.success) {
      console.log("[Dashboard] Logout exitoso, redirigiendo...")
      // Forzar recarga completa para limpiar todo el estado
      window.location.href = "/auth/login"
    } else {
      console.error("[Dashboard] Error en logout:", result.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600">Error cargando usuario</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Semzo Privé</h1>
            </div>

            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-gray-500 hover:text-gray-700">
                COLECCIÓN
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-700">
                MEMBRESÍAS
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-700">
                PROCESO
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-700">
                MAGAZINE
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-700">
                TESTIMONIOS
              </a>
            </nav>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Hola, {user.firstName}</span>
              <Button onClick={handleLogout} variant="outline" size="sm">
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>¡Bienvenido, {user.firstName}!</CardTitle>
              <CardDescription>Accede a tu colección de bolsos de lujo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gray-100 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900">Mi Perfil</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  {user.phone && <p className="text-sm text-gray-600">{user.phone}</p>}
                </div>

                <div className="bg-gray-100 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900">Membresía</h3>
                  <p className="text-sm text-gray-600 mt-1 capitalize">{user.membershipStatus}</p>
                </div>

                <div className="bg-gray-100 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900">Mis Reservas</h3>
                  <p className="text-sm text-gray-600 mt-1">No tienes reservas activas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Explorar Colección</CardTitle>
                <CardDescription>Descubre nuestra selección de bolsos de lujo</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Ver Colección</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hacer Reserva</CardTitle>
                <CardDescription>Reserva tu próximo bolso favorito</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-transparent" variant="outline">
                  Nueva Reserva
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mi Cuenta</CardTitle>
                <CardDescription>Gestiona tu perfil y preferencias</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-transparent" variant="outline">
                  Editar Perfil
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

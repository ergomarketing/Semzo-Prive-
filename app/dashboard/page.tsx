"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthService, type User } from "@/app/lib/auth-service"

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Verificar si el usuario está logueado
    const currentUser = AuthService.getCurrentUser()
    const isLoggedIn = AuthService.isLoggedIn()

    console.log("[Dashboard] Usuario actual:", currentUser)
    console.log("[Dashboard] Está logueado:", isLoggedIn)

    if (!isLoggedIn || !currentUser) {
      console.log("[Dashboard] No hay sesión, redirigiendo a login")
      router.push("/auth/login")
      return
    }

    setUser(currentUser)
    setIsLoading(false)
  }, [router])

  const handleLogout = () => {
    AuthService.logout()
    router.push("/")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Se está redirigiendo
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bienvenido, {user.firstName}</h1>
            <p className="text-gray-600">Panel de control de Semzo Privé</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            Cerrar Sesión
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Mi Perfil</CardTitle>
              <CardDescription>Información de tu cuenta</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <strong>Email:</strong> {user.email}
                </p>
                <p>
                  <strong>Nombre:</strong> {user.firstName} {user.lastName}
                </p>
                {user.phone && (
                  <p>
                    <strong>Teléfono:</strong> {user.phone}
                  </p>
                )}
                <p>
                  <strong>Membresía:</strong> {user.membershipStatus}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Catálogo</CardTitle>
              <CardDescription>Explora nuestros bolsos exclusivos</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/catalog")}>
                Ver Catálogo
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mis Reservas</CardTitle>
              <CardDescription>Gestiona tus reservas activas</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-transparent" variant="outline">
                Ver Reservas
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Estado de la Cuenta</CardTitle>
              <CardDescription>Información sobre tu membresía</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-green-800 font-semibold">¡Cuenta Activa!</h3>
                <p className="text-green-700 text-sm mt-1">
                  Tu cuenta está configurada correctamente y puedes acceder a todos nuestros servicios.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

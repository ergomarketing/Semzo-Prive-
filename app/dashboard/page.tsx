"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AuthService } from "@/app/lib/auth-service"

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      console.log("[Dashboard] Verificando autenticación...")

      const currentUser = AuthService.getCurrentUser()
      const isLoggedIn = AuthService.isLoggedIn()

      console.log("[Dashboard] Usuario actual:", currentUser)
      console.log("[Dashboard] Está logueado:", isLoggedIn)

      if (!isLoggedIn || !currentUser) {
        console.log("[Dashboard] No autenticado, redirigiendo a login")
        router.push("/auth/login")
        return
      }

      setUser(currentUser)
      setLoading(false)
    }

    // Pequeño delay para asegurar que localStorage esté disponible
    setTimeout(checkAuth, 100)
  }, [router])

  const handleLogout = () => {
    console.log("[Dashboard] Cerrando sesión...")
    AuthService.logout()

    // Forzar recarga completa para limpiar todo el estado
    window.location.href = "/"
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="font-serif text-2xl text-gray-900">Semzo Privé</h1>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Hola, {user?.firstName || "Usuario"}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
              >
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">¡Bienvenido, {user?.firstName}!</h2>
            <p className="text-gray-600 mt-2">Accede a tu colección de bolsos de lujo</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Dashboard - Semzo Privé</CardTitle>
              <CardDescription>Información de tu cuenta</CardDescription>
            </CardHeader>
            <CardContent>
              {user && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Información del Usuario</h3>
                    <div className="mt-2 space-y-1">
                      <p>
                        <strong>Nombre:</strong> {user.firstName} {user.lastName}
                      </p>
                      <p>
                        <strong>Email:</strong> {user.email}
                      </p>
                      {user.phone && (
                        <p>
                          <strong>Teléfono:</strong> {user.phone}
                        </p>
                      )}
                      <p>
                        <strong>Estado de Membresía:</strong> {user.membershipStatus}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

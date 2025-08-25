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

    checkAuth()
  }, [router])

  const handleLogout = () => {
    AuthService.logout()
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Dashboard - Semzo Privé</CardTitle>
            <CardDescription>Bienvenido a tu cuenta</CardDescription>
          </CardHeader>
          <CardContent>
            {user && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Información del Usuario</h3>
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

                <div className="pt-4">
                  <Button onClick={handleLogout} variant="outline">
                    Cerrar Sesión
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

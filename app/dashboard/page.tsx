"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { User } from "@supabase/supabase-js"

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        if (error || !user) {
          router.push("/auth/login")
          return
        }

        setUser(user)
      } catch (error) {
        console.error("Error obteniendo usuario:", error)
        router.push("/auth/login")
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [router, supabase])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      // Usar window.location para forzar recarga completa
      window.location.href = "/auth/login"
    } catch (error) {
      console.error("Error cerrando sesión:", error)
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
    return null
  }

  const firstName = user.user_metadata?.firstName || user.user_metadata?.first_name || "Usuario"
  const lastName = user.user_metadata?.lastName || user.user_metadata?.last_name || ""
  const phone = user.user_metadata?.phone || ""

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
              <span className="text-sm text-gray-700">Hola, {firstName}</span>
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
              <CardTitle>¡Bienvenido, {firstName}!</CardTitle>
              <CardDescription>Accede a tu colección de bolsos de lujo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gray-100 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900">Mi Perfil</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {firstName} {lastName}
                  </p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  {phone && <p className="text-sm text-gray-600">{phone}</p>}
                </div>

                <div className="bg-gray-100 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900">Membresía</h3>
                  <p className="text-sm text-gray-600 mt-1">Free</p>
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

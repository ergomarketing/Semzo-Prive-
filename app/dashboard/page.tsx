"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Crown, Calendar, Gem, Home, Star, Diamond, Mail, CreditCard } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthServiceSupabase } from "../lib/auth-service-supabase"
import NavbarImproved from "../components/navbar-improved"
import type { User } from "../lib/supabase"

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const currentUser = await AuthServiceSupabase.getCurrentUser()

      if (currentUser) {
        setUser(currentUser)
      } else {
        router.push("/auth/login")
      }
    } catch (error) {
      console.error("Error verificando autenticación:", error)
      router.push("/auth/login")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpgrade = () => {
    router.push("/membership-signup")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-dark mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Se redirigirá al login
  }

  const userName = `${user.first_name} ${user.last_name}`
  const membershipStatus = user.membership_status

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-nude/5 to-rose-pastel/3">
      {/* Header mejorado */}
      <NavbarImproved />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl text-slate-900 mb-2">¡Bienvenida a tu Dashboard!</h1>
          <p className="text-slate-600">
            {membershipStatus === "free"
              ? "Explora nuestras membresías y elige la perfecta para ti"
              : "Gestiona tu membresía de Semzo Privé"}
          </p>
        </div>

        {/* Membership Status */}
        {membershipStatus === "free" && (
          <Card className="mb-8 border-0 shadow-lg bg-gradient-to-r from-rose-nude/10 to-rose-pastel/20 border-l-4 border-l-indigo-dark">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-xl text-slate-900 mb-2">Cuenta Gratuita</h3>
                  <p className="text-slate-600 mb-4">Explora nuestro catálogo y descubre la experiencia Semzo Privé</p>
                  <Button onClick={handleUpgrade} className="bg-indigo-dark text-white hover:bg-indigo-dark/90">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Elegir Membresía
                  </Button>
                </div>
                <div className="w-16 h-16 rounded-full bg-indigo-dark/10 flex items-center justify-center">
                  <Crown className="h-8 w-8 text-indigo-dark" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-600 mb-1">Estado</p>
                  <p className="text-xl font-bold text-slate-900 mb-1">
                    {membershipStatus === "free" ? "Explorador" : "Miembro"}
                  </p>
                  <p className="text-sm text-slate-600">
                    {membershipStatus === "free" ? "Cuenta gratuita" : "Membresía activa"}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-indigo-dark/10 flex items-center justify-center flex-shrink-0">
                  <Crown className="h-6 w-6 text-indigo-dark" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-600 mb-1">Bolsos vistos</p>
                  <p className="text-xl font-bold text-slate-900 mb-1">12</p>
                  <p className="text-sm text-slate-600">En el catálogo</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-rose-pastel/20 flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-6 w-6 text-rose-pastel" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-600 mb-1">Favoritos</p>
                  <p className="text-xl font-bold text-slate-900 mb-1">3</p>
                  <p className="text-sm text-slate-600">En tu wishlist</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-rose-nude/20 flex items-center justify-center flex-shrink-0">
                  <Gem className="h-6 w-6 text-rose-nude" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="text-center mb-8">
          <Link href="/">
            <Button variant="outline" className="mr-4 border-slate-300 text-slate-700 hover:bg-slate-50">
              <Home className="h-4 w-4 mr-2" />
              Volver al inicio
            </Button>
          </Link>
          <Button onClick={() => router.push("/catalog")} className="bg-indigo-dark text-white hover:bg-indigo-dark/90">
            Explorar colección
          </Button>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card
            className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push("/my-account/wishlist")}
          >
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-nude/10 flex items-center justify-center">
                <Star className="h-8 w-8 text-rose-nude" />
              </div>
              <h3 className="font-serif text-lg text-slate-900 mb-2">Mi Lista de Deseos</h3>
              <p className="text-sm text-slate-600">Guarda tus bolsos favoritos y recibe notificaciones</p>
            </CardContent>
          </Card>

          <Card
            className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push("/my-account/referrals")}
          >
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-dark/10 flex items-center justify-center">
                <Diamond className="h-8 w-8 text-indigo-dark" />
              </div>
              <h3 className="font-serif text-lg text-slate-900 mb-2">Programa de Referidos</h3>
              <p className="text-sm text-slate-600">Invita amigas y gana meses gratis</p>
            </CardContent>
          </Card>

          <Card
            className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push("/my-account/newsletter")}
          >
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-pastel/10 flex items-center justify-center">
                <Mail className="h-8 w-8 text-rose-pastel" />
              </div>
              <h3 className="font-serif text-lg text-slate-900 mb-2">Newsletter</h3>
              <p className="text-sm text-slate-600">Personaliza tus preferencias de contenido</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

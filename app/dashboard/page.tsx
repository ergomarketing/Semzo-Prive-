'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthService } from '@/app/lib/auth-service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, LogOut, Settings, ShoppingBag, Heart, Gift } from 'lucide-react'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  membershipStatus: string
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar si el usuario está logueado
    if (!AuthService.isLoggedIn()) {
      router.push('/auth/login')
      return
    }

    // Obtener datos del usuario
    const currentUser = AuthService.getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
    } else {
      router.push('/auth/login')
    }

    setLoading(false)
  }, [router])

  const handleLogout = () => {
    AuthService.logout()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
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
              <span className="text-sm text-gray-600">
                Hola, {user.firstName}
              </span>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center"
              >
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
            ¡Bienvenido, {user.firstName}!
          </h2>
          <p className="text-gray-600">
            Accede a tu colección exclusiva de bolsos de lujo
          </p>
        </div>

        {/* User Info Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Información Personal
              </CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>Email:</strong> {user.email}
                </p>
                <p className="text-sm">
                  <strong>Nombre:</strong> {user.firstName} {user.lastName}
                </p>
                {user.phone && (
                  <p className="text-sm">
                    <strong>Teléfono:</strong> {user.phone}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Estado de Membresía
              </CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant={user.membershipStatus === 'premium' ? 'default' : 'secondary'}
                  className="capitalize"
                >
                  {user.membershipStatus}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {user.membershipStatus === 'free' 
                  ? 'Actualiza para acceso completo'
                  : 'Acceso completo a la colección'
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Acciones Rápidas
              </CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button size="sm" className="w-full justify-start">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Ver Catálogo
                </Button>
                <Button size="sm" variant="outline" className="w-full justify-start">
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
              <CardDescription>
                Tus reservas más recientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                No tienes reservas recientes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recomendaciones</CardTitle>
              <CardDescription>
                Bolsos seleccionados para ti
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Explora nuestro catálogo para ver recomendaciones personalizadas
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

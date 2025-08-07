"use client"

import { useEffect, useState } from "react"
import { authService, type AuthUser, type Profile } from "@/app/lib/auth-simple"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Mail, Calendar, LogOut, CheckCircle, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SimpleDashboard() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuth()

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = authService.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session)
      if (event === "SIGNED_OUT") {
        setUser(null)
        setProfile(null)
        router.push("/login")
      } else if (event === "SIGNED_IN" && session) {
        loadUserData()
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const checkAuth = async () => {
    try {
      const currentUser = await authService.getCurrentUser()
      if (!currentUser) {
        router.push("/login")
        return
      }

      const userProfile = await authService.getProfile(currentUser.id)

      setUser({
        id: currentUser.id,
        email: currentUser.email!,
        email_confirmed_at: currentUser.email_confirmed_at,
        user_metadata: currentUser.user_metadata,
      })
      setProfile(userProfile)
    } catch (error) {
      console.error("Error checking auth:", error)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  const loadUserData = async () => {
    try {
      const currentUser = await authService.getCurrentUser()
      if (currentUser) {
        const userProfile = await authService.getProfile(currentUser.id)
        setUser({
          id: currentUser.id,
          email: currentUser.email!,
          email_confirmed_at: currentUser.email_confirmed_at,
          user_metadata: currentUser.user_metadata,
        })
        setProfile(userProfile)
      }
    } catch (error) {
      console.error("Error loading user data:", error)
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      const result = await authService.logout()
      if (result.success) {
        router.push("/login")
      } else {
        console.error("Error logging out:", result.error)
      }
    } catch (error) {
      console.error("Error logging out:", error)
    } finally {
      setLoggingOut(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6">
            <p className="text-center text-gray-600">No hay sesión activa</p>
            <Button onClick={() => router.push("/login")} className="w-full mt-4">
              Ir a Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Bienvenido a tu panel de control</p>
          </div>
          <Button
            onClick={handleLogout}
            disabled={loggingOut}
            variant="outline"
            className="flex items-center gap-2 bg-transparent"
          >
            <LogOut className="h-4 w-4" />
            {loggingOut ? "Cerrando..." : "Cerrar Sesión"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Información del Usuario */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información del Usuario
              </CardTitle>
              <CardDescription>Datos de tu cuenta de usuario</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="font-medium">{user.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {user.email_confirmed_at ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <Badge variant="secondary" className="text-xs">
                          Email Confirmado
                        </Badge>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-500" />
                        <Badge variant="destructive" className="text-xs">
                          Email Pendiente
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">ID de Usuario</p>
                  <p className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{user.id}</p>
                </div>
              </div>

              {user.email_confirmed_at && (
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Confirmado el</p>
                    <p className="text-sm">
                      {new Date(user.email_confirmed_at).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información del Perfil */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Perfil
              </CardTitle>
              <CardDescription>Información adicional de tu perfil</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile ? (
                <>
                  <div>
                    <p className="text-sm text-gray-600">Nombre Completo</p>
                    <p className="font-medium">{profile.full_name || "No especificado"}</p>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm text-gray-600">Email del Perfil</p>
                    <p className="font-medium">{profile.email || "No especificado"}</p>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm text-gray-600">Teléfono</p>
                    <p className="font-medium">{profile.phone || "No especificado"}</p>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm text-gray-600">Última Actualización</p>
                    <p className="text-sm">
                      {new Date(profile.updated_at).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No se pudo cargar el perfil</p>
                  <Button onClick={loadUserData} variant="outline" size="sm" className="mt-2 bg-transparent">
                    Reintentar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estado de la Sesión */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Estado de la Sesión</CardTitle>
              <CardDescription>Información técnica de tu sesión actual</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="font-medium text-green-700">Sesión Activa</p>
                  <p className="text-sm text-green-600">Autenticado correctamente</p>
                </div>

                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <User className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="font-medium text-blue-700">Usuario Válido</p>
                  <p className="text-sm text-blue-600">Datos cargados</p>
                </div>

                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Calendar className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <p className="font-medium text-purple-700">Perfil Sincronizado</p>
                  <p className="text-sm text-purple-600">{profile ? "Disponible" : "No disponible"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Debug Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Información de Debug</CardTitle>
          </CardHeader>
          <CardContent>
            <details className="text-xs">
              <summary className="cursor-pointer font-medium mb-2">Ver datos técnicos</summary>
              <pre className="bg-gray-100 p-3 rounded overflow-auto">{JSON.stringify({ user, profile }, null, 2)}</pre>
            </details>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../hooks/useAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, MapPin, Crown, ShoppingBag, Clock, Heart, Loader2 } from "lucide-react"
import { supabase } from "../lib/supabaseClient"

interface UserProfile {
  first_name: string
  last_name: string
  email: string
  phone: string
  shipping_address: string
  shipping_city: string
  shipping_postal_code: string
}

export default function DashboardHome() {
  const router = useRouter()
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

        if (error) throw error

        if (data) {
          setProfile(data)
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  const membershipType = user?.user_metadata?.membership_status || "free"
  const isPremium = membershipType === "premium" || membershipType === "prive"

  const userName =
    user?.user_metadata?.first_name && user?.user_metadata?.last_name
      ? `${user.user_metadata.first_name.charAt(0).toUpperCase() + user.user_metadata.first_name.slice(1)} ${user.user_metadata.last_name.charAt(0).toUpperCase() + user.user_metadata.last_name.slice(1)}`
      : user?.user_metadata?.first_name
        ? user.user_metadata.first_name.charAt(0).toUpperCase() + user.user_metadata.first_name.slice(1)
        : "Usuario"

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-slate-600" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-4xl font-serif text-slate-900 mb-2">Bienvenida</h2>
        <p className="text-lg text-slate-600">Accede a tu colección de bolsos de lujo</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push("/dashboard/perfil")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-serif">Mi Perfil</CardTitle>
            <User className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif font-bold text-indigo-dark">{profile?.first_name || "Sin nombre"}</div>
            <p className="text-xs text-slate-600 mt-1">{user?.email}</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push("/dashboard/envio")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-serif">Dirección de Envío</CardTitle>
            <MapPin className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif font-bold text-indigo-dark">
              {profile?.shipping_address ? "Configurada" : "Sin configurar"}
            </div>
            <p className="text-xs text-slate-600 mt-1">{profile?.shipping_city || "Agrega tu dirección de envío"}</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push("/dashboard/membresia")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-serif">Mi Membresía</CardTitle>
            <Crown className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif font-bold text-indigo-dark">{isPremium ? "Privé" : "Free"}</div>
            <p className="text-xs text-slate-600 mt-1">{isPremium ? "Acceso completo" : "Acceso básico"}</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push("/dashboard/reservas")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-serif">Mis Reservas</CardTitle>
            <ShoppingBag className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif font-bold text-indigo-dark">0</div>
            <p className="text-xs text-slate-600 mt-1">Reservas activas</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push("/dashboard/lista-espera")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-serif">Lista de Espera</CardTitle>
            <Clock className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif font-bold text-indigo-dark">0</div>
            <p className="text-xs text-slate-600 mt-1">Bolsos en espera</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/wishlist")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-serif">Mi Wishlist</CardTitle>
            <Heart className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif font-bold text-indigo-dark">0</div>
            <p className="text-xs text-slate-600 mt-1">Favoritos guardados</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Acciones Rápidas</CardTitle>
            <CardDescription>Accede rápidamente a las funciones principales</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => router.push("/catalog")}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-serif"
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Explorar Catálogo
            </Button>
            {!isPremium && (
              <Button
                onClick={() => router.push("/membership/upgrade")}
                className="w-full bg-rose-pastel/50 hover:bg-rose-pastel/70 text-indigo-dark font-serif"
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade a Privé
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Estado de la Cuenta</CardTitle>
            <CardDescription>Información sobre tu cuenta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Email verificado</span>
              <Badge variant="secondary" className="bg-rose-pastel/50 text-indigo-dark border-rose-200">
                {user?.email_confirmed_at ? "Sí" : "Pendiente"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Membresía</span>
              <Badge variant="secondary" className="bg-rose-pastel/50 text-indigo-dark border-rose-200">
                {isPremium ? "Privé" : "Free"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Dirección configurada</span>
              <Badge variant="secondary" className="bg-rose-pastel/50 text-indigo-dark border-rose-200">
                {profile?.shipping_address ? "Sí" : "No"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

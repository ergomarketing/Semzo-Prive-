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
  membership_status: string
  membership_type: string | null
}

interface DashboardCounters {
  reservations: number
  waitlist: number
  wishlist: number
}

export default function DashboardHome() {
  const router = useRouter()
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [counters, setCounters] = useState<DashboardCounters>({
    reservations: 0,
    waitlist: 0,
    wishlist: 0,
  })

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

  useEffect(() => {
    const fetchCounters = async () => {
      if (!user) return

      try {
        const { count: waitlistCount } = await supabase
          .from("waitlist")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)

        const { count: wishlistCount } = await supabase
          .from("wishlists")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)

        const { count: reservationsCount } = await supabase
          .from("reservations")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .in("status", ["pending", "confirmed", "active"])

        setCounters({
          waitlist: waitlistCount || 0,
          wishlist: wishlistCount || 0,
          reservations: reservationsCount || 0,
        })
      } catch (error) {
        console.error("Error fetching counters:", error)
      }
    }

    fetchCounters()
  }, [user])

  const membershipStatus = profile?.membership_status || "free"
  const membershipType = profile?.membership_type || "free"
  const isPremium = membershipStatus === "active" && membershipType !== "free"

  const getMembershipName = () => {
    if (!isPremium) return "Free"
    const names: Record<string, string> = {
      petite: "Petite",
      essentiel: "L'Essentiel",
      signature: "Signature",
      prive: "Privé",
    }
    return names[membershipType] || membershipType.charAt(0).toUpperCase() + membershipType.slice(1)
  }

  const userName =
    profile?.first_name && profile?.last_name
      ? `${profile.first_name.charAt(0).toUpperCase() + profile.first_name.slice(1)} ${profile.last_name.charAt(0).toUpperCase() + profile.last_name.slice(1)}`
      : profile?.first_name
        ? profile.first_name.charAt(0).toUpperCase() + profile.first_name.slice(1)
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
        <h2 className="text-4xl font-serif text-slate-900 mb-2">Bienvenida, {userName}</h2>
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
            <div className="text-2xl font-serif font-bold text-indigo-dark">{userName}</div>
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
            <div className="text-2xl font-serif font-bold text-indigo-dark">{getMembershipName()}</div>
            <p className="text-xs text-slate-600 mt-1">{isPremium ? "Acceso completo" : "Obtén una membresía"}</p>
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
            <div className="text-2xl font-serif font-bold text-indigo-dark">{counters.reservations}</div>
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
            <div className="text-2xl font-serif font-bold text-indigo-dark">{counters.waitlist}</div>
            <p className="text-xs text-slate-600 mt-1">Bolsos en espera</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/wishlist")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-serif">Mi Wishlist</CardTitle>
            <Heart className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif font-bold text-indigo-dark">{counters.wishlist}</div>
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
              {isPremium ? "Explorar y Reservar" : "Explorar Catálogo"}
            </Button>
            {!isPremium && (
              <Button
                onClick={() => router.push("/membership/upgrade")}
                className="w-full bg-rose-pastel/50 hover:bg-rose-pastel/70 text-indigo-dark font-serif"
              >
                <Crown className="h-4 w-4 mr-2" />
                Obtener Membresía
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
                {getMembershipName()}
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

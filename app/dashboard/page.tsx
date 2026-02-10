"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "../hooks/useAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, MapPin, Crown, ShoppingBag, Clock, Heart, Loader2, Gift, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import useSWR from "swr"
import { mapDBStatusToUI, getStatusLabel, getStatusDescription } from "@/lib/membership-state-mapper"
import { IdentityVerificationModal } from "@/app/components/identity-verification-modal"
import { useState, useEffect } from "react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export const DASHBOARD_KEY = "/api/user/dashboard"

export default function DashboardHome() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [showIdentityModal, setShowIdentityModal] = useState(false)
  const [membershipTypeForVerification, setMembershipTypeForVerification] = useState<string>("")

  const { data, error, isLoading } = useSWR(user?.id ? DASHBOARD_KEY : null, fetcher)

  // FASE 4: Detectar pending_identity_verification y abrir modal automáticamente
  useEffect(() => {
    if (data && data.flags?.needs_verification && !showIdentityModal) {
      console.log("[v0] Dashboard detected pending identity verification - opening modal")
      setMembershipTypeForVerification(data.membership?.type || "essentiel")
      setShowIdentityModal(true)
    }
  }, [data, showIdentityModal])

  const loading = false; // Assuming loading is meant to be a boolean, you should replace this with the actual loading state if needed
  const getMembershipLabel = () => "Membership Label"; // Replace with actual function or state
  const getMembershipDescription = () => "Membership Description"; // Replace with actual function or state
  const counters = { reservations: 0, waitlist: 0, wishlist: 0 }; // Replace with actual data
  const giftCardBalance = 0; // Replace with actual data
  const membershipType = "public"; // Replace with actual data

  // ESTABILIDAD: No mostrar nada hasta que Auth termine de cargar
  if (authLoading || isLoading || !user) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-slate-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Error al cargar el dashboard. Por favor recarga la página.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const { profile, membership, gift_cards, reservations } = data

  const membershipUIStatus = mapDBStatusToUI(membership.status)
  const membershipLabel = getStatusLabel(membershipUIStatus)
  const membershipDescription = getStatusDescription(membershipUIStatus, membership.type)

  const userName =
    profile?.first_name && profile?.last_name
      ? `${profile.first_name.charAt(0).toUpperCase() + profile.first_name.slice(1)} ${profile.last_name.charAt(0).toUpperCase() + profile.last_name.slice(1)}`
      : profile?.first_name
        ? profile.first_name.charAt(0).toUpperCase() + profile.first_name.slice(1)
        : "Usuario"

  // FASE 5: Guard para cancelled - sin acceso
  if (membership.status === "cancelled") {
    return (
      <div className="max-w-7xl mx-auto">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Tu membresía ha sido cancelada. No tienes acceso al dashboard.{" "}
            <a href="/catalog" className="underline">Ver planes disponibles</a>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* FASE 5: Banner para pending_identity_verification */}
      {membership.status === "pending_identity_verification" && (
        <Alert className="mb-6 bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900">
            <strong>Verificación de identidad pendiente.</strong> Completa la verificación para desbloquear tu acceso completo.
          </AlertDescription>
        </Alert>
      )}

      {/* FALLBACK: Banner para limited_access (7+ días sin verificar) */}
      {membership.status === "limited_access" && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">
            <strong>Acceso Limitado.</strong> Han pasado 7 días sin verificar tu identidad. Puedes ver el catálogo pero no realizar reservas.
            <Button
              variant="outline"
              size="sm"
              className="ml-4 bg-transparent"
              onClick={() => setShowIdentityModal(true)}
            >
              Verificar Identidad
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Aviso no-bloqueante: SMS user sin email */}
      {data?.flags?.needs_email && membership.status === "active" && (
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            {"A\u00F1ade tu email para recibir facturas y avisos de pago."}
            <Button
              variant="outline"
              size="sm"
              className="ml-4 bg-transparent"
              onClick={() => router.push("/dashboard/perfil")}
            >
              {"A\u00F1adir Email"}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* FASE 5: Banner para past_due */}
      {membership.status === "past_due" && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">
            <strong>Problema con tu pago.</strong> Tu membresía está en riesgo. Por favor actualiza tu método de pago.
            <div className="text-sm text-red-700 mt-2">Para evitar la suspensión del servicio.</div>
            <Button
              variant="outline"
              size="sm"
              className="ml-4 bg-transparent"
              onClick={() => router.push("/dashboard/membresia")}
            >
              Actualizar Pago
            </Button>
          </AlertDescription>
        </Alert>
      )}

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
            <div className="text-2xl font-serif font-bold text-indigo-dark">{membershipLabel}</div>
            <p className="text-xs text-slate-600 mt-1">{membershipDescription}</p>
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
            <div className="text-2xl font-serif font-bold text-indigo-dark">{reservations.active}</div>
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
            <div className="text-2xl font-serif font-bold text-indigo-dark">{reservations.waitlist}</div>
            <p className="text-xs text-slate-600 mt-1">Bolsos en espera</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/wishlist")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-serif">Mi Wishlist</CardTitle>
            <Heart className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif font-bold text-indigo-dark">{reservations.wishlist}</div>
            <p className="text-xs text-slate-600 mt-1">Favoritos guardados</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push("/dashboard/gift-cards")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-serif">Saldo Gift Card</CardTitle>
            <Gift className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif font-bold text-indigo-dark">{gift_cards.total_balance.toFixed(2)}€</div>
            <p className="text-xs text-slate-600 mt-1">Disponible para usar</p>
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
            {membership.type !== "prive" && (
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
                {membershipLabel}
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

      {/* FASE 4: Identity Verification Modal */}
      {user && (
        <IdentityVerificationModal
          isOpen={showIdentityModal}
          onClose={() => setShowIdentityModal(false)}
          onVerificationComplete={(verified) => {
            if (verified) {
              console.log("[v0] Identity verification completed successfully")
              // Recargar datos del dashboard
              window.location.reload()
            }
          }}
          userId={user.id}
          membershipType={membershipTypeForVerification}
        />
      )}
    </div>
  )
}

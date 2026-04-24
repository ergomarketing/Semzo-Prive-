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
  const [isInAppBrowser, setIsInAppBrowser] = useState(false)

  // Detectar webviews de apps (Instagram, Facebook, TikTok) que rompen cookies de Supabase
  useEffect(() => {
    if (typeof navigator === "undefined") return
    const ua = navigator.userAgent || ""
    const inApp = /Instagram|FBAN|FBAV|FB_IAB|Messenger|Line|Twitter|MicroMessenger|TikTok|Snapchat/i.test(ua)
    setIsInAppBrowser(inApp)
  }, [])

  // Si auth ya terminó de cargar y no hay usuario, redirigir a login
  // Evita el spinner infinito en webviews de apps que bloquean cookies
  useEffect(() => {
    if (!authLoading && !user) {
      const timer = setTimeout(() => {
        router.replace("/auth/login?redirect=/dashboard")
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [authLoading, user, router])

  const { data, error, isLoading } = useSWR(user?.id ? DASHBOARD_KEY : null, fetcher)

  // Fuente de verdad unica: llamar a resume-onboarding y enrutar por su `action`.
  // Evita el loop por SWR cacheado con raw_status viejo tras completar Identity.
  const [resumeChecked, setResumeChecked] = useState(false)
  useEffect(() => {
    if (authLoading || !user) return
    if (resumeChecked) return

    ;(async () => {
      try {
        console.log("[RESUME ONBOARDING TRIGGERED]")
        const res = await fetch("/api/resume-onboarding", { method: "POST" })
        const resume = await res.json().catch(() => ({}))
        console.log("[dashboard] resume action:", resume?.action)

        if (resume?.action === "launch_identity") {
          if (resume.verification_url) {
            window.location.href = resume.verification_url
          } else {
            router.replace("/verify-identity")
          }
          return
        }
        if (resume?.action === "pending_sepa") {
          router.replace("/onboarding-complete")
          return
        }
        if (resume?.action === "resume_checkout") {
          router.replace(resume.checkout_url || "/cart")
          return
        }
        // action === "active" o cualquier otra → permanecer en dashboard
      } catch {
        // si falla resume, cae al fallback de raw_status abajo
      } finally {
        setResumeChecked(true)
      }
    })()
  }, [authLoading, user?.id, resumeChecked, router])

  // NOTA: El fallback de raw_status fue eliminado porque causaba ERR_TOO_MANY_REDIRECTS.
  // resume-onboarding es la UNICA fuente de verdad para enrutamiento.
  // raw_status de SWR puede estar stale y generar loops.

  // Si no hay sesión y estamos en webview de app, mostrar CTA para abrir en navegador
  if (!authLoading && !user && isInAppBrowser) {
    const externalUrl = typeof window !== "undefined" ? window.location.href : "https://semzoprive.com/dashboard"
    return (
      <div className="max-w-lg mx-auto py-12 px-4">
        <Alert className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900 space-y-3">
            <p className="font-medium">
              Para acceder a tu cuenta necesitas abrir la web en tu navegador (Safari o Chrome). Los navegadores
              integrados de Instagram y otras apps no permiten mantener la sesión iniciada.
            </p>
            <Button
              onClick={() => window.open(externalUrl, "_blank")}
              className="bg-slate-900 hover:bg-slate-800 text-white font-serif w-full"
            >
              Abrir en mi navegador
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // ESTABILIDAD: No mostrar nada hasta que Auth termine de cargar
  if (authLoading || (user && isLoading)) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-slate-600" />
      </div>
    )
  }

  // Si no hay user después de que authLoading termino, el useEffect redirige.
  // Mientras tanto mostrar spinner con fallback accionable.
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="animate-spin h-8 w-8 text-slate-600" />
        <p className="text-sm text-slate-600">Redirigiendo al login…</p>
        <Button variant="outline" onClick={() => router.replace("/auth/login?redirect=/dashboard")}>
          Ir al login ahora
        </Button>
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

  // Guard: data puede llegar null si el fetch falla silenciosamente
  if (!data) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-slate-600" />
      </div>
    )
  }

  const { profile, membership, gift_cards, reservations, flags } = data

  // Guard: membership puede no existir si el usuario es nuevo
  if (!membership) {
    return (
      <div className="max-w-7xl mx-auto">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>No tienes membresía activa. <a href="/catalog" className="underline">Ver planes disponibles</a></AlertDescription>
        </Alert>
      </div>
    )
  }

  const membershipUIStatus = mapDBStatusToUI(membership?.status)
  const membershipLabel = getStatusLabel(membershipUIStatus)
  const membershipDescription = getStatusDescription(membershipUIStatus, membership?.type)

  // Modal solo si: tiene membresia activa + identidad no verificada (FUENTE: flags.needs_verification)
  // Nunca se muestra a usuarios sin membresia ni compradores de pases
  const shouldShowModal =
    flags !== null &&
    flags !== undefined &&
    flags?.needs_verification === true &&
    membership?.status === "active"

  const userName =
    profile?.first_name && profile?.last_name
      ? `${profile.first_name.charAt(0).toUpperCase() + profile.first_name.slice(1)} ${profile.last_name.charAt(0).toUpperCase() + profile.last_name.slice(1)}`
      : profile?.first_name
        ? profile.first_name.charAt(0).toUpperCase() + profile.first_name.slice(1)
        : "Usuario"

  // FASE 5: Guard para cancelled - sin acceso
  if (membership?.status === "cancelled") {
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
      {/* Banner de verificacion de identidad: aparece para cualquier usuario no verificado */}
      {shouldShowModal && membership?.status !== "cancelled" && (
        <>
          {membership?.status === "limited_access" ? (
            <Alert className="mb-6 bg-red-50 border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-900 flex items-center justify-between flex-wrap gap-2">
                <span>
                  <strong>Acceso Limitado.</strong> Han pasado 7 días sin verificar tu identidad. No puedes realizar reservas hasta completarla.
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-red-400 text-red-900 hover:bg-red-100"
                  onClick={() => setShowIdentityModal(true)}
                >
                  Verificar ahora
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="mb-6 bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-900 flex items-center justify-between flex-wrap gap-2">
                <span>
                  <strong>Verificacion de identidad pendiente.</strong> Completa este paso para desbloquear las reservas de bolsos.
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-amber-400 text-amber-900 hover:bg-amber-100"
                  onClick={() => setShowIdentityModal(true)}
                >
                  Verificar ahora
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      {/* Aviso no-bloqueante: SMS user sin email */}
      {data?.flags?.needs_email && membership?.status === "active" && (
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
      {membership?.status === "past_due" && (
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
            <div className="text-2xl font-serif font-bold text-indigo-dark">{reservations?.active ?? 0}</div>
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
            <div className="text-2xl font-serif font-bold text-indigo-dark">{reservations?.waitlist ?? 0}</div>
            <p className="text-xs text-slate-600 mt-1">Bolsos en espera</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/wishlist")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-serif">Mi Wishlist</CardTitle>
            <Heart className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif font-bold text-indigo-dark">{reservations?.wishlist ?? 0}</div>
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
            <div className="text-2xl font-serif font-bold text-indigo-dark">{(gift_cards?.total_balance ?? 0).toFixed(2)}€</div>
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
            {membership?.type !== "prive" && (
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

      {/* Modal verificacion: solo si profile cargado y identity_verified === false, y usuario hace click en boton del banner */}
      {user && shouldShowModal && (
        <IdentityVerificationModal
          isOpen={showIdentityModal}
          onClose={() => setShowIdentityModal(false)}
          onVerificationComplete={(verified) => {
            if (verified) {
              window.location.reload()
            }
          }}
          userId={user.id}
          membershipType={membership?.type ?? ""}
        />
      )}
    </div>
  )
}

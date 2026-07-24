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
import { SubscriptionSummaryCard } from "@/app/components/subscription-summary-card"
import { MyBagCard } from "@/app/components/my-bag-card"
import { OwnedBagsSection } from "@/app/components/owned-bags-section"
import { PetitePassBanner } from "@/app/components/petite-pass-banner"
import { useState, useEffect } from "react"
import { useTranslations, useLocale } from "next-intl"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export const DASHBOARD_KEY = "/api/user/dashboard"

export default function DashboardHome() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const t = useTranslations("dashboard")
  const locale = useLocale()
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

  // Si auth terminó de cargar y no hay usuario, redirigir a login.
  // EXCEPCION: si venimos del return_url de Stripe Identity (?from=identity),
  // NO redirigir — la sesión está en el navegador principal, no en este webview.
  // Redirigir en ese caso crea ERR_TOO_MANY_REDIRECTS.
  useEffect(() => {
    if (!authLoading && !user) {
      const fromIdentity =
        typeof window !== "undefined" &&
        (document.referrer.includes("verify.stripe.com") ||
          window.location.search.includes("from=identity") ||
          window.location.pathname.includes("verify-identity"))
      if (fromIdentity) return // no redirigir — mostrar pantalla "abre en Safari"
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
            <p className="font-medium">{t("openInBrowser")}</p>
            <Button
              onClick={() => window.open(externalUrl, "_blank")}
              className="bg-slate-900 hover:bg-slate-800 text-white font-serif w-full"
            >
              {t("openBrowserBtn")}
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
        <p className="text-sm text-slate-600">{t("redirectingToLogin")}</p>
        <Button variant="outline" onClick={() => router.replace("/auth/login?redirect=/dashboard")}>
          {t("goToLogin")}
        </Button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{t("errorLoading")}</AlertDescription>
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
          <AlertDescription>{t("noActiveMembership")} <a href="/catalog" className="underline">{t("viewPlans")}</a></AlertDescription>
        </Alert>
      </div>
    )
  }

  // Pasar end_date al mapper para que distinga cancelled_active vs cancelled
  const membershipUIStatus = mapDBStatusToUI(membership?.status, membership?.end_date)
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

  // Guard para cancelled SIN acceso vigente (end_date ya pasó).
  // Si está cancelled_active mantenemos acceso al dashboard.
  if (membershipUIStatus === "cancelled") {
    return (
      <div className="max-w-7xl mx-auto">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t("membershipCancelled")}{" "}
            <a href="/catalog" className="underline">{t("viewPlans")}</a>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Banner Petite: pase por vencer o vencido (solo se muestra si aplica) */}
      <PetitePassBanner />

      {/* Banner de verificacion de identidad: aparece para cualquier usuario no verificado */}
      {shouldShowModal && membership?.status !== "cancelled" && (
        <>
          {membership?.status === "limited_access" ? (
            <Alert className="mb-6 bg-red-50 border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-900 flex items-center justify-between flex-wrap gap-2">
                <span>
                  <strong>{t("limitedAccess")}</strong> {t("limitedAccessDesc")}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-red-400 text-red-900 hover:bg-red-100"
                  onClick={() => setShowIdentityModal(true)}
                >
                  {t("verifyNow")}
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="mb-6 bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-900 flex items-center justify-between flex-wrap gap-2">
                <span>
                  <strong>{t("identityPending")}</strong> {t("identityPendingDesc")}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-amber-400 text-amber-900 hover:bg-amber-100"
                  onClick={() => setShowIdentityModal(true)}
                >
                  {t("verifyNow")}
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
            {t("addEmail")}
            <Button
              variant="outline"
              size="sm"
              className="ml-4 bg-transparent"
              onClick={() => router.push("/dashboard/perfil")}
            >
              {t("addEmailBtn")}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/*
       * Banner: cancelada con acceso vigente hasta end_date.
       * Paleta Semzo:
       *   fondo  rose-nude   (#fff0f3)
       *   borde  rose-pastel (#f4c4cc)
       *   texto  indigo-dark (#1a1a4b)
       * Sustituye el amber/yellow default de shadcn por colores de marca.
       */}
      {membershipUIStatus === "cancelled_active" && membership?.end_date && (
        <Alert className="mb-6 bg-rose-nude border-rose-pastel">
          <AlertTriangle className="h-4 w-4 text-indigo-dark" />
          <AlertDescription className="text-indigo-dark flex items-center justify-between flex-wrap gap-2">
            <span>
              <strong>{t("cancelledActive")}</strong>{" "}
              {t("cancelledActiveDesc", {
                date: new Date(membership.end_date).toLocaleDateString(locale === "en" ? "en-GB" : "es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }),
              })}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent border-indigo-dark/30 text-indigo-dark hover:bg-rose-pastel/40"
              onClick={() => router.push("/dashboard/membresia")}
            >
              {t("reactivate")}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/*
       * FASE 5: Banner para past_due.
       * Paleta Semzo con énfasis visual mayor:
       *   fondo  rose-pastel/30 (rose-pastel suavizado para indicar urgencia)
       *   borde  rose-pastel
       *   texto  indigo-dark
       * Se distingue del banner de cancelación normal por la intensidad del fondo.
       */}
      {membership?.status === "past_due" && (
        <Alert className="mb-6 bg-rose-pastel/30 border-rose-pastel">
          <AlertTriangle className="h-4 w-4 text-indigo-dark" />
          <AlertDescription className="text-indigo-dark">
            <strong>{t("pastDue")}</strong> {t("pastDueDesc")}
            <div className="text-sm text-indigo-dark/75 mt-2">{t("pastDueNote")}</div>
            <Button
              variant="outline"
              size="sm"
              className="ml-4 bg-transparent border-indigo-dark/30 text-indigo-dark hover:bg-rose-nude"
              onClick={() => router.push("/dashboard/membresia")}
            >
              {t("updatePayment")}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-8">
        <h2 className="text-4xl font-serif text-slate-900 mb-2">{t("welcomeUser", { name: userName })}</h2>
        <p className="text-lg text-slate-600">{t("accessCollection")}</p>
      </div>

      {/* Resumen de suscripción (Fase A) - card aislada, solo lectura.
          Se muestra para cualquier socia que tenga una membresía registrada.
          El propio componente decide si mostrarse según los datos del endpoint. */}
      {membership && membership.status !== "no_membership" && (
        <div className="mb-8">
          <SubscriptionSummaryCard />
        </div>
      )}

      {/* Mi bolso actual: card con vista condicional Descubre / Colecciona.
          El propio componente decide si renderizar según la reserva activa. */}
      {membership && membership.status !== "no_membership" && (
        <div className="mb-8">
          <MyBagCard />
        </div>
      )}

      {/* Mis bolsos adquiridos (modo Colecciona completado). Solo renderiza si hay alguno. */}
      {membership && membership.status !== "no_membership" && (
        <div className="mb-8">
          <OwnedBagsSection />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push("/dashboard/perfil")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-serif">{t("cardMyProfile")}</CardTitle>
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
            <CardTitle className="text-sm font-serif">{t("cardShipping")}</CardTitle>
            <MapPin className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif font-bold text-indigo-dark">
              {profile?.shipping_address ? t("cardShippingSet") : t("cardShippingNotSet")}
            </div>
            <p className="text-xs text-slate-600 mt-1">{profile?.shipping_city || t("cardShippingAdd")}</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push("/dashboard/membresia")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-serif">{t("cardMembership")}</CardTitle>
            <Crown className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            {/* Mostrar el nombre real del plan (L'Essentiel / Signature / Privé / Petite)
                cuando hay acceso, en lugar de un label genérico "Free" o "Cancelada". */}
            <div className="text-2xl font-serif font-bold text-indigo-dark">
              {membership?.type
                ? membership.type === "essentiel" || membership.type === "lessentiel"
                  ? "L'Essentiel"
                  : membership.type === "signature"
                    ? "Signature"
                    : membership.type === "prive"
                      ? "Privé"
                      : membership.type === "petite"
                        ? "Petite"
                        : membershipLabel
                : membershipLabel}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {membershipUIStatus === "cancelled_active"
                ? `${t("cancelledBadge")} · ${membership?.end_date ? new Date(membership.end_date).toLocaleDateString(locale === "en" ? "en-GB" : "es-ES") : ""}`
                : membershipUIStatus === "active"
                  ? `${membership?.billing_cycle === "quarterly" ? t("billingQuarterly") : t("billingMonthly")} · ${membershipDescription}`
                  : membershipDescription}
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push("/dashboard/reservas")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-serif">{t("cardReservations")}</CardTitle>
            <ShoppingBag className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif font-bold text-indigo-dark">{reservations?.active ?? 0}</div>
            <p className="text-xs text-slate-600 mt-1">{t("cardActiveReservations")}</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push("/dashboard/lista-espera")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-serif">{t("cardWaitlist")}</CardTitle>
            <Clock className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif font-bold text-indigo-dark">{reservations?.waitlist ?? 0}</div>
            <p className="text-xs text-slate-600 mt-1">{t("cardWaitlistBags")}</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/wishlist")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-serif">{t("cardWishlist")}</CardTitle>
            <Heart className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif font-bold text-indigo-dark">{reservations?.wishlist ?? 0}</div>
            <p className="text-xs text-slate-600 mt-1">{t("cardFavorites")}</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push("/dashboard/gift-cards")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-serif">{t("cardGiftCard")}</CardTitle>
            <Gift className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif font-bold text-indigo-dark">{(gift_cards?.total_balance ?? 0).toFixed(2)}€</div>
            <p className="text-xs text-slate-600 mt-1">{t("cardGiftCardAvailable")}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">{t("quickActions")}</CardTitle>
            <CardDescription>{t("quickActionsDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => router.push("/catalog")}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-serif"
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              {t("exploreCatalog")}
            </Button>
            {membership?.type !== "prive" && (
              <Button
                onClick={() => { window.location.href = "/#membresias" }}
                className="w-full bg-rose-pastel/50 hover:bg-rose-pastel/70 text-indigo-dark font-serif"
              >
                <Crown className="h-4 w-4 mr-2" />
                {t("upgradePrive")}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">{t("accountStatus")}</CardTitle>
            <CardDescription>{t("accountStatusDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">{t("emailVerified")}</span>
              <Badge variant="secondary" className="bg-rose-pastel/50 text-indigo-dark border-rose-200">
                {user?.email_confirmed_at ? t("yes") : t("pending")}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">{t("membershipLabel")}</span>
              <Badge variant="secondary" className="bg-rose-pastel/50 text-indigo-dark border-rose-200">
                {membership?.type
                  ? `${
                      membership.type === "essentiel" || membership.type === "lessentiel"
                        ? "L'Essentiel"
                        : membership.type === "signature"
                          ? "Signature"
                          : membership.type === "prive"
                            ? "Privé"
                            : membership.type === "petite"
                              ? "Petite"
                              : membershipLabel
                    }${membershipUIStatus === "cancelled_active" ? ` (${t("cancelledBadge")})` : ""}`
                  : membershipLabel}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">{t("shippingConfigured")}</span>
              <Badge variant="secondary" className="bg-rose-pastel/50 text-indigo-dark border-rose-200">
                {profile?.shipping_address ? t("yes") : "No"}
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

"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "../hooks/useAuth"
import { Button } from "@/components/ui/button"
import { MapPin, Crown, ShoppingBag, Clock, Heart, Loader2, Gift, AlertTriangle, Sparkles } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import useSWR from "swr"
import { mapDBStatusToUI, getStatusLabel, getStatusDescription } from "@/lib/membership-state-mapper"
import { IdentityVerificationModal } from "@/app/components/identity-verification-modal"
import { SubscriptionSummaryCard } from "@/app/components/subscription-summary-card"
import { MyBagCard } from "@/app/components/my-bag-card"
import { NextBagCard } from "@/app/components/next-bag-card"
import { PendingChargeCard } from "@/app/components/pending-charge-card"
import { OwnedBagsSection } from "@/app/components/owned-bags-section"
import { PetitePassBanner } from "@/app/components/petite-pass-banner"
import HowFoundPrompt from "@/app/components/how-found-prompt"
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
  const { data: creditData } = useSWR(user?.id ? "/api/user/ownership/credit-balance" : null, fetcher)
  const creditBalance = Number(creditData?.balance) || 0

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
        <Alert className="bg-rose-nude border-rose-pastel">
          <AlertTriangle className="h-4 w-4 text-indigo-dark" />
          <AlertDescription className="text-indigo-dark">
            {t("membershipCancelled")}{" "}
            <a href="/catalog" className="underline">{t("viewPlans")}</a>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const planName =
    membership?.type === "essentiel" || membership?.type === "lessentiel"
      ? "L'Essentiel"
      : membership?.type === "signature"
        ? "Signature"
        : membership?.type === "prive"
          ? "Privé"
          : membership?.type === "petite"
            ? "Petite"
            : membershipLabel

  const formatEuro = (value: number) =>
    new Intl.NumberFormat(locale === "en" ? "en-GB" : "es-ES", { style: "currency", currency: "EUR" }).format(value)

  // Accesos del panel: antes eran 7 tarjetas que repetian el menu; ahora una fila compacta con lo que importa.
  const tiles = [
    { href: "/dashboard/reservas", icon: ShoppingBag, label: t("cardReservations"), value: String(reservations?.active ?? 0), hint: t("cardActiveReservations") },
    ...(creditBalance > 0
      ? [{ href: "/dashboard/membresia", icon: Sparkles, label: t("cardCredit"), value: formatEuro(creditBalance), hint: t("cardCreditHint") }]
      : []),
    { href: "/dashboard/lista-espera", icon: Clock, label: t("cardWaitlist"), value: String(reservations?.waitlist ?? 0), hint: t("cardWaitlistBags") },
    { href: "/dashboard/favoritos", icon: Heart, label: t("cardWishlist"), value: String(reservations?.wishlist ?? 0), hint: t("cardFavorites") },
    { href: "/dashboard/gift-cards", icon: Gift, label: t("cardGiftCard"), value: formatEuro(gift_cards?.total_balance ?? 0), hint: t("cardGiftCardAvailable") },
    {
      href: "/dashboard/envio",
      icon: MapPin,
      label: t("cardShipping"),
      value: profile?.shipping_address ? t("cardShippingSet") : t("tileComplete"),
      hint: profile?.shipping_city || t("cardShippingAdd"),
    },
  ]

  return (
    <div className="relative isolate max-w-6xl mx-auto">
      {/* Fondo: foto de marca muy suave, solo decorativa (no compite con la informacion) */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-4 -z-10 h-[640px] overflow-hidden rounded-3xl">
        <div
          className="absolute inset-0 bg-cover opacity-[0.20]"
          style={{ backgroundImage: "url(/images/panel-fondo.jpg)", backgroundPosition: "100% 24%" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/0 via-slate-50/40 to-slate-50" />
      </div>

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

      {/* Pregunta de un toque "¿Como nos conociste?" (solo cuentas recientes sin respuesta) */}
      <HowFoundPrompt />

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

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.28em] text-[#b08d57]">{t("panelEyebrow")}</p>
          <h2 className="text-4xl font-serif text-indigo-dark">{t("welcomeUser", { name: userName })}</h2>
          <p className="mt-1 text-lg text-slate-600">{t("accessCollection")}</p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/dashboard/membresia")}
          className="inline-flex items-center gap-2 rounded-full border border-indigo-dark/15 bg-white/80 px-4 py-2 text-sm text-indigo-dark backdrop-blur transition hover:border-indigo-dark/40"
        >
          <Crown className="h-4 w-4 text-[#b08d57]" />
          <span className="font-serif">{planName}</span>
          {membershipUIStatus === "cancelled_active" && (
            <span className="text-xs text-slate-500">· {t("cancelledBadge")}</span>
          )}
        </button>
      </div>

      {/* Pago pendiente: cargo por no devolucion rechazado por el banco (solo si hay alguno). */}
      <div className="mb-6 empty:hidden">
        <PendingChargeCard />
      </div>

      {/* Tu bolso ahora: protagonista de la pantalla. Vista condicional Descubre / Colecciona. */}
      {membership && membership.status !== "no_membership" && (
        <div className="mb-6">
          <MyBagCard />
        </div>
      )}

      {/* Proximo bolso: reserva en cola o aviso de que ya se puede elegir (ultimos 7 dias del ciclo). */}
      {membership && membership.status !== "no_membership" && (
        <div className="mb-6">
          <NextBagCard />
        </div>
      )}

      {/* Mis bolsos adquiridos (modo Colecciona completado). Solo renderiza si hay alguno. */}
      {membership && membership.status !== "no_membership" && (
        <div className="mb-6">
          <OwnedBagsSection />
        </div>
      )}

      {/* Accesos rapidos: una fila compacta (antes 7 tarjetas que repetian el menu). */}
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {tiles.map((tile) => (
          <button
            key={tile.href}
            type="button"
            onClick={() => router.push(tile.href)}
            className="group rounded-xl border border-indigo-dark/10 bg-white/80 p-4 text-left backdrop-blur transition hover:border-indigo-dark/30 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-slate-500">{tile.label}</span>
              <tile.icon className="h-4 w-4 text-[#b08d57]" />
            </div>
            <div className="mt-3 truncate text-2xl font-serif text-indigo-dark">{tile.value}</div>
            <div className="mt-0.5 truncate text-xs text-slate-500">{tile.hint}</div>
          </button>
        ))}
      </div>

      {/* Resumen de suscripcion (solo lectura): el propio componente decide si mostrarse. */}
      {membership && membership.status !== "no_membership" && (
        <div className="mb-8">
          <SubscriptionSummaryCard />
        </div>
      )}

      {/* Dos acciones, unificadas: una principal (explorar) y una secundaria con borde dorado (pasar a Privé). */}
      <div className="mb-6 flex flex-wrap items-center gap-3 border-t border-indigo-dark/10 pt-6">
        <Button
          onClick={() => router.push("/catalog")}
          className="h-12 rounded-md bg-indigo-dark px-8 text-xs font-medium uppercase tracking-[0.18em] text-white hover:bg-indigo-dark/90"
        >
          <ShoppingBag className="mr-3 h-4 w-4 text-[#d9bd8a]" />
          {t("exploreCatalog")}
        </Button>
        {membership?.type !== "prive" && (
          <Button
            variant="outline"
            onClick={() => {
              window.location.href = "/#membresias"
            }}
            className="h-12 rounded-md border-[#b08d57] bg-transparent px-8 text-xs font-medium uppercase tracking-[0.18em] text-indigo-dark hover:bg-[#b08d57]/10 hover:text-indigo-dark"
          >
            <Crown className="mr-3 h-4 w-4 text-[#b08d57]" />
            {t("upgradePrive")}
          </Button>
        )}
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

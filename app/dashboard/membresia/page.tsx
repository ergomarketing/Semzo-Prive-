"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../hooks/useAuth"
import { Card, CardContent } from "@/components/panel/card"
import { PageHeader } from "@/components/panel/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Crown, Check, Loader2, Info, AlertTriangle, PauseCircle, XCircle, PlayCircle, ShieldCheck, CreditCard } from "lucide-react"
import useSWR from "swr"
import { toast } from "sonner"
import { useTranslations, useLocale } from "next-intl"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

// SWR key global para toda la app
export const DASHBOARD_KEY = "/api/user/dashboard"

export default function MembresiaPage() {
  const t = useTranslations("membresiaPage")
  const locale = useLocale()
  const router = useRouter()
  const { user } = useAuth()
  const [savingEmail, setSavingEmail] = useState(false)
  const [emailInput, setEmailInput] = useState("")
  const [isPhoneEmail, setIsPhoneEmail] = useState(false)
  const [actionLoading, setActionLoading] = useState<"pause" | "resume" | "cancel" | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [creditBalance, setCreditBalance] = useState(0)
  const [resumeLoading, setResumeLoading] = useState(false)

  // Saldo de credito Colecciona: se muestra como aviso al cancelar (con la baja se pierde).
  useEffect(() => {
    if (!showCancelConfirm) return
    fetch("/api/user/ownership/credit-balance")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setCreditBalance(Number(json?.balance) || 0))
      .catch(() => setCreditBalance(0))
  }, [showCancelConfirm])
  const [payLoading, setPayLoading] = useState(false)

  // SINGLE SOURCE OF TRUTH - NO guardias aquí, layout.tsx maneja redirects
  const { data, error, isLoading, mutate } = useSWR(user?.id ? DASHBOARD_KEY : null, fetcher)

  // Inicializar emailInput desde profile.email
  useEffect(() => {
    if (data?.profile?.email) {
      setEmailInput(data.profile.email)
    }
    setIsPhoneEmail(data?.profile?.phone_email || false)
  }, [data?.profile?.email, data?.profile?.phone_email])

  const handleSaveEmail = async () => {
    if (!emailInput) return

    setSavingEmail(true)
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        alert(errorData.error || "Error al actualizar email")
        return
      }

      // Refetch automático
      await mutate()
      alert("Email actualizado correctamente")
    } catch (error) {
      console.error("[v0] Error saving email:", error)
      alert("Error al actualizar email")
    } finally {
      setSavingEmail(false)
    }
  }

  // Membresia pagada pero pendiente de verificacion (identidad/SEPA).
  // Preguntamos al orquestador (resume-onboarding) cual es el siguiente
  // paso REAL y enrutamos ahi. Nunca mandamos a /#membresias (eso era el loop).
  const handleResumeOnboarding = async () => {
    setResumeLoading(true)
    try {
      const res = await fetch("/api/resume-onboarding", { method: "POST" })
      const resume = await res.json().catch(() => ({}))

      switch (resume?.action) {
        case "active":
          await mutate()
          router.replace("/dashboard")
          break
        case "launch_identity":
          if (resume.verification_url) {
            window.location.href = resume.verification_url
          } else {
            router.push("/verify-identity")
          }
          break
        case "pending_sepa":
          router.push("/onboarding-complete")
          break
        case "resume_checkout":
        case "payment_incomplete":
          router.push(resume.checkout_url || "/cart")
          break
        case "processing_payment":
          toast.info(t("toastProcessingPayment"))
          break
        default:
          // Fallback seguro: empezar por identidad (nunca a membresias)
          router.push("/verify-identity")
      }
    } catch {
      toast.error(t("toastActivationError"))
    } finally {
      setResumeLoading(false)
    }
  }

  // Membresia impagada (past_due / unpaid): pagar la factura pendiente de SU
  // suscripcion existente directamente en Stripe. NO la mandamos al catalogo
  // de membresias (eso crearia una suscripcion nueva).
  const handlePayMembership = async () => {
    setPayLoading(true)
    try {
      const res = await fetch("/api/stripe/pay-membership", { method: "POST" })
      const result = await res.json().catch(() => ({}))

      if (res.ok && result?.url) {
        window.location.href = result.url
        return
      }

      if (result?.alreadyPaid) {
        toast.success(t("toastAlreadyPaid"))
        await mutate()
        return
      }

      toast.error(result?.error || t("toastPaymentError"))
    } catch {
      toast.error(t("toastPaymentError"))
    } finally {
      setPayLoading(false)
    }
  }

  const handleMembershipAction = async (action: "pause" | "resume" | "cancel") => {
    setActionLoading(action)
    try {
      const res = await fetch(`/api/memberships/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: membership?.stripe_subscription_id ?? null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await mutate()
      if (action === "pause") toast.success(t("toastPaused"))
      if (action === "resume") toast.success(t("toastResumed"))
      if (action === "cancel") toast.success(t("toastCancelled", { date: data.cancelDate }))
      setShowCancelConfirm(false)
    } catch (err: any) {
      toast.error(err.message || t("toastActionError"))
    } finally {
      setActionLoading(null)
    }
  }

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-slate-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl">
        <div>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{t("errorLoading")}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const { profile, membership, passes, flags, gift_cards, reservations } = data

  const uiStatus: string = membership?.ui_status || "inactive"
  const isActive = uiStatus === "active"
  const isCancelledActive = uiStatus === "cancelled_active"
  const isPetite = membership.type === "petite"
  const isQuarterly = membership.billing_cycle === "quarterly"
  // Tiene acceso efectivo (puede usar la app aunque esté cancelando)
  const hasAccess = membership?.has_effective_access === true

  const membershipInfo: Record<string, { name: string; price: string; period: string }> = {
    petite:    { name: "Petite",      price: "19,99",                    period: t("perMonth") },
    essentiel: { name: "L'Essentiel", price: isQuarterly ? "142" : "59", period: isQuarterly ? t("perQuarter") : t("perMonth") },
    signature: { name: "Signature",   price: isQuarterly ? "357" : "149", period: isQuarterly ? t("perQuarter") : t("perMonth") },
    prive:     { name: "Privé",       price: isQuarterly ? "669" : "279", period: isQuarterly ? t("perQuarter") : t("perMonth") },
    free:      { name: "Free",        price: "0",                        period: t("perMonth") },
  }

  const currentMembership = membershipInfo[membership.type] || membershipInfo.free

  // Etiquetas de duración para mostrar al usuario
  const cycleDurationDays = isPetite ? 30 : isQuarterly ? 90 : 30
  const bagDurationDays = isPetite ? 7 : 30
  const maxBagsPerCycle = isPetite ? 4 : isQuarterly ? 3 : 1

  const formatLongDate = (d: string | null | undefined) => {
    if (!d) return "—"
    return new Date(d).toLocaleDateString(locale === "en" ? "en-GB" : "es-ES", { day: "numeric", month: "long", year: "numeric" })
  }

  const petiteFeatures = [
    t("feat_petite_1"),
    t("feat_petite_2"),
    t("feat_petite_3"),
    t("feat_petite_4"),
    t("feat_petite_5"),
    t("feat_petite_6"),
  ]

  const essentielFeatures = [
    isQuarterly ? t("feat_essentiel_1_quarterly") : t("feat_essentiel_1"),
    t("feat_essentiel_2"),
    t("feat_essentiel_3"),
    t("feat_essentiel_4"),
    t("feat_essentiel_5"),
  ]

  const signatureFeatures = [
    isQuarterly ? t("feat_signature_1_quarterly") : t("feat_signature_1"),
    t("feat_signature_2"),
    t("feat_signature_3"),
    t("feat_signature_4"),
    t("feat_signature_5"),
    t("feat_signature_6"),
  ]

  const priveFeatures = [
    isQuarterly ? t("feat_prive_1_quarterly") : t("feat_prive_1"),
    t("feat_prive_2"),
    t("feat_prive_3"),
    t("feat_prive_4"),
    t("feat_prive_5"),
    t("feat_prive_6"),
    t("feat_prive_7"),
  ]

  const freeFeatures = [
    t("feat_free_1"),
    t("feat_free_2"),
    t("feat_free_3"),
    t("feat_free_4"),
  ]

  const getFeatures = () => {
    if (isPetite) return petiteFeatures
    if (membership.type === "prive") return priveFeatures
    if (membership.type === "signature") return signatureFeatures
    if (membership.type === "essentiel" || membership.type === "lessentiel") return essentielFeatures
    return freeFeatures
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div>
        <PageHeader eyebrow={t("eyebrow")} title={t("title")} />

        {/*
         * Avisos del dashboard — TODOS alineados a paleta Semzo:
         *   fondo  rose-nude   (#fff0f3)
         *   borde  rose-pastel (#f4c4cc)
         *   texto  indigo-dark (#1a1a4b)
         * Antes usaban amber/yellow default de shadcn que rompían la identidad.
         */}
        {flags.needs_email && (
          <Alert variant="default" className="mb-6 border-rose-pastel bg-rose-nude">
            <AlertTriangle className="h-4 w-4 text-indigo-dark" />
            <AlertDescription className="text-indigo-dark">
              <strong>{t("emailRequired")}</strong> {t("emailRequiredDesc")}
            </AlertDescription>
          </Alert>
        )}

        {/* Banner: cancelada con acceso vigente */}
        {isCancelledActive && (membership.end_date || membership.ends_at) && (
          <Alert className="mb-6 bg-rose-nude border-rose-pastel">
            <AlertTriangle className="h-4 w-4 text-indigo-dark" />
            <AlertDescription className="text-indigo-dark">
              <strong>{t("cancelledBanner")}</strong>{" "}
              {t("cancelledBannerDesc", { date: formatLongDate(membership.end_date || membership.ends_at) })}
            </AlertDescription>
          </Alert>
        )}

        {/* Datos personales: solo se muestra para pedir el email que falta; el resto vive en Perfil y envio. */}
        {flags.needs_email && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="font-serif text-lg text-indigo-dark mb-4">{t("personalInfo")}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-indigo-dark/70 text-sm">{t("firstName")}</Label>
                  <p className="text-indigo-dark font-medium">{profile.first_name}</p>
                </div>
                <div>
                  <Label className="text-indigo-dark/70 text-sm">{t("lastName")}</Label>
                  <p className="text-indigo-dark font-medium">{profile.last_name}</p>
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="text-indigo-dark/70 text-sm">
                  {t("email")}
                </Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="email"
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    disabled={!flags.needs_email}
                    className="flex-1"
                    placeholder="tu@email.com"
                  />
                  {flags.needs_email && (
                    <Button onClick={handleSaveEmail} disabled={savingEmail || !emailInput}>
                      {savingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : t("save")}
                    </Button>
                  )}
                </div>
                {flags.needs_email && (
                  <p className="text-sm text-indigo-dark/80 mt-1">{t("emailRequired2")}</p>
                )}
              </div>

              <div>
                <Label className="text-indigo-dark/70 text-sm">{t("phone")}</Label>
                <p className="text-indigo-dark font-medium">{profile.phone}</p>
                <p className="text-xs text-indigo-dark/60 mt-1">{t("phoneNote")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Membership Section */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-6 mb-6">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {isActive && <Crown className="h-6 w-6 text-[#b08d57]" />}
                    <h2 className="font-serif text-2xl text-indigo-dark">{currentMembership.name}</h2>
                  </div>
                  {/*
                   * Badge de estado — unificado a paleta Semzo.
                   * Diferenciamos visualmente cada estado usando opacidad
                   * y bordes en lugar de cambiar de familia cromática:
                   *  active           → rose-nude + borde rose-pastel
                   *  cancelled_active → rose-nude + borde rose-pastel/60 (mas sutil)
                   *  paused           → indigo-dark/5 (gris neutro de marca)
                   *  past_due         → rose-pastel/40 (rose mas intenso, aviso)
                   *  otros            → indigo-dark/5
                   */}
                  <span
                    className={`px-3 py-1 text-xs rounded-full ${
                      isActive
                        ? "bg-rose-nude border border-rose-pastel/30 text-indigo-dark"
                        : isCancelledActive
                          ? "bg-rose-nude border border-rose-pastel/60 text-indigo-dark"
                          : uiStatus === "paused"
                            ? "bg-indigo-dark/5 border border-indigo-dark/15 text-indigo-dark"
                            : uiStatus === "past_due"
                              ? "bg-rose-pastel/40 border border-rose-pastel text-indigo-dark"
                              : "bg-indigo-dark/5 text-indigo-dark/60"
                    }`}
                  >
                    {isActive
                      ? isQuarterly
                        ? t("activeQuarterly")
                        : isPetite
                          ? t("activePetite")
                          : t("activeMonthly")
                      : isCancelledActive
                        ? t("cancelledActive")
                        : uiStatus === "paused"
                          ? t("paused")
                          : uiStatus === "past_due"
                            ? t("pastDue")
                            : uiStatus === "expired"
                              ? t("expired")
                              : t("inactive")}
                  </span>
                </div>
                <p className="mb-6 font-serif text-4xl text-indigo-dark">
                  €{currentMembership.price}
                  <span className="text-lg text-indigo-dark/60">/{currentMembership.period}</span>
                </p>

                <ul className="space-y-3 mb-6">
                  {getFeatures().map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#b08d57]" />
                      <span className="text-indigo-dark/70">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Bloque "Periodo de Membresía" — visible para todos los planes
                    con acceso (active o cancelled_active). Aclara la diferencia
                    entre tiempo de membresía y tiempo de reserva del bolso. */}
                {hasAccess && (
                  <div className="border border-[#b08d57]/20 bg-[#b08d57]/[0.07] p-5 rounded-xl mb-4">
                    <h4 className="mb-4 flex items-center gap-2 font-serif text-lg text-indigo-dark">
                      <Crown className="h-4 w-4 text-[#b08d57]" />
                      {t("membershipPeriodTitle")}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">{t("typeLabel")}</p>
                        <p className="font-serif text-lg text-indigo-dark">
                          {isPetite
                            ? t("typePetite")
                            : isQuarterly
                              ? t("typeQuarterly")
                              : t("typeMonthly")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">{t("statusLabel")}</p>
                        <p className="font-serif text-lg text-indigo-dark">
                          {isCancelledActive ? t("statusCancelledActive") : t("statusActive")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">{t("cycleStart")}</p>
                        <p className="font-serif text-lg text-indigo-dark">
                          {formatLongDate(membership.start_date || membership.started_at)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          {isCancelledActive
                            ? t("accessEnd")
                            : isQuarterly
                              ? t("quarterEnd")
                              : t("nextRenewal")}
                        </p>
                        <p className="font-serif text-lg text-indigo-dark">
                          {formatLongDate(membership.end_date || membership.ends_at)}
                        </p>
                      </div>
                    </div>

                    {/* Aclaración importante: tiempo membresía vs tiempo reserva */}
                    <div className="mt-4 pt-4 border-t border-[#b08d57]/20">
                      <p className="text-xs text-indigo-dark/70 leading-relaxed">
                        <strong className="text-indigo-dark">{t("howItWorks")}</strong>{" "}
                        {t("howItWorksDesc", {
                          cycle: cycleDurationDays,
                          bags: maxBagsPerCycle === 1 ? t("oneBag") : t("upToBags", { count: maxBagsPerCycle }),
                          bagDays: bagDurationDays,
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {isPetite && isActive && (
                  <div className="border border-[#b08d57]/20 bg-[#b08d57]/[0.07] p-5 rounded-xl mb-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-indigo-dark flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-indigo-dark mb-2">{t("passesTitle")}</h4>
                        <p className="text-sm text-indigo-dark/70 mb-3">{t("passesDesc")}</p>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-white p-2 rounded-lg text-center border border-indigo-dark/10">
                            <p className="text-xs text-indigo-dark/60 mb-1">L&apos;Essentiel</p>
                            <p className="font-medium text-indigo-dark text-lg">52€</p>
                            <p className="text-xs text-indigo-dark/60 mt-1">{t("perWeek")}</p>
                          </div>
                          <div className="bg-white p-2 rounded-lg text-center border border-indigo-dark/10">
                            <p className="text-xs text-indigo-dark/60 mb-1">Signature</p>
                            <p className="font-medium text-indigo-dark text-lg">99€</p>
                            <p className="text-xs text-indigo-dark/60 mt-1">{t("perWeek")}</p>
                          </div>
                          <div className="bg-white p-2 rounded-lg text-center border border-indigo-dark/10">
                            <p className="text-xs text-indigo-dark/60 mb-1">Priv&eacute;</p>
                            <p className="font-medium text-indigo-dark text-lg">149€</p>
                            <p className="text-xs text-indigo-dark/60 mt-1">{t("perWeek")}</p>
                          </div>
                        </div>
                        <p className="text-sm text-indigo-dark/70 mt-3 mb-3">
                          <strong>{t("currentPasses")}</strong>{" "}
                          {passes.available !== 1
                            ? t("passAvailablePlural", { count: passes.available })
                            : t("passAvailable", { count: passes.available })}
                        </p>
                        <Button
                          onClick={() => router.push("/catalog")}
                          className="w-full bg-indigo-dark hover:bg-indigo-dark/90 text-white"
                        >
                          {t("buyPassBtn")}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Controles de suscripción */}
                {isActive && (
                  <div className="mt-6 space-y-3 border-t border-indigo-dark/10 pt-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#b08d57]">{t("manageTitle")}</p>
                    <div className="flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      onClick={() => handleMembershipAction("pause")}
                      disabled={!!actionLoading}
                      className="border-indigo-dark/15 bg-transparent font-serif text-indigo-dark hover:bg-rose-nude/40"
                    >
                      {actionLoading === "pause" ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <PauseCircle className="h-4 w-4 mr-2" />
                      )}
                      {t("pauseBtn")}
                    </Button>

                    {!showCancelConfirm ? (
                      <Button
                        variant="outline"
                        onClick={() => setShowCancelConfirm(true)}
                        disabled={!!actionLoading}
                        className="border-indigo-dark/15 bg-transparent font-serif text-indigo-dark hover:bg-rose-nude/40"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        {t("cancelBtn")}
                      </Button>
                    ) : (
                      <div className="border border-indigo-dark/20 rounded-lg p-4 bg-rose-nude/30 space-y-3">
                        <p className="text-sm text-indigo-dark font-medium">{t("cancelConfirm")}</p>
                        {creditBalance > 0 && (
                          <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-md p-3">
                            {t("cancelCreditWarning", {
                              amount: new Intl.NumberFormat(locale === "en" ? "en-GB" : "es-ES", {
                                style: "currency",
                                currency: "EUR",
                              }).format(creditBalance),
                            })}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleMembershipAction("cancel")}
                            disabled={!!actionLoading}
                            className="flex-1 bg-indigo-dark hover:bg-indigo-dark/90 text-white text-sm"
                          >
                            {actionLoading === "cancel" ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : null}
                            {t("yesCancel")}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowCancelConfirm(false)}
                            disabled={!!actionLoading}
                            className="flex-1 text-sm"
                          >
                            {t("keepMembership")}
                          </Button>
                        </div>
                      </div>
                    )}
                    </div>
                  </div>
                )}

                {/* Reanudar si está pausada */}
                {membership.status === "paused" && (
                  <div className="mt-4">
                  <div className="bg-rose-nude border border-rose-pastel rounded-lg p-3 mb-3">
                    <p className="text-sm text-indigo-dark">{t("pausedNotice")}</p>
                  </div>
                    <Button
                      onClick={() => handleMembershipAction("resume")}
                      disabled={!!actionLoading}
                      className="w-full bg-indigo-dark hover:bg-indigo-dark/90 text-white"
                    >
                      {actionLoading === "resume" ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <PlayCircle className="h-4 w-4 mr-2" />
                      )}
                      {t("resumeBtn")}
                    </Button>
                  </div>
                )}

                {/* Membresia pagada pendiente de verificacion: continuar el
                    flujo (identidad → SEPA), NO mandar a /#membresias. */}
                {uiStatus === "pending_verification" && (
                  <div className="mt-4">
                    <div className="bg-rose-nude border border-rose-pastel rounded-lg p-3 mb-3">
                      <p className="text-sm text-indigo-dark">{t("pendingVerificationNotice")}</p>
                    </div>
                    <Button
                      onClick={handleResumeOnboarding}
                      disabled={resumeLoading}
                      className="w-full bg-indigo-dark hover:bg-indigo-dark/90 text-white"
                    >
                      {resumeLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-4 w-4 mr-2" />
                      )}
                      {t("continueActivation")}
                    </Button>
                  </div>
                )}

                {/* Membresia impagada: pagar la factura pendiente de SU
                    suscripcion, NO crear una nueva desde el catalogo. */}
                {uiStatus === "past_due" && (
                  <div className="mt-4">
                    <Button
                      onClick={handlePayMembership}
                      disabled={payLoading}
                      className="w-full bg-indigo-dark hover:bg-indigo-dark/90 text-white"
                    >
                      {payLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CreditCard className="h-4 w-4 mr-2" />
                      )}
                      {t("payNow")}
                    </Button>
                  </div>
                )}

                {!isActive &&
                  uiStatus !== "pending_verification" &&
                  uiStatus !== "past_due" &&
                  membership.status !== "paused" && (
                    <Button
                      onClick={() => {
                        window.location.href = "/#membresias"
                      }}
                      className="w-full bg-indigo-dark hover:bg-indigo-dark/90 text-white"
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      {t("activateBtn")}
                    </Button>
                  )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gift Cards Section */}
        {gift_cards.total_balance > 0 && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="font-serif text-lg text-indigo-dark mb-4">{t("giftCardBalance")}</h3>
              <div className="bg-rose-nude border border-rose-pastel/30 p-4 rounded-lg">
                <p className="text-2xl font-medium text-indigo-dark">{gift_cards.total_balance.toFixed(2)}€</p>
                <p className="text-sm text-indigo-dark/70 mt-1">{t("giftCardTotal")}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Historial de Pagos */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-serif text-lg text-indigo-dark mb-4">{t("paymentHistory")}</h3>
            {reservations.history === 0 ? (
              <p className="text-sm text-indigo-dark/60 bg-rose-nude border border-rose-pastel/30 p-4 rounded-lg">
                {t("noPayments")}
              </p>
            ) : (
              <p className="text-sm text-indigo-dark/60">{t("seeFullHistory")}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

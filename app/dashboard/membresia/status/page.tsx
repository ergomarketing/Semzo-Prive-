"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, Clock, Shield, Loader2, Mail, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import useSWR from "swr"
import { useAuth } from "@/app/hooks/useAuth"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

type Step = "identity" | "email" | "complete"
type IdentityStatus = "not_started" | "pending" | "processing" | "verified" | "requires_input"

export default function MembershipStatusPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [identityStatus, setIdentityStatus] = useState<IdentityStatus>("not_started")
  const [emailInput, setEmailInput] = useState<string>("")
  const [savingEmail, setSavingEmail] = useState(false)
  const [currentStep, setCurrentStep] = useState<Step>("identity")
  const [startingVerification, setStartingVerification] = useState(false)
  const [pollingActive, setPollingActive] = useState(true)
  const checkingIdentityRef = useRef(false)

  const { data: dashboardData, error, isLoading, mutate } = useSWR(
    user ? "/api/user/dashboard" : null,
    fetcher,
    { refreshInterval: pollingActive ? 30000 : 0 }
  )

  const checkIdentityStatus = useCallback(async () => {
    if (checkingIdentityRef.current) return
    checkingIdentityRef.current = true
    try {
      const res = await fetch("/api/identity/check-status")
      if (!res.ok) return
      const data = await res.json()

      const status: IdentityStatus = data.status || "not_started"
      setIdentityStatus(status)

      if (data.verified || status === "verified") {
        setPollingActive(false)
        mutate()
        toast.success("Identidad verificada. Redirigiendo al dashboard...")
        setTimeout(() => router.push("/dashboard"), 2000)
      }
    } catch {
      // silencioso
    } finally {
      checkingIdentityRef.current = false
    }
  }, [mutate, router])

  useEffect(() => {
    if (authLoading || isLoading || error || !dashboardData) return

    const { membership, profile, flags } = dashboardData

    // Si ya tiene membresía activa y está verificado (FUENTE: flags.needs_verification)
    if (membership.status === "active" && flags?.needs_verification !== true) {
      setPollingActive(false)
      router.push("/dashboard")
      return
    }

    // Si la membresía fue cancelada o fallida, redirigir al dashboard
    if (["cancelled", "failed", "canceled"].includes(membership.status)) {
      setPollingActive(false)
      router.push("/dashboard/membresia")
      return
    }

    // Inicializar email
    if (profile.email && !profile.email.endsWith("@phone.semzoprive.com")) {
      setEmailInput(profile.email)
    }

    // Determinar paso actual
    const needsEmail = flags.needs_email
    if (identityStatus === "verified") {
      setCurrentStep(needsEmail ? "email" : "complete")
    } else {
      setCurrentStep("identity")
    }

    // Consultar estado de identity si no lo hemos hecho aún
    if (identityStatus === "not_started") {
      checkIdentityStatus()
    }
  }, [dashboardData, isLoading, error, identityStatus, authLoading])

  // Polling de identity cada 15s cuando está procesando
  useEffect(() => {
    if (!pollingActive) return
    if (identityStatus !== "pending" && identityStatus !== "processing") return

    const interval = setInterval(checkIdentityStatus, 30000)
    return () => clearInterval(interval)
  }, [identityStatus, pollingActive, checkIdentityStatus])

  const handleStartVerification = async () => {
    setStartingVerification(true)
    try {
      const res = await fetch("/api/identity/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error || "Error al iniciar verificación")
      }
    } catch {
      toast.error("Error al iniciar verificación")
    } finally {
      setStartingVerification(false)
    }
  }

  const handleSaveEmail = async () => {
    if (!emailInput || !emailInput.includes("@")) {
      toast.error("Por favor ingresa un email válido")
      return
    }
    setSavingEmail(true)
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput }),
      })
      if (res.ok) {
        toast.success("Email guardado correctamente")
        mutate()
        await checkIdentityStatus()
      } else {
        const d = await res.json()
        toast.error(d.error || "Error al guardar email")
      }
    } catch {
      toast.error("Error al guardar email")
    } finally {
      setSavingEmail(false)
    }
  }

  if (authLoading || isLoading || !dashboardData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
            <p className="text-sm text-muted-foreground">Error al cargar datos. Por favor recarga la página.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { membership, flags } = dashboardData
  const isVerified = identityStatus === "verified"
  const isProcessing = identityStatus === "pending" || identityStatus === "processing"
  const isRejected = identityStatus === "requires_input"
  const needsEmail = flags.needs_email

  const planNames: Record<string, string> = {
    petite: "L'Essentiel",
    essentiel: "L'Essentiel",
    signature: "Signature",
    prive: "Privé",
  }
  const planLabel = planNames[membership.type] || membership.type || ""

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="border border-border bg-card shadow-sm">
          <CardContent className="p-8">

            {/* Header */}
            <div className="text-center mb-10">
              <div className="w-16 h-16 rounded-full border border-border flex items-center justify-center mx-auto mb-5">
                <Shield className="w-8 h-8 text-foreground" />
              </div>
              <h1 className="font-serif text-2xl text-foreground mb-2">
                Activación de membresía{planLabel ? ` ${planLabel}` : ""}
              </h1>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Tu pago ha sido confirmado. Completa estos pasos para desbloquear el acceso completo.
              </p>
            </div>

            {/* Steps */}
            <div className="space-y-3 mb-8">

              {/* Step 1: Pago */}
              <div className="flex items-center gap-4 p-4 bg-muted/40 border border-border rounded-sm">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Pago confirmado</p>
                  <p className="text-xs text-muted-foreground">Membresía{planLabel ? ` ${planLabel}` : ""} activada</p>
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-sm">
                  Completado
                </span>
              </div>

              {/* Step 2: Identity */}
              <div className={`flex items-center gap-4 p-4 border rounded-sm ${
                isVerified
                  ? "bg-muted/40 border-border"
                  : isRejected
                    ? "bg-red-50 border-red-200"
                    : isProcessing
                      ? "bg-blue-50 border-blue-200"
                      : "bg-background border-foreground/20"
              }`}>
                {isVerified ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                ) : isProcessing ? (
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                ) : isRejected ? (
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                ) : (
                  <Clock className="w-5 h-5 text-foreground flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Verificación de identidad</p>
                  <p className="text-xs text-muted-foreground">
                    {isVerified ? "Verificada correctamente" : isProcessing ? "Procesando..." : isRejected ? "No completada — intenta de nuevo" : "Requerido por seguridad"}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-sm border ${
                  isVerified ? "text-green-600 bg-green-50 border-green-200" :
                  isProcessing ? "text-blue-600 bg-blue-50 border-blue-200" :
                  isRejected ? "text-red-600 bg-red-50 border-red-200" :
                  "text-foreground bg-muted border-border"
                }`}>
                  {isVerified ? "Completado" : isProcessing ? "En progreso" : isRejected ? "Fallido" : "Pendiente"}
                </span>
              </div>

              {/* Step 3: Email (solo si aplica) */}
              {needsEmail && (
                <div className={`flex items-center gap-4 p-4 border rounded-sm ${
                  !needsEmail ? "bg-muted/40 border-border" :
                  currentStep === "email" ? "bg-background border-foreground/20" :
                  "bg-muted/20 border-border"
                }`}>
                  {!needsEmail ? (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <Mail className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Email de notificaciones</p>
                    <p className="text-xs text-muted-foreground">Para confirmaciones de reservas</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-sm border ${
                    !needsEmail ? "text-green-600 bg-green-50 border-green-200" :
                    currentStep === "email" ? "text-foreground bg-muted border-border" :
                    "text-muted-foreground bg-muted/30 border-border"
                  }`}>
                    {!needsEmail ? "Completado" : currentStep === "email" ? "Pendiente" : "Esperando"}
                  </span>
                </div>
              )}

            </div>

            {/* Action area */}
            <div className="space-y-4">

              {/* Iniciar verificación */}
              {currentStep === "identity" && !isProcessing && !isVerified && (
                <div className="p-5 border border-border rounded-sm space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-1">Verifica tu identidad</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Por seguridad, necesitamos verificar tu identidad mediante Stripe Identity. El proceso tarda menos de 2 minutos.
                    </p>
                  </div>
                  {isRejected && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-sm">
                      La verificación anterior no pudo completarse. Puedes intentarlo de nuevo.
                    </p>
                  )}
                  <Button
                    onClick={handleStartVerification}
                    disabled={startingVerification}
                    className="w-full"
                    size="lg"
                  >
                    {startingVerification ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Iniciando...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        {isRejected ? "Reintentar verificación" : "Iniciar verificación"}
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Procesando */}
              {isProcessing && (
                <div className="p-5 border border-blue-200 bg-blue-50 rounded-sm text-center space-y-2">
                  <Loader2 className="w-7 h-7 text-blue-600 animate-spin mx-auto" />
                  <p className="text-sm font-medium text-blue-900">Verificando tu identidad</p>
                  <p className="text-xs text-blue-700">Este proceso suele tardar solo unos minutos. Te notificaremos por email.</p>
                </div>
              )}

              {/* Email step */}
              {currentStep === "email" && isVerified && needsEmail && (
                <div className="p-5 border border-border rounded-sm space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-1">Registra tu email</h3>
                    <p className="text-xs text-muted-foreground">
                      Para recibir confirmaciones de reservas y notificaciones.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="tu@email.com"
                      className="h-9 text-sm"
                    />
                  </div>
                  <Button
                    onClick={handleSaveEmail}
                    disabled={savingEmail}
                    className="w-full"
                    size="lg"
                  >
                    {savingEmail ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Guardar email
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Complete — activando */}
              {currentStep === "complete" && (
                <div className="p-5 border border-border bg-muted/30 rounded-sm text-center space-y-2">
                  <Loader2 className="w-7 h-7 animate-spin mx-auto text-foreground" />
                  <p className="text-sm font-medium text-foreground">Activando acceso completo...</p>
                  <p className="text-xs text-muted-foreground">Serás redirigida automáticamente en unos segundos.</p>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-border text-center">
              <p className="text-xs text-muted-foreground">
                Proceso seguro mediante Stripe Identity
              </p>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}

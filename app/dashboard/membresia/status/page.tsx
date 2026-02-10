"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, Clock, Shield, Loader2, Mail } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import useSWR from "swr"
import { useAuth } from "@/app/hooks/useAuth"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function MembershipStatusPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [verificationStatus, setVerificationStatus] = useState<string>("not_started")
  const [emailInput, setEmailInput] = useState<string>("")
  const [savingEmail, setSavingEmail] = useState(false)
  const [currentStep, setCurrentStep] = useState<"identity" | "email" | "complete">("identity")
  const [checkingVerification, setCheckingVerification] = useState(false)
  const [userEmail, setUserEmail] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [activating, setActivating] = useState(false)
  const [membershipType, setMembershipType] = useState<string>("")
  const [isRejected, setIsRejected] = useState(false) // Declare isRejected variable

  // Estado para controlar si el polling debe estar activo
  const [pollingActive, setPollingActive] = useState(true)
  
  // Usar endpoint canónico como única fuente de verdad
  // Polling se desactiva cuando llegamos a estado final (active, cancelled, failed)
  const { data: dashboardData, error, isLoading, mutate } = useSWR(
    user ? "/api/user/dashboard" : null,
    fetcher,
    { refreshInterval: pollingActive ? 10000 : 0 } // Poll cada 10s solo si está activo
  )

  useEffect(() => {
    // ESTABILIDAD: No redirigir hasta que Auth termine
    if (authLoading || isLoading || error || !dashboardData) return

    const { membership, profile } = dashboardData

    // PASO 3: REGLA DE NEGOCIO - Solo SMS requiere Identity
    const requiresIdentity = profile.auth_method === "sms"
    
    console.log("[v0] Status page - auth_method:", profile.auth_method, "requiresIdentity:", requiresIdentity)

    // Si es Email (NO requiere Identity), redirigir directo al dashboard
    if (!requiresIdentity) {
      setPollingActive(false)
      toast.success("¡Membresía activada! Accede a tu dashboard.")
      router.push("/dashboard")
      return
    }

    // ESTADOS FINALES: Apagar polling y redirigir
    const finalStates = ["active", "cancelled", "failed"]
    if (finalStates.includes(membership.status)) {
      setPollingActive(false) // STOP polling - estado final alcanzado
      
      if (membership.status === "active") {
        toast.success("¡Membresía activada!")
      }
      router.push("/dashboard/membresia")
      return
    }

    // Inicializar email input
    setEmailInput(profile.email || "")

    // Verificar estado de identity desde el endpoint específico (solo SMS)
    checkIdentityStatus()
  }, [dashboardData, isLoading, error, router])

  const checkIdentityStatus = async () => {
    if (checkingVerification) return
    
    setCheckingVerification(true)
    try {
      const response = await fetch("/api/identity/check-status")
      
      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Identity check:", data)
        
        const status = data.status || "not_started"
        setVerificationStatus(status)

        // Si el webhook ya activó la membresía, revalidar y redirigir al dashboard
        if (data.membershipActivated) {
          mutate()
          toast.success("¡Membresía activada correctamente!")
          setTimeout(() => {
            router.push("/dashboard")
          }, 2000)
          setPollingActive(false)
          return
        }

        // Determinar paso actual
        const needsEmail = dashboardData?.flags?.needs_email || false
        
        if (status === "verified" || status === "approved") {
          setCurrentStep(needsEmail ? "email" : "complete")
          // Si está verificado y no necesita email, redirigir al dashboard
          if (!needsEmail && currentStep !== "complete") {
            toast.success("¡Verificación completada! Redirigiendo al dashboard...")
            setTimeout(() => {
              router.push("/dashboard")
            }, 2000)
            setPollingActive(false)
          }
        } else if (status === "pending" || status === "processing") {
          setCurrentStep("identity")
        } else {
          setCurrentStep("identity")
        }

        // Update isRejected status
        setIsRejected(data.isRejected || false)
      }
    } catch (error) {
      console.error("[v0] Error checking identity:", error)
    } finally {
      setCheckingVerification(false)
    }
  }

  useEffect(() => {
    // Solo polling si está activo - se apaga en estados finales
    if (!pollingActive) return
    
    // Verificar estado de identity cada 30 segundos
    const interval = setInterval(checkIdentityStatus, 30000)
    return () => clearInterval(interval)
  }, [dashboardData, pollingActive])

  const handleStartVerification = async () => {
    try {
      const response = await fetch("/api/identity/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.url) {
          window.location.href = data.url
        }
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Error al iniciar verificación")
      }
    } catch (error) {
      console.error("[v0] Error starting verification:", error)
      toast.error("Error al iniciar verificación")
    }
  }

  const handleSaveEmail = async () => {
    if (!emailInput || !emailInput.includes("@")) {
      toast.error("Por favor ingresa un email válido")
      return
    }

    setSavingEmail(true)
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput }),
      })

      if (response.ok) {
        toast.success("Email guardado correctamente")
        // Revalidar dashboard data
        mutate()
        // Verificar si esto completó todos los pasos
        await checkIdentityStatus()
      } else {
        const data = await response.json()
        toast.error(data.error || "Error al guardar email")
      }
    } catch (error) {
      console.error("[v0] Error saving email:", error)
      toast.error("Error al guardar email")
    } finally {
      setSavingEmail(false)
    }
  }

  const handleActivateMembership = async () => {
    setActivating(true)
    try {
      const response = await fetch("/api/user/activate-membership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (response.ok) {
        toast.success("Membresía activada correctamente")
        router.push("/dashboard/membresia")
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Error al activar membresía")
      }
    } catch (error) {
      console.error("[v0] Error activating membership:", error)
      toast.error("Error al activar membresía")
    } finally {
      setActivating(false)
    }
  }

  if (isLoading || !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-nude/20 to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-dark" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-nude/20 to-white flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Error al cargar datos. Por favor recarga la página.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { membership, profile, flags } = dashboardData
  const isVerified = verificationStatus === "verified" || verificationStatus === "approved"
  const isPending = verificationStatus === "pending" || verificationStatus === "processing"
  const needsEmail = flags.needs_email

  const planNames: Record<string, string> = {
    petite: "Petite",
    signature: "Signature",
    prive: "Privé",
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-nude/20 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="border-2 border-indigo-dark/10 bg-white shadow-xl">
          <CardContent className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-full bg-indigo-dark/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-10 h-10 text-indigo-dark" />
              </div>
              <h1 className="text-3xl font-serif text-indigo-dark mb-2">
                Activación de Membresía {planNames[membership.type] || membership.type}
              </h1>
              <p className="text-indigo-dark/70">Tu pago ha sido confirmado. Completa estos pasos para activar tu membresía.</p>
            </div>

            {/* Progress Steps */}
            <div className="space-y-4 mb-8">
              {/* Step 1: Payment */}
              <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl border-2 border-green-200">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-green-900">Pago confirmado</p>
                  <p className="text-sm text-green-700">Membresía {planNames[membership.type] || membership.type} recibida</p>
                </div>
                <span className="text-xs font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full">Completado</span>
              </div>

              {/* Step 2: Identity */}
              <div
                className={`flex items-center gap-4 p-4 rounded-xl border-2 ${
                  isVerified
                    ? "bg-green-50 border-green-200"
                    : isPending
                      ? "bg-blue-50 border-blue-200"
                      : currentStep === "identity"
                        ? "bg-indigo-dark/5 border-indigo-dark/20"
                        : "bg-gray-50 border-gray-200"
                }`}
              >
                {isVerified ? (
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                ) : isPending ? (
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin flex-shrink-0" />
                ) : currentStep === "identity" ? (
                  <Clock className="w-6 h-6 text-indigo-dark flex-shrink-0" />
                ) : (
                  <Clock className="w-6 h-6 text-gray-400 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className={`font-medium ${isVerified ? "text-green-900" : isPending ? "text-blue-900" : currentStep === "identity" ? "text-indigo-dark" : "text-gray-700"}`}>
                    Verificación de identidad
                  </p>
                  <p className={`text-sm ${isVerified ? "text-green-700" : isPending ? "text-blue-700" : currentStep === "identity" ? "text-indigo-dark/70" : "text-gray-600"}`}>
                    {isVerified ? "Verificada correctamente" : isPending ? "Procesando..." : currentStep === "identity" ? "Requerido por seguridad" : "Esperando"}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    isVerified ? "text-green-600 bg-green-100" : isPending ? "text-blue-600 bg-blue-100" : currentStep === "identity" ? "text-indigo-dark bg-indigo-dark/10" : "text-gray-600 bg-gray-100"
                  }`}
                >
                  {isVerified ? "Completado" : isPending ? "En progreso" : currentStep === "identity" ? "Pendiente" : "Esperando"}
                </span>
              </div>

              {/* Step 3: Email */}
              <div
                className={`flex items-center gap-4 p-4 rounded-xl border-2 ${
                  !needsEmail
                    ? "bg-green-50 border-green-200"
                    : currentStep === "email"
                      ? "bg-indigo-dark/5 border-indigo-dark/20"
                      : "bg-gray-50 border-gray-200"
                }`}
              >
                {!needsEmail ? (
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                ) : currentStep === "email" ? (
                  <Mail className="w-6 h-6 text-indigo-dark flex-shrink-0" />
                ) : (
                  <Mail className="w-6 h-6 text-gray-400 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className={`font-medium ${!needsEmail ? "text-green-900" : currentStep === "email" ? "text-indigo-dark" : "text-gray-700"}`}>
                    Email de notificaciones
                  </p>
                  <p className={`text-sm ${!needsEmail ? "text-green-700" : currentStep === "email" ? "text-indigo-dark/70" : "text-gray-600"}`}>
                    {!needsEmail ? "Email registrado" : currentStep === "email" ? "Para recibir confirmaciones" : "Esperando verificación"}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    !needsEmail ? "text-green-600 bg-green-100" : currentStep === "email" ? "text-indigo-dark bg-indigo-dark/10" : "text-gray-600 bg-gray-100"
                  }`}
                >
                  {!needsEmail ? "Completado" : currentStep === "email" ? "Pendiente" : "Esperando"}
                </span>
              </div>

              {/* Step 4: Activation */}
              <div
                className={`flex items-center gap-4 p-4 rounded-xl border-2 ${
                  currentStep === "complete" ? "bg-indigo-dark/5 border-indigo-dark/20" : "bg-gray-50 border-gray-200"
                }`}
              >
                <Shield className={`w-6 h-6 flex-shrink-0 ${currentStep === "complete" ? "text-indigo-dark" : "text-gray-400"}`} />
                <div className="flex-1">
                  <p className={`font-medium ${currentStep === "complete" ? "text-indigo-dark" : "text-gray-700"}`}>Activación final</p>
                  <p className={`text-sm ${currentStep === "complete" ? "text-indigo-dark/70" : "text-gray-600"}`}>
                    {currentStep === "complete" ? "Lista para activar" : "Tras completar pasos anteriores"}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${currentStep === "complete" ? "text-indigo-dark bg-indigo-dark/10" : "text-gray-600 bg-gray-100"}`}
                >
                  {currentStep === "complete" ? "Listo" : "Esperando"}
                </span>
              </div>
            </div>

            {/* Action Section */}
            <div className="space-y-4">
              {currentStep === "identity" && !isPending && (
                <div className="p-6 bg-indigo-dark/5 rounded-xl border border-indigo-dark/10">
                  <h3 className="font-medium text-indigo-dark mb-2">Verifica tu identidad</h3>
                  <p className="text-sm text-indigo-dark/70 mb-4">
                    Por seguridad, necesitamos verificar tu identidad. El proceso es rápido y seguro mediante Stripe Identity.
                  </p>
                  <Button onClick={handleStartVerification} className="w-full bg-indigo-dark hover:bg-indigo-dark/90" size="lg">
                    <Shield className="w-4 h-4 mr-2" />
                    Iniciar verificación
                  </Button>
                </div>
              )}

              {currentStep === "identity" && isPending && (
                <div className="p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                  <p className="font-semibold text-blue-900 mb-1 text-center">Verificando tu identidad</p>
                  <p className="text-sm text-blue-700 text-center">Este proceso suele tardar solo unos minutos.</p>
                </div>
              )}

              {currentStep === "email" && (
                <div className="p-6 bg-indigo-dark/5 rounded-xl border border-indigo-dark/10">
                  <h3 className="font-medium text-indigo-dark mb-2">Registra tu email</h3>
                  <p className="text-sm text-indigo-dark/70 mb-4">
                    Para recibir confirmaciones de reservas y notificaciones importantes.
                  </p>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="tu@email.com"
                        className="mt-1"
                      />
                    </div>
                    <Button onClick={handleSaveEmail} disabled={savingEmail} className="w-full bg-indigo-dark hover:bg-indigo-dark/90" size="lg">
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
                </div>
              )}

              {currentStep === "complete" && (
                <div className="p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-3" />
                  <p className="font-semibold text-blue-900 mb-1 text-center">Activando tu membresía</p>
                  <p className="text-sm text-blue-700 text-center">
                    El sistema está procesando tu verificación. Serás redirigido automáticamente en unos segundos.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-indigo-dark/10 text-center">
              <p className="text-xs text-indigo-dark/60">
                <Shield className="w-3 h-3 inline mr-1" />
                Proceso seguro mediante Stripe Identity
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

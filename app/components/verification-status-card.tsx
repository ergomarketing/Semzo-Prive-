"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Clock, Shield, Loader2 } from "lucide-react"
import { useState } from "react"

interface VerificationStatusCardProps {
  membershipPlan: string
  membershipStatus: string
  verificationStatus?: string
  onRetryVerification?: () => void
  onActivateMembership?: () => void
}

export function VerificationStatusCard({
  membershipPlan,
  membershipStatus,
  verificationStatus = "not_started",
  onRetryVerification,
  onActivateMembership,
}: VerificationStatusCardProps) {
  const [activating, setActivating] = useState(false)

  const isPendingVerification = membershipStatus === "pending_verification"
  const isAlreadyActive = membershipStatus === "active"
  const isVerified = verificationStatus === "approved"
  const isRejected = verificationStatus === "rejected"
  const isPending = verificationStatus === "pending"

  const planNames: Record<string, string> = {
    petite: "Petite",
    signature: "Signature",
    prive: "Privé",
  }

  const handleActivate = async () => {
    setActivating(true)
    try {
      const response = await fetch("/api/activate-membership", {
        method: "POST",
        credentials: "include",
      })

      if (response.ok) {
        if (onActivateMembership) onActivateMembership()
        window.location.reload()
      } else {
        const data = await response.json()
        alert(data.error || "Error al activar membresía")
      }
    } catch (error) {
      console.error("Error activando membresía:", error)
      alert("Error al activar membresía. Por favor intenta de nuevo.")
    } finally {
      setActivating(false)
    }
  }

  if (!isPendingVerification && !isAlreadyActive) return null

  return (
    <Card className="border-2 border-indigo-dark/10 bg-gradient-to-br from-rose-nude/30 to-white mb-6">
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-indigo-dark/10 flex items-center justify-center">
              {isAlreadyActive || isVerified ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : isPending ? (
                <Loader2 className="w-6 h-6 text-indigo-dark animate-spin" />
              ) : (
                <Clock className="w-6 h-6 text-indigo-dark" />
              )}
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-serif text-indigo-dark mb-2">
              {isAlreadyActive
                ? "¡Membresía activa!"
                : isVerified
                  ? "¡Todo listo para activar!"
                  : isPending
                    ? "Estamos verificando tu información..."
                    : isRejected
                      ? "Necesitamos verificar algunos datos"
                      : "Último paso: verificación de identidad"}
            </h3>
            <p className="text-sm text-indigo-dark/70">
              {isAlreadyActive
                ? `Tu membresía ${planNames[membershipPlan]} está activa y lista para usar. Ya puedes explorar todo el catálogo y hacer reservas.`
                : isVerified
                  ? `Tu identidad ha sido verificada. Ahora puedes activar tu membresía ${planNames[membershipPlan]} y comenzar a disfrutar del catálogo completo.`
                  : isPending
                    ? "Este proceso suele tardar solo unos minutos. Te notificaremos cuando esté completo."
                    : isRejected
                      ? "No te preocupes, es un proceso de seguridad estándar. Por favor, intenta la verificación nuevamente."
                      : `Para activar tu membresía ${planNames[membershipPlan]}, necesitamos verificar tu identidad. Es un proceso rápido y seguro.`}
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {/* Paso 1: Pago */}
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-indigo-dark/10">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-indigo-dark">Paso 1: Pago recibido</p>
              <p className="text-xs text-indigo-dark/60">Membresía {planNames[membershipPlan]} confirmada</p>
            </div>
            <span className="text-xs text-green-600 font-medium">Completado</span>
          </div>

          {/* Paso 2: Verificación */}
          <div
            className={`flex items-center gap-3 p-3 rounded-lg border ${
              isVerified || isAlreadyActive
                ? "bg-green-50 border-green-200"
                : isPending
                  ? "bg-blue-50 border-blue-200"
                  : "bg-white border-indigo-dark/10"
            }`}
          >
            {isVerified || isAlreadyActive ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            ) : isPending ? (
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
            ) : (
              <Clock className="w-5 h-5 text-indigo-dark/40 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium text-indigo-dark">Paso 2: Verificación de identidad</p>
              <p className="text-xs text-indigo-dark/60">
                {isVerified || isAlreadyActive
                  ? "Identidad verificada correctamente"
                  : isPending
                    ? "Verificando tus documentos..."
                    : isRejected
                      ? "Necesita nueva verificación"
                      : "Pendiente de iniciar"}
              </p>
            </div>
            <span
              className={`text-xs font-medium ${
                isVerified || isAlreadyActive ? "text-green-600" : isPending ? "text-blue-600" : "text-indigo-dark/40"
              }`}
            >
              {isVerified || isAlreadyActive ? "Completado" : isPending ? "En progreso" : "Pendiente"}
            </span>
          </div>

          {/* Paso 3: Activación */}
          <div
            className={`flex items-center gap-3 p-3 rounded-lg border ${
              isAlreadyActive ? "bg-green-50 border-green-200" : "bg-white border-indigo-dark/10"
            }`}
          >
            <Shield
              className={`w-5 h-5 flex-shrink-0 ${isAlreadyActive ? "text-green-600" : isVerified ? "text-indigo-dark" : "text-indigo-dark/40"}`}
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-indigo-dark">Paso 3: Activación de membresía</p>
              <p className="text-xs text-indigo-dark/60">
                {isAlreadyActive
                  ? "Membresía activa"
                  : isVerified
                    ? "Lista para activar"
                    : "Se activará tras la verificación"}
              </p>
            </div>
            <span className={`text-xs font-medium ${isAlreadyActive ? "text-green-600" : "text-indigo-dark/40"}`}>
              {isAlreadyActive ? "Activa" : isVerified ? "Listo" : "Esperando"}
            </span>
          </div>
        </div>

        {isVerified && !isAlreadyActive && (
          <Button
            onClick={handleActivate}
            disabled={activating}
            className="w-full bg-indigo-dark hover:bg-indigo-dark/90 text-white"
            size="lg"
          >
            {activating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Activando...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Activar mi membresía ahora
              </>
            )}
          </Button>
        )}

        {isAlreadyActive && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-green-900 font-medium">Tu membresía está activa</p>
            <p className="text-xs text-green-700 mt-1">Ya puedes explorar el catálogo completo y hacer reservas</p>
            <Button
              onClick={() => (window.location.href = "/catalog")}
              className="w-full mt-3 bg-indigo-dark hover:bg-indigo-dark/90 text-white"
            >
              Explorar catálogo
            </Button>
          </div>
        )}

        {(isRejected || (!isVerified && !isPending && !isAlreadyActive)) && (
          <Button
            onClick={onRetryVerification}
            className="w-full bg-indigo-dark hover:bg-indigo-dark/90 text-white"
            size="lg"
          >
            <Shield className="w-4 h-4 mr-2" />
            {isRejected ? "Reintentar verificación" : "Iniciar verificación ahora"}
          </Button>
        )}

        {isPending && !isAlreadyActive && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-sm text-blue-900 font-medium">Verificación en progreso</p>
            <p className="text-xs text-blue-700 mt-1">
              Te notificaremos por email cuando esté completa. Puedes cerrar esta página.
            </p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-indigo-dark/10">
          <p className="text-xs text-indigo-dark/60 text-center">
            <Shield className="w-3 h-3 inline mr-1" />
            Verificación procesada de forma segura por Stripe Identity
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

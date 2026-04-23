"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ShieldCheck, Camera, CreditCard, Clock, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function VerifyIdentityPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollingRef = useRef(true)

  // Polling: detectar si el usuario completó la verificación en otro dispositivo
  // (ej: escaneo QR desde PC y completa en móvil). Cuando Stripe confirma verified,
  // la PC (que tiene la cookie de sesión) avanza el flujo por el orquestador.
  useEffect(() => {
    pollingRef.current = true

    const poll = async () => {
      if (!pollingRef.current) return
      try {
        const res = await fetch("/api/identity/check-status")
        const data = await res.json()
        if (data.verified) {
          pollingRef.current = false

          // Identity OK → preguntar al orquestador el siguiente paso real.
          // Regla de oro: Identity → SEPA → Active. Nunca saltarse SEPA.
          try {
            console.log("[RESUME ONBOARDING TRIGGERED]")
            const resumeRes = await fetch("/api/resume-onboarding", { method: "POST" })
            const resume = await resumeRes.json().catch(() => ({}))
            console.log("[verify-identity] resume action:", resume?.action)

            if (resume?.action === "active") {
              router.replace("/dashboard")
            } else if (resume?.action === "pending_sepa") {
              router.replace("/onboarding-complete")
            } else {
              // Fallback seguro: si el orquestador no dio acción clara,
              // ir a onboarding-complete (SEPA) — nunca a dashboard.
              router.replace("/onboarding-complete")
            }
          } catch {
            // Error en resume: fallback a onboarding-complete
            router.replace("/onboarding-complete")
          }
          return
        }
      } catch {
        // error de red — no hacer nada, seguir intentando
      }
      if (pollingRef.current) setTimeout(poll, 3000)
    }

    // Primera consulta tras 3s (tiempo para que el webhook de Stripe llegue)
    const t = setTimeout(poll, 3000)
    return () => {
      pollingRef.current = false
      clearTimeout(t)
    }
  }, [router])

  const handleStart = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/identity/create-session", { method: "POST" })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError(data.error || "No se pudo iniciar la verificación.")
        setLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      setError("Error de conexión. Por favor intenta de nuevo.")
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full space-y-10">

        {/* Cabecera */}
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-foreground/5 border border-border flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-foreground" />
            </div>
          </div>
          <h1 className="font-serif text-3xl text-foreground font-light">
            Verificación de identidad
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            Para proteger a todas las miembros del club, necesitamos verificar tu identidad antes de activar tu acceso completo. Es un proceso rápido y seguro.
          </p>
        </div>

        {/* Pasos del proceso */}
        <div className="border border-border rounded-xl divide-y divide-border">
          <div className="flex items-start gap-4 p-5">
            <div className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center shrink-0 mt-0.5">
              <CreditCard className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Documento de identidad</p>
              <p className="text-sm text-muted-foreground mt-0.5">DNI, pasaporte o permiso de conducir vigente</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-5">
            <div className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center shrink-0 mt-0.5">
              <Camera className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Selfie de verificación</p>
              <p className="text-sm text-muted-foreground mt-0.5">Una foto para confirmar que eres tú. Necesitarás acceso a tu cámara.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-5">
            <div className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center shrink-0 mt-0.5">
              <Clock className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Menos de 2 minutos</p>
              <p className="text-sm text-muted-foreground mt-0.5">El proceso es completamente guiado. Serás redirigida a Stripe Identity, nuestro proveedor de verificación.</p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* CTA principal */}
        <div className="space-y-3">
          <Button
            onClick={handleStart}
            disabled={loading}
            className="w-full h-12 text-sm uppercase tracking-widest font-medium rounded-lg"
            style={{ backgroundColor: "#1a1a4b", color: "#ffffff" }}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Iniciando verificación...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Comenzar verificación
                <ChevronRight className="w-4 h-4" />
              </span>
            )}
          </Button>

        </div>

        {/* Nota de seguridad */}
        <p className="text-center text-xs text-muted-foreground leading-relaxed">
          Tu información es procesada de forma segura por{" "}
          <span className="font-medium text-foreground">Stripe Identity</span>.
          Semzo Privé no almacena copias de tus documentos.
        </p>
      </div>
    </main>
  )
}

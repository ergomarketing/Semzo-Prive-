"use client"

/**
 * ============================================================================
 * FLUJO VALIDADO — NO MODIFICAR SIN CONSULTAR
 * ============================================================================
 * PASO 7b del flujo de suscripcion: RESULTADO DE IDENTITY
 *
 * Stripe Identity redirige aqui con ?session_id=VERIFICATION_SESSION_ID.
 * Si el placeholder literal aparece (Stripe no lo reemplazo) → /dashboard.
 *
 * Llama a /api/identity/check-status y segun el resultado:
 *  - verified === true || status === "verified"  → /onboarding-complete (SEPA)
 *  - status requires_input / canceled → estado rejected, mostrar reintentar
 *  - cualquier otro → estado error
 *
 * La transicion a /onboarding-complete tiene setTimeout 2000ms intencional
 * para que el usuario vea el check verde antes de redirigir.
 * ============================================================================
 */

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

type VerificationStatus = "loading" | "approved" | "approved_no_session" | "rejected" | "error"

function VerifyIdentityResultContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const [status, setStatus] = useState<VerificationStatus>("loading")

  useEffect(() => {
    // Si el sessionId es el placeholder literal o no existe, redirigir a dashboard
    if (!sessionId || sessionId.includes("VERIFICATION_SESSION")) {
      window.location.href = "/dashboard"
      return
    }

    async function checkStatus() {
      try {
        const res = await fetch(`/api/identity/check-status?session_id=${sessionId}`)
        const data = await res.json()

        if (data.verified === true || data.status === "verified") {
          // Caso 1: móvil hizo Identity vía QR desde PC. El móvil no tiene cookie.
          //         Mostrar mensaje "vuelve al ordenador" y NO intentar redirigir.
          //         La PC detectará verified por polling y continuará sola.
          //
          // Caso 2: móvil con sesión propia (completó Identity en su propio login).
          //         Tiene cookie → resume-onboarding enruta por action.
          //
          // Detectamos el caso llamando a resume-onboarding (requiere cookie).
          // Si devuelve 401 → Caso 1 (QR). Si responde → Caso 2 (con sesión).
          try {
            console.log("[RESUME ONBOARDING TRIGGERED]")
            const resumeRes = await fetch("/api/resume-onboarding", { method: "POST" })

            if (resumeRes.status === 401) {
              // Sin sesión → móvil que completó Identity por QR desde PC
              setStatus("approved_no_session")
              return
            }

            const resume = await resumeRes.json().catch(() => ({}))
            console.log("[verify-identity/result] resume action:", resume?.action)

            setStatus("approved")
            let nextUrl = "/onboarding-complete"
            if (resume?.action === "active") {
              nextUrl = "/dashboard"
            } else if (resume?.action === "pending_sepa") {
              nextUrl = "/onboarding-complete"
            }

            setTimeout(() => {
              window.location.href = nextUrl
            }, 2000)
          } catch {
            // Error de red: asumimos sin sesión para no mandarlo a login
            setStatus("approved_no_session")
          }
        } else if (data.status === "requires_input" || data.status === "canceled") {
          setStatus("rejected")
        } else {
          // Stripe Identity es instantaneo - si no es verified, es error
          setStatus("error")
        }
      } catch {
        setStatus("error")
      }
    }

    checkStatus()
  }, [sessionId])

  const content: Record<
    VerificationStatus,
    { title: string; message: string; action?: string; actionLabel?: string }
  > = {
    loading: {
      title: "Verificando tu identidad...",
      message: "Por favor espera un momento.",
    },
    approved: {
      title: "Verificacion completada",
      message: "Tu identidad ha sido verificada. Ahora configura tu cuenta bancaria...",
    },
    approved_no_session: {
      title: "Verificacion completada",
      message: "Tu identidad ha sido verificada correctamente. Vuelve a tu ordenador para completar el proceso — la pagina avanzara sola.",
    },
    rejected: {
      title: "Verificacion no completada",
      message: "No hemos podido verificar tu identidad. Por favor intentalo de nuevo.",
      action: "/verify-identity",
      actionLabel: "Reintentar verificacion",
    },
    error: {
      title: "Error inesperado",
      message: "Hubo un problema al verificar tu identidad. Por favor intentalo de nuevo.",
      action: "/verify-identity",
      actionLabel: "Reintentar",
    },
  }

  const current = content[status]

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6 bg-card border border-border p-8">
        <div className="flex justify-center">
          {status === "loading" && (
            <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
          )}
          {(status === "approved" || status === "approved_no_session") && (
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          )}
          {(status === "rejected" || status === "error") && (
            <svg
              className="w-10 h-10 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          )}
        </div>

        <div className="space-y-2">
          <h1 className="font-serif text-xl text-foreground">{current.title}</h1>
          <p className="text-sm text-muted-foreground">{current.message}</p>
        </div>

        {current.action && current.actionLabel && (
          <button
            onClick={() => window.location.href = current.action!}
            className="px-6 py-2 border border-border text-foreground text-sm hover:bg-muted transition-colors"
          >
            {current.actionLabel}
          </button>
        )}
      </div>
    </main>
  )
}

export default function VerifyIdentityResultPage() {
  return (
    <Suspense>
      <VerifyIdentityResultContent />
    </Suspense>
  )
}

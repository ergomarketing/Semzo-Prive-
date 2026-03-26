"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"

type VerificationStatus = "loading" | "approved" | "pending" | "rejected" | "error"

function VerifyIdentityResultContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const [status, setStatus] = useState<VerificationStatus>("loading")
  const attemptsRef = useRef(0)
  const activeRef = useRef(true)

  useEffect(() => {
    activeRef.current = true
    attemptsRef.current = 0

    async function checkStatus() {
      if (!activeRef.current) return

      if (!sessionId) {
        setStatus("error")
        return
      }

      try {
        const res = await fetch(`/api/identity/check-status?sessionId=${sessionId}`)
        const data = await res.json()

        if (!activeRef.current) return

        if (data.status === "verified" || data.verified === true) {
          setStatus("approved")
          // Redirigir a dashboard directamente - no a onboarding-complete
          setTimeout(() => {
            window.location.href = "/dashboard"
          }, 2500)
        } else if (data.status === "requires_input" || data.status === "canceled") {
          setStatus("rejected")
        } else if (data.status === "processing") {
          attemptsRef.current += 1
          if (attemptsRef.current >= 12) {
            // 12 intentos x 5s = 60s máximo, luego muestra pending
            setStatus("pending")
            return
          }
          setTimeout(checkStatus, 5000)
        } else {
          setStatus("pending")
        }
      } catch {
        setStatus("error")
      }
    }

    checkStatus()

    return () => {
      activeRef.current = false
    }
  }, [sessionId, router])

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
      message:
        "Tu identidad ha sido verificada correctamente. Redirigiendo a tu dashboard...",
    },
    pending: {
      title: "Verificacion en proceso",
      message:
        "Estamos revisando tu documentacion. Te notificaremos por email cuando este lista. Ya puedes acceder a tu cuenta.",
      action: "/auth/login",
      actionLabel: "Iniciar sesion",
    },
    rejected: {
      title: "Verificacion no completada",
      message:
        "No hemos podido verificar tu identidad. Por favor intentalo de nuevo o contactanos.",
      action: "/verify-identity",
      actionLabel: "Reintentar verificacion",
    },
    error: {
      title: "Error inesperado",
      message: "No hemos podido procesar la verificacion. Por favor inicia sesion para continuar.",
      action: "/auth/login",
      actionLabel: "Iniciar sesion",
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
          {status === "approved" && (
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
          {status === "pending" && (
            <svg
              className="w-10 h-10 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
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
            onClick={() => router.push(current.action!)}
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

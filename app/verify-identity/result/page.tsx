"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

type VerificationStatus = "loading" | "approved" | "pending" | "rejected" | "error"

export default function VerifyIdentityResultPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const [status, setStatus] = useState<VerificationStatus>("loading")

  useEffect(() => {
    async function checkStatus() {
      if (!sessionId) {
        setStatus("error")
        return
      }

      try {
        const supabase = createClient()
        const { data: verification } = await supabase
          .from("identity_verifications")
          .select("status")
          .eq("stripe_verification_id", sessionId)
          .maybeSingle()

        if (!verification) {
          // Stripe aún no procesó el webhook — mostrar como pendiente
          setStatus("pending")
          return
        }

        if (verification.status === "verified") {
          setStatus("approved")
          setTimeout(() => router.push("/dashboard/membresia"), 3000)
        } else if (verification.status === "requires_input" || verification.status === "canceled") {
          setStatus("rejected")
        } else {
          setStatus("pending")
        }
      } catch {
        setStatus("error")
      }
    }

    checkStatus()
  }, [sessionId, router])

  const content: Record<VerificationStatus, { title: string; message: string; action?: string }> = {
    loading: {
      title: "Verificando tu identidad...",
      message: "Por favor espera un momento.",
    },
    approved: {
      title: "Identidad verificada",
      message: "Tu verificación ha sido completada con éxito. Redirigiendo a tu membresía...",
    },
    pending: {
      title: "Verificación en proceso",
      message: "Estamos revisando tu documentación. Te notificaremos por email cuando esté lista.",
      action: "/dashboard",
    },
    rejected: {
      title: "Verificación no completada",
      message: "No hemos podido verificar tu identidad. Por favor inténtalo de nuevo o contáctanos.",
      action: "/verify-identity",
    },
    error: {
      title: "Error inesperado",
      message: "No hemos podido procesar la verificación. Por favor intenta de nuevo.",
      action: "/dashboard",
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
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          )}
          {(status === "pending") && (
            <svg className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {(status === "rejected" || status === "error") && (
            <svg className="w-10 h-10 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          )}
        </div>

        <div className="space-y-2">
          <h1 className="font-serif text-xl text-foreground">{current.title}</h1>
          <p className="text-sm text-muted-foreground">{current.message}</p>
        </div>

        {current.action && (
          <button
            onClick={() => router.push(current.action!)}
            className="px-6 py-2 border border-border text-foreground text-sm hover:bg-muted transition-colors"
          >
            {status === "rejected" ? "Reintentar verificación" : "Ir al dashboard"}
          </button>
        )}
      </div>
    </main>
  )
}

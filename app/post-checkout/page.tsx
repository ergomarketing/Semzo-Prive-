"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"

function PostCheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const hasCalled = useRef(false)
  const attempts = useRef(0)
  const MAX_ATTEMPTS = 10

  const [message, setMessage] = useState("Confirmando tu suscripción...")
  const verifiedUserId = useRef<string | null>(null)

  const launchIdentityVerification = async () => {
    try {
      setMessage("Preparando verificación de identidad...")
      const res = await fetch("/api/identity/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: verifiedUserId.current }),
      })
      const data = await res.json()
      
      if (data.alreadyVerified) {
        setMessage("Identidad ya verificada. Redirigiendo al dashboard...")
        setTimeout(() => router.replace("/dashboard"), 1000)
        return
      }
      
      if (data.url) {
        window.location.href = data.url
      } else {
        // Si no hay URL, ir a página de verificación manual
        router.replace("/verify-identity")
      }
    } catch {
      router.replace("/verify-identity")
    }
  }

  useEffect(() => {
    if (!sessionId || hasCalled.current) return
    hasCalled.current = true

    const verify = async () => {
      attempts.current++

      try {
        const res = await fetch(`/api/stripe/verify-session?session_id=${sessionId}`)
        const data = await res.json()

        // Si el pago está activo o en trial, continuar al siguiente paso
        if (data.status === "active" || data.status === "trialing") {
          if (data.user_id) verifiedUserId.current = data.user_id

          // SIEMPRE ir a verificación de identidad después del pago
          // Solo skip si explícitamente está verificado
          if (data.identity_verified === true) {
            setMessage("Identidad verificada. Redirigiendo al dashboard...")
            setTimeout(() => router.replace("/dashboard"), 1000)
          } else {
            // Pago OK, ahora verificación de identidad
            await launchIdentityVerification()
          }
          return
        }

        // Webhook aún no procesó — reintentar con backoff
        if (attempts.current >= MAX_ATTEMPTS) {
          // Después de muchos intentos, igual lanzar verificación
          setMessage("Continuando con verificación de identidad...")
          await launchIdentityVerification()
          return
        }

        const delay = Math.min(1500 * attempts.current, 5000)
        setMessage(attempts.current > 3 ? "Procesando pago, un momento más..." : "Confirmando tu suscripción...")
        setTimeout(verify, delay)
      } catch {
        if (attempts.current >= MAX_ATTEMPTS) {
          // En caso de error, intentar lanzar verificación de todas formas
          await launchIdentityVerification()
          return
        }
        setTimeout(verify, 3000)
      }
    }

    verify()
  }, [sessionId, router])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 max-w-sm text-center px-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-foreground" />
        <p className="font-serif text-lg text-foreground text-balance">{message}</p>
        <p className="text-sm text-muted-foreground">Por favor espera, esto solo tomará unos segundos.</p>
      </div>
    </main>
  )
}

export default function PostCheckoutPage() {
  return (
    <Suspense>
      <PostCheckoutContent />
    </Suspense>
  )
}

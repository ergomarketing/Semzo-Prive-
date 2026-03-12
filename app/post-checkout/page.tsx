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
  const MAX_ATTEMPTS = 8

  const [message, setMessage] = useState("Confirmando tu suscripción...")

  useEffect(() => {
    if (!sessionId || hasCalled.current) return
    hasCalled.current = true

    const verify = async () => {
      attempts.current++

      try {
        const res = await fetch(`/api/stripe/verify-session?session_id=${sessionId}`)
        const data = await res.json()

        if (data.status === "active") {
          if (data.mode === "payment") {
            // Pase de bolso: sin identity, ir al dashboard directamente
            router.replace("/dashboard")
            return
          }

          if (data.identity_verified === true) {
            // Membresía activa y verificada: acceso completo
            router.replace("/dashboard")
          } else {
            // Membresía activa pero sin verificar identidad
            router.replace("/dashboard/membresia/status")
          }
          return
        }

        // Webhook aún no procesó — reintentar con backoff
        if (attempts.current >= MAX_ATTEMPTS) {
          // Después de 8 intentos (~16s) ir al status page para que el usuario vea el estado
          setMessage("Redirigiendo a tu área de membresía...")
          setTimeout(() => router.replace("/dashboard/membresia/status"), 1500)
          return
        }

        const delay = Math.min(2000 * attempts.current, 6000)
        setTimeout(verify, delay)
      } catch {
        if (attempts.current >= MAX_ATTEMPTS) {
          router.replace("/dashboard/membresia/status")
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

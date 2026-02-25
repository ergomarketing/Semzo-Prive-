"use client"

import { useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"

function PostCheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const hasCalled = useRef(false)

  useEffect(() => {
    if (!sessionId || hasCalled.current) return
    hasCalled.current = true

    const verify = async () => {
      try {
        const res = await fetch(`/api/stripe/verify-session?session_id=${sessionId}`)
        const data = await res.json()

        if (data.status === "active") {
          if (data.identity_verified === false) {
            router.replace("/verify-identity")
          } else {
            router.replace("/dashboard")
          }
        } else {
          // Reintentar en 2 segundos si el webhook aun no proceso
          setTimeout(verify, 2000)
        }
      } catch {
        setTimeout(verify, 2000)
      }
    }

    verify()
  }, [sessionId, router])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-foreground" />
        <p className="font-serif text-lg text-foreground text-balance text-center">
          Confirmando tu suscripción...
        </p>
        <p className="text-sm text-muted-foreground text-center">
          Por favor espera, esto solo tomará unos segundos.
        </p>
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

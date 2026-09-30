"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { CheckCircle2 } from "lucide-react"

function BagPurchaseConfirmationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const hasCalled = useRef(false)
  const attempts = useRef(0)
  const MAX_ATTEMPTS = 10

  const [status, setStatus] = useState<"loading" | "success" | "timeout">("loading")
  const [bagLabel, setBagLabel] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId || hasCalled.current) return
    hasCalled.current = true

    const verify = async () => {
      attempts.current++
      try {
        const res = await fetch(`/api/stripe/verify-bag-purchase?session_id=${sessionId}`)
        const data = await res.json()

        if (data.status === "completed") {
          setBagLabel(data.bagLabel || null)
          setStatus("success")
          return
        }

        if (attempts.current >= MAX_ATTEMPTS) {
          setStatus("timeout")
          return
        }

        setTimeout(verify, Math.min(1500 * attempts.current, 5000))
      } catch {
        if (attempts.current >= MAX_ATTEMPTS) {
          setStatus("timeout")
          return
        }
        setTimeout(verify, 3000)
      }
    }

    verify()
  }, [sessionId])

  if (status === "loading") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6 max-w-sm text-center px-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-foreground" />
          <p className="font-serif text-lg text-foreground text-balance">Confirmando tu compra...</p>
          <p className="text-sm text-muted-foreground">Por favor espera, esto solo tomará unos segundos.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 max-w-md text-center px-4">
        <CheckCircle2 className="h-14 w-14 text-foreground" strokeWidth={1.5} />
        <h1 className="font-serif text-2xl text-foreground text-balance">
          {status === "success" ? "¡Enhorabuena, ya es tuyo!" : "Compra en proceso"}
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {status === "success"
            ? `${bagLabel ? `${bagLabel} ` : "Este bolso "}pasa a formar parte de tu colección. Te hemos enviado la confirmación por email.`
            : "Estamos confirmando tu pago con Stripe. Recibirás un email en cuanto se complete."}
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-2 rounded-full bg-foreground px-8 py-3 text-xs font-medium uppercase tracking-widest text-background transition hover:opacity-90"
        >
          Ir a mi cuenta
        </button>
      </div>
    </main>
  )
}

export default function BagPurchaseConfirmationPage() {
  return (
    <Suspense>
      <BagPurchaseConfirmationContent />
    </Suspense>
  )
}

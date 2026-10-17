"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle2 } from "lucide-react"

type Status = "loading" | "success" | "timeout" | "failed"

const MAX_ATTEMPTS = 12

function ColeccionaConfirmationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const started = useRef(false)

  const [status, setStatus] = useState<Status>("loading")
  const [bagLabel, setBagLabel] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId || started.current) return
    started.current = true
    let attempts = 0

    const verify = async () => {
      attempts++
      try {
        const res = await fetch(`/api/user/ownership/verify-purchase?session_id=${encodeURIComponent(sessionId)}`)
        const data = await res.json().catch(() => ({}))

        if (data.status === "completed") {
          setBagLabel(data.bagLabel || null)
          setStatus("success")
          return
        }
        if (data.status === "failed") {
          setStatus("failed")
          return
        }
      } catch {
        // se reintenta
      }
      if (attempts >= MAX_ATTEMPTS) {
        setStatus("timeout")
        return
      }
      setTimeout(verify, Math.min(1500 * attempts, 5000))
    }

    verify()
  }, [sessionId])

  if (!sessionId) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <p className="text-sm text-muted-foreground">No encontramos esta compra.</p>
        <button onClick={() => router.push("/dashboard")} className="mt-4 underline text-sm">
          Ir a mi cuenta
        </button>
      </main>
    )
  }

  if (status === "loading") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="flex max-w-sm flex-col items-center gap-6 px-4 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-border border-t-foreground" />
          <p className="font-serif text-xl text-foreground text-balance">Confirmando tu compra...</p>
          <p className="text-sm text-muted-foreground">Solo tardará unos segundos. No cierres esta página.</p>
        </div>
      </main>
    )
  }

  const title =
    status === "success"
      ? "¡Enhorabuena, ya es tuyo!"
      : status === "failed"
        ? "El pago no se completó"
        : "Estamos confirmando tu pago"

  const message =
    status === "success"
      ? `${bagLabel ? bagLabel : "Tu bolso"} pasa a formar parte de tu colección. Te hemos enviado la confirmación por email y te escribiremos para coordinar la factura y la entrega.`
      : status === "failed"
        ? "No se ha realizado ningún cargo. Puedes volver a intentarlo desde tu cuenta."
        : "Tu pago está siendo procesado por Stripe. En cuanto se confirme recibirás un email y verás el bolso como tuyo en tu cuenta. No hace falta que hagas nada más."

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex max-w-lg flex-col items-center gap-7 text-center">
        <CheckCircle2
          className={`h-20 w-20 ${status === "failed" ? "text-rose-500" : "text-foreground"}`}
          strokeWidth={1.25}
        />
        <h1 className="font-serif text-4xl text-foreground text-balance">{title}</h1>
        <p className="text-base leading-relaxed text-muted-foreground text-pretty">{message}</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-2 rounded-full bg-foreground px-10 py-4 text-xs font-medium uppercase tracking-widest text-background transition hover:opacity-90"
        >
          Ir a mi cuenta
        </button>
      </div>
    </main>
  )
}

export default function ColeccionaConfirmationPage() {
  return (
    <Suspense>
      <ColeccionaConfirmationContent />
    </Suspense>
  )
}

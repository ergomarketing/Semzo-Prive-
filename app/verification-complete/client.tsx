"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function VerificationCompleteClient({
  userId,
  intentId,
  sessionId,
}: {
  userId: string
  intentId?: string
  sessionId?: string
}) {
  const router = useRouter()
  const [status, setStatus] = useState<"checking" | "verified" | "pending">("checking")
  const attemptsRef = useRef(0)
  const activeRef = useRef(true)

  useEffect(() => {
    activeRef.current = true
    attemptsRef.current = 0

    const checkStatus = async () => {
      if (!activeRef.current) return

      try {
        const params = new URLSearchParams()
        // sessionId (vs_xxx) permite llamar a Stripe directamente — mucho mas rapido que esperar el webhook
        if (sessionId) params.set("sessionId", sessionId)
        else if (intentId) params.set("intentId", intentId)
        params.set("userId", userId)

        const response = await fetch(`/api/identity/check-status?${params.toString()}`)
        const data = await response.json()

        if (!activeRef.current) return

        if (data.verified) {
          try {
            await fetch("/api/membership/reconcile", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
            })
          } catch {
            // no critico
          }
          setStatus("verified")
          setTimeout(() => router.push("/dashboard"), 2000)
          return
        }

        attemptsRef.current += 1
        if (attemptsRef.current >= 20) {
          setStatus("pending")
          return
        }

        setTimeout(checkStatus, 5000)
      } catch {
        if (!activeRef.current) return
        attemptsRef.current += 1
        setTimeout(checkStatus, 10000)
      }
    }

    checkStatus()

    return () => {
      activeRef.current = false
    }
  }, [userId, intentId, router])

  return (
    <div className="min-h-screen bg-[#fff0f3] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {status === "checking" && (
          <>
            <Loader2 className="h-16 w-16 text-[#1a1a4b] mx-auto animate-spin" />
            <h1 className="text-2xl font-semibold text-[#1a1a4b] mt-4">Verificando tu identidad...</h1>
            <p className="text-gray-600 mt-2">
              Estamos procesando tu verificación de identidad. Esto puede tomar unos momentos.
            </p>
            <p className="text-sm text-gray-500 mt-4">Consultando estado... ({attemptsRef.current + 1}/20)</p>
            {attemptsRef.current > 5 && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  El proceso está tomando más tiempo de lo usual. Por favor espera mientras confirmamos tu verificación
                  con Stripe.
                </p>
              </div>
            )}
          </>
        )}

        {status === "verified" && (
          <>
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
            <h1 className="text-2xl font-semibold text-[#1a1a4b] mt-4">¡Verificación exitosa!</h1>
            <p className="text-gray-600 mt-2">
              Tu identidad ha sido verificada correctamente. Tu membresía está ahora activa.
            </p>
            <p className="text-sm text-gray-500 mt-4">Redirigiendo a tu dashboard...</p>
          </>
        )}

        {status === "pending" && (
          <>
            <AlertCircle className="h-16 w-16 text-blue-600 mx-auto" />
            <h1 className="text-2xl font-semibold text-[#1a1a4b] mt-4">Verificación en proceso</h1>
            <p className="text-gray-600 mt-2">
              Tu verificación ha sido enviada y está siendo procesada. Recibirás una confirmación pronto.
            </p>
            <div className="mt-6 space-y-3">
              <Button
                onClick={() => router.push("/dashboard")}
                className="w-full bg-[#1a1a4b] hover:bg-[#1a1a4b]/90"
              >
                Ir a mi dashboard
              </Button>
              <Button onClick={() => router.refresh()} variant="outline" className="w-full">
                Verificar de nuevo
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Si completaste la verificación, el estado se actualizará automáticamente en unos minutos.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function VerificationCompleteClient({
  userId,
  intentId,
}: {
  userId: string
  intentId?: string
}) {
  const router = useRouter()
  const [status, setStatus] = useState<"checking" | "verified" | "pending">("checking")
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const params = new URLSearchParams()
        if (intentId) params.set("intentId", intentId)
        params.set("userId", userId)

        const response = await fetch(`/api/identity/check-status?${params.toString()}`)
        const data = await response.json()

        console.log("[v0] Polling verification status:", {
          attempt: attempts + 1,
          verified: data.verified,
          status: data.status,
        })

        // TIMING CORRECTO: Reconciliar cuando identity_verified=true PERO status!=active
        if (data.verified && data.status !== "active") {
          console.log("[v0] Identity verified but membership not active - calling reconcile")
          
          try {
            const reconResponse = await fetch("/api/membership/reconcile", {
              method: "POST",
              headers: { "Content-Type": "application/json" }
            })
            const reconData = await reconResponse.json()
            console.log("[v0] Reconciliation result:", reconData)
            
            if (reconData.success) {
              console.log("[v0] Reconciliation succeeded, redirecting...")
              setStatus("verified")
              setTimeout(() => {
                router.push("/dashboard")
              }, 2000)
              return
            }
          } catch (reconError) {
            console.error("[v0] Reconciliation error:", reconError)
          }
          
          // Si reconcile falla, seguir polling
          setAttempts((prev) => prev + 1)
          setTimeout(checkStatus, 3000)
        } else if (data.status === "active") {
          // Ya está activo (webhook ganó la carrera)
          console.log("[v0] Membership already active")
          setStatus("verified")
          setTimeout(() => {
            router.push("/dashboard")
          }, 2000)
        } else if (attempts >= 20) {
          console.log("[v0] Verification still pending after 60s")
          setStatus("pending")
        } else {
          setAttempts((prev) => prev + 1)
          setTimeout(checkStatus, 3000)
        }
      } catch (error) {
        console.error("[v0] Error checking status:", error)
        setAttempts((prev) => prev + 1)
        setTimeout(checkStatus, 5000)
      }
    }

    checkStatus()
  }, [userId, intentId, router, attempts])

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
            <p className="text-sm text-gray-500 mt-4">Consultando estado... ({attempts + 1}/20)</p>
            {attempts > 5 && (
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

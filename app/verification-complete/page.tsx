"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle, Loader2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function VerificationCompletePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const userId = searchParams.get("userId")
  const [status, setStatus] = useState<"checking" | "verified" | "failed">("checking")

  useEffect(() => {
    const checkStatus = async () => {
      if (!userId) {
        setStatus("failed")
        return
      }

      try {
        const response = await fetch(`/api/user/check-verification-status?userId=${userId}`)
        const data = await response.json()

        if (data.verified) {
          setStatus("verified")
        } else {
          // Esperar y volver a verificar
          setTimeout(checkStatus, 3000)
        }
      } catch (error) {
        setStatus("failed")
      }
    }

    checkStatus()
  }, [userId])

  return (
    <div className="min-h-screen bg-[#fff0f3] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {status === "checking" && (
          <>
            <Loader2 className="h-16 w-16 text-[#1a1a4b] mx-auto animate-spin" />
            <h1 className="text-2xl font-semibold text-[#1a1a4b] mt-4">Verificando...</h1>
            <p className="text-gray-600 mt-2">Estamos procesando tu verificación de identidad.</p>
          </>
        )}

        {status === "verified" && (
          <>
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
            <h1 className="text-2xl font-semibold text-[#1a1a4b] mt-4">¡Verificación exitosa!</h1>
            <p className="text-gray-600 mt-2">
              Tu identidad ha sido verificada correctamente. Ya puedes continuar con tu membresía.
            </p>
            <Button onClick={() => router.push("/cart")} className="mt-6 bg-[#1a1a4b] hover:bg-[#1a1a4b]/90">
              Continuar con el pago
            </Button>
          </>
        )}

        {status === "failed" && (
          <>
            <XCircle className="h-16 w-16 text-red-600 mx-auto" />
            <h1 className="text-2xl font-semibold text-[#1a1a4b] mt-4">Verificación fallida</h1>
            <p className="text-gray-600 mt-2">No pudimos verificar tu identidad. Por favor, contacta con soporte.</p>
            <Button onClick={() => router.push("/support")} className="mt-6 bg-[#1a1a4b] hover:bg-[#1a1a4b]/90">
              Contactar soporte
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

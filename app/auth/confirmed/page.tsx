"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight, Loader2 } from "lucide-react"
import { getSupabaseBrowser } from "@/lib/supabase-browser"

export default function ConfirmedPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)
  const [checkingMembership, setCheckingMembership] = useState(true)
  const [hasPendingMembership, setHasPendingMembership] = useState(false)

  useEffect(() => {
    const activatePendingMembership = async () => {
      try {
        const supabase = getSupabaseBrowser()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user?.email) {
          const response = await fetch("/api/user/activate-pending-membership", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: user.email, userId: user.id }),
          })

          const data = await response.json()

          if (data.activated) {
            setHasPendingMembership(true)
          }
        }
      } catch (error) {
        console.error("Error activating pending membership:", error)
      } finally {
        setCheckingMembership(false)
      }
    }

    activatePendingMembership()
  }, [])

  useEffect(() => {
    if (checkingMembership) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push(hasPendingMembership ? "/dashboard?welcome=true" : "/auth/login")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router, checkingMembership, hasPendingMembership])

  const handleGoToNext = () => {
    router.push(hasPendingMembership ? "/dashboard?welcome=true" : "/auth/login")
  }

  if (checkingMembership) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#1a1a4b]" />
          <p className="mt-4 text-[#1a1a4b]/70">Verificando tu cuenta...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <Card className="w-full max-w-md text-center border-[#1a1a4b]/10">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 w-16 h-16 bg-[#f4c4cc]/30 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-[#1a1a4b]" />
          </div>
          <CardTitle className="text-2xl font-serif text-[#1a1a4b]">¡Email Confirmado!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-[#1a1a4b]/80">
              {hasPendingMembership
                ? "Tu cuenta ha sido confirmada y tu membresía activada exitosamente."
                : "Tu cuenta ha sido confirmada exitosamente."}
            </p>
            <p className="text-sm text-[#1a1a4b]/60">
              {hasPendingMembership
                ? "Ya puedes acceder a tu dashboard y disfrutar de todos los beneficios."
                : "Ya puedes iniciar sesión y acceder a tu dashboard personalizado."}
            </p>
          </div>

          <div className="space-y-4">
            <Button onClick={handleGoToNext} className="w-full bg-[#1a1a4b] hover:bg-[#1a1a4b]/90 text-white">
              {hasPendingMembership ? "Ir al Dashboard" : "Iniciar Sesión"}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>

            <p className="text-xs text-[#1a1a4b]/40">Redirigiendo automáticamente en {countdown} segundos...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

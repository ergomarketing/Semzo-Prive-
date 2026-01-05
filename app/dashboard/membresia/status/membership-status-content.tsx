"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export function MembershipStatusContent() {
  const [status, setStatus] = useState<{
    membershipStatus: string
    verificationStatus: string
    membershipPlan: string
    loading: boolean
  }>({
    membershipStatus: "",
    verificationStatus: "",
    membershipPlan: "",
    loading: true,
  })
  const [activating, setActivating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadStatus()
  }, [])

  async function loadStatus() {
    const supabase = createBrowserClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login")
      return
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("membership_status, membership_plan")
      .eq("id", user.id)
      .single()

    const { data: verification } = await supabase
      .from("identity_verifications")
      .select("status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    setStatus({
      membershipStatus: profile?.membership_status || "",
      verificationStatus: verification?.status || "not_started",
      membershipPlan: profile?.membership_plan || "",
      loading: false,
    })
  }

  async function handleStartVerification() {
    try {
      const response = await fetch("/api/identity/create-session", {
        method: "POST",
        credentials: "include",
      })

      const data = await response.json()

      if (response.ok && data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || "Error al iniciar verificación")
      }
    } catch (error) {
      console.error("[v0] Error:", error)
      alert("Error técnico. Por favor, intenta nuevamente.")
    }
  }

  async function handleActivateMembership() {
    setActivating(true)
    try {
      const response = await fetch("/api/activate-membership", {
        method: "POST",
        credentials: "include",
      })

      if (response.ok) {
        await loadStatus()
        router.push("/catalog")
      } else {
        const data = await response.json()
        alert(data.error || "Error al activar membresía")
      }
    } catch (error) {
      console.error("[v0] Error:", error)
      alert("Error técnico")
    } finally {
      setActivating(false)
    }
  }

  if (status.loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const step1Complete = status.membershipPlan !== "free"
  const step2Complete = status.verificationStatus === "approved"
  const step3Complete = status.membershipStatus === "active"

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Estado de tu Membresía</CardTitle>
        <CardDescription>Sigue estos pasos para activar tu membresía {status.membershipPlan}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Payment */}
        <div className="flex items-start gap-4">
          {step1Complete ? (
            <CheckCircle2 className="h-6 w-6 text-green-600 mt-1" />
          ) : (
            <Clock className="h-6 w-6 text-gray-400 mt-1" />
          )}
          <div className="flex-1">
            <h3 className="font-semibold">Paso 1: Pago confirmado</h3>
            <p className="text-sm text-muted-foreground">
              {step1Complete ? "Tu pago ha sido procesado correctamente" : "Procesando tu pago..."}
            </p>
          </div>
          {step1Complete && <Badge variant="secondary">Completado</Badge>}
        </div>

        {/* Step 2: Identity Verification */}
        <div className="flex items-start gap-4">
          {step2Complete ? (
            <CheckCircle2 className="h-6 w-6 text-green-600 mt-1" />
          ) : status.verificationStatus === "pending" ? (
            <Loader2 className="h-6 w-6 text-blue-600 animate-spin mt-1" />
          ) : status.verificationStatus === "rejected" ? (
            <AlertCircle className="h-6 w-6 text-red-600 mt-1" />
          ) : (
            <Clock className="h-6 w-6 text-gray-400 mt-1" />
          )}
          <div className="flex-1">
            <h3 className="font-semibold">Paso 2: Verificación de identidad</h3>
            <p className="text-sm text-muted-foreground">
              {step2Complete
                ? "Tu identidad ha sido verificada correctamente"
                : status.verificationStatus === "pending"
                  ? "Estamos verificando tu identidad. Esto puede tomar unos minutos."
                  : status.verificationStatus === "rejected"
                    ? "Necesitamos verificar algunos datos adicionales"
                    : "Completa este paso rápido y seguro"}
            </p>
            {status.verificationStatus === "not_started" && step1Complete && (
              <Button onClick={handleStartVerification} className="mt-3">
                Iniciar Verificación
              </Button>
            )}
            {status.verificationStatus === "rejected" && (
              <Button onClick={handleStartVerification} variant="outline" className="mt-3 bg-transparent">
                Reintentar Verificación
              </Button>
            )}
          </div>
          {step2Complete && <Badge variant="secondary">Completado</Badge>}
          {status.verificationStatus === "pending" && <Badge>En progreso</Badge>}
        </div>

        {/* Step 3: Activation */}
        <div className="flex items-start gap-4">
          {step3Complete ? (
            <CheckCircle2 className="h-6 w-6 text-green-600 mt-1" />
          ) : (
            <Clock className="h-6 w-6 text-gray-400 mt-1" />
          )}
          <div className="flex-1">
            <h3 className="font-semibold">Paso 3: Activación de membresía</h3>
            <p className="text-sm text-muted-foreground">
              {step3Complete
                ? "Tu membresía está activa. ¡Disfruta de nuestro catálogo!"
                : step2Complete
                  ? "¡Ya casi! Activa tu membresía para comenzar"
                  : "Se activará automáticamente tras verificar tu identidad"}
            </p>
            {step2Complete && !step3Complete && (
              <Button onClick={handleActivateMembership} disabled={activating} className="mt-3">
                {activating ? "Activando..." : "Activar mi membresía ahora"}
              </Button>
            )}
            {step3Complete && (
              <Button onClick={() => router.push("/catalog")} className="mt-3">
                Explorar catálogo
              </Button>
            )}
          </div>
          {step3Complete && <Badge variant="secondary">Completado</Badge>}
        </div>
      </CardContent>
    </Card>
  )
}

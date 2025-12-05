"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../hooks/useAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Crown, Check, Loader2, Calendar, CreditCard, AlertCircle, XCircle, Receipt, Pause, Play } from "lucide-react"
import { supabase } from "../../lib/supabaseClient"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface MembershipData {
  membership_status: string
  membership_type: string | null
  created_at: string | null
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
}

interface Subscription {
  id: string
  status: string
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  canceled_at: string | null
  membership_type: string
  stripe_subscription_id?: string
}

interface Payment {
  id: string
  amount: number
  currency: string
  status: string
  description: string
  payment_date: string
}

export default function MembresiaPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [membershipData, setMembershipData] = useState<MembershipData | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [canceling, setCanceling] = useState(false)
  const [pausing, setPausing] = useState(false)
  const [showPayments, setShowPayments] = useState(false)
  const hasFetched = useRef(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!user || hasFetched.current) return
      hasFetched.current = true

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("membership_status, membership_type, created_at, stripe_customer_id, stripe_subscription_id")
          .eq("id", user.id)
          .maybeSingle()

        if (error) throw error
        if (data) setMembershipData(data)

        const response = await fetch("/api/user/subscription")
        if (response.ok) {
          const subData = await response.json()
          setSubscription(subData.subscription)
          setPayments(subData.payments || [])
        }
      } catch (error) {
        console.error("Error fetching membership:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  const handleCancelSubscription = async () => {
    setCanceling(true)
    try {
      const response = await fetch("/api/user/cancel-subscription", {
        method: "POST",
      })

      if (response.ok) {
        const subResponse = await fetch("/api/user/subscription")
        if (subResponse.ok) {
          const subData = await subResponse.json()
          setSubscription(subData.subscription)
        }
        // Refrescar datos de membresía
        const { data } = await supabase
          .from("profiles")
          .select("membership_status, membership_type, created_at, stripe_customer_id, stripe_subscription_id")
          .eq("id", user?.id)
          .maybeSingle()
        if (data) setMembershipData(data)
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Error al cancelar suscripción")
      }
    } catch (error) {
      console.error("Error canceling subscription:", error)
      alert("Error al cancelar suscripción")
    } finally {
      setCanceling(false)
    }
  }

  const handlePauseSubscription = async () => {
    setPausing(true)
    try {
      const response = await fetch("/api/user/pause-subscription", {
        method: "POST",
      })

      if (response.ok) {
        const subResponse = await fetch("/api/user/subscription")
        if (subResponse.ok) {
          const subData = await subResponse.json()
          setSubscription(subData.subscription)
        }
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Error al pausar suscripción")
      }
    } catch (error) {
      console.error("Error pausing subscription:", error)
      alert("Error al pausar suscripción")
    } finally {
      setPausing(false)
    }
  }

  const handleResumeSubscription = async () => {
    setPausing(true)
    try {
      const response = await fetch("/api/user/resume-subscription", {
        method: "POST",
      })

      if (response.ok) {
        const subResponse = await fetch("/api/user/subscription")
        if (subResponse.ok) {
          const subData = await subResponse.json()
          setSubscription(subData.subscription)
        }
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Error al reanudar suscripción")
      }
    } catch (error) {
      console.error("Error resuming subscription:", error)
      alert("Error al reanudar suscripción")
    } finally {
      setPausing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-slate-600" />
      </div>
    )
  }

  const membershipType = membershipData?.membership_type || "free"
  const isActive = membershipData?.membership_status === "active"
  const isPaused = membershipData?.membership_status === "paused"
  const isPastDue = membershipData?.membership_status === "past_due"

  const membershipInfo = {
    petite: { name: "Petite", price: "19,99", period: "semana" },
    essentiel: { name: "L'Essentiel", price: "59", period: "mes" },
    signature: { name: "Signature", price: "129", period: "mes" },
    prive: { name: "Privé", price: "479", period: "mes" },
    free: { name: "Free", price: "0", period: "mes" },
  }

  const currentMembership = membershipInfo[membershipType as keyof typeof membershipInfo] || membershipInfo.free
  const isPetite = membershipType === "petite"

  const petiteFeatures = [
    "1 bolso por semana",
    "Renovación flexible",
    "Ampliable hasta 3 meses",
    "Envío gratuito",
    "Seguro incluido",
  ]

  const priveFeatures = [
    "Acceso completo al catálogo exclusivo",
    "Reservas prioritarias",
    "Lista de espera ilimitada",
    "Envío gratuito",
    "Soporte prioritario 24/7",
    "Acceso anticipado a nuevas colecciones",
    "Eventos exclusivos para miembros",
  ]

  const freeFeatures = [
    "Acceso básico al catálogo",
    "Ver bolsos disponibles",
    "Lista de espera limitada",
    "Soporte por email",
  ]

  const getFeatures = () => {
    if (isPetite) return petiteFeatures
    if (isActive || isPaused) return priveFeatures
    return freeFeatures
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      succeeded: { label: "Pagado", className: "bg-green-100 text-green-800" },
      failed: { label: "Fallido", className: "bg-red-100 text-red-800" },
      pending: { label: "Pendiente", className: "bg-yellow-100 text-yellow-800" },
      refunded: { label: "Reembolsado", className: "bg-gray-100 text-gray-800" },
    }
    const c = config[status] || { label: status, className: "bg-gray-100" }
    return <Badge className={c.className}>{c.label}</Badge>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-serif text-slate-900 mb-2">Mi Membresía</h2>
        <p className="text-slate-600">Gestiona tu membresía y accede a beneficios exclusivos</p>
      </div>

      {isPastDue && (
        <Card className="border-red-300 bg-red-50 mb-6">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-medium text-red-800">Pago pendiente</p>
              <p className="text-sm text-red-600">
                Tu último pago no se pudo procesar. Por favor actualiza tu método de pago.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {isPaused && (
        <Card className="border-yellow-300 bg-yellow-50 mb-6">
          <CardContent className="flex items-center gap-3 py-4">
            <Pause className="h-5 w-5 text-yellow-600" />
            <div className="flex-1">
              <p className="font-medium text-yellow-800">Membresía pausada</p>
              <p className="text-sm text-yellow-600">
                Tu membresía está pausada. No se te cobrará hasta que la reanudes.
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleResumeSubscription}
              disabled={pausing}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              <Play className="h-4 w-4 mr-1" />
              {pausing ? "..." : "Reanudar"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="border-2 border-slate-900 mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-serif text-2xl flex items-center gap-2">
              {(isActive || isPaused) && <Crown className="h-6 w-6 text-slate-900" />}
              {currentMembership.name}
            </CardTitle>
            <Badge
              variant="secondary"
              className={`
              ${
                isPaused
                  ? "bg-yellow-100 text-yellow-800"
                  : subscription?.cancel_at_period_end
                    ? "bg-red-100 text-red-800"
                    : "bg-rose-50 text-[#1a2c4e]"
              } 
              border-rose-200
            `}
            >
              {isPaused ? "Pausada" : subscription?.cancel_at_period_end ? "Se cancela pronto" : "Actual"}
            </Badge>
          </div>
          <CardDescription className="text-3xl font-bold text-slate-900 mt-2">
            €{currentMembership.price}/{currentMembership.period}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 mb-6">
            {getFeatures().map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <Check className="h-5 w-5 text-slate-600 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">{feature}</span>
              </li>
            ))}
          </ul>

          {isActive && (
            <Button
              onClick={() => router.push("/catalog")}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-serif"
            >
              Explorar Catálogo y Reservar
            </Button>
          )}

          {isPetite && isActive && (
            <Button
              onClick={() => router.push("/catalog")}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-serif"
            >
              Elegir mi bolso de la semana
            </Button>
          )}

          {!isActive && !isPaused && !isPetite && (
            <Button
              onClick={() => router.push("/membership/upgrade")}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-serif"
            >
              <Crown className="h-4 w-4 mr-2" />
              Obtener Membresía
            </Button>
          )}
        </CardContent>
      </Card>

      {(isActive || isPaused) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Información de Suscripción
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-200">
              <span className="text-slate-600 font-medium">ESTADO</span>
              <Badge
                variant="secondary"
                className={
                  isPaused
                    ? "bg-yellow-100 text-yellow-800"
                    : subscription?.cancel_at_period_end
                      ? "bg-red-100 text-red-800"
                      : "bg-green-100 text-green-800"
                }
              >
                {isPaused
                  ? "Pausada"
                  : subscription?.cancel_at_period_end
                    ? "Se cancela al final del período"
                    : "Activa"}
              </Badge>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-slate-200">
              <span className="text-slate-600 font-medium">PLAN</span>
              <span className="font-medium text-slate-900">{currentMembership.name}</span>
            </div>

            {subscription && (
              <div className="flex items-center justify-between py-3 border-b border-slate-200">
                <span className="text-slate-600 font-medium">PRÓXIMO COBRO</span>
                <span className="font-medium text-slate-900">
                  {subscription.cancel_at_period_end || isPaused
                    ? "No se renovará"
                    : new Date(subscription.current_period_end).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between py-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-600" />
                <span className="text-slate-600 font-medium">MIEMBRO DESDE</span>
              </div>
              <span className="font-medium text-slate-900">
                {membershipData?.created_at
                  ? new Date(membershipData.created_at).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "No disponible"}
              </span>
            </div>

            <div className="pt-4 space-y-3">
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => setShowPayments(!showPayments)}
              >
                <Receipt className="h-4 w-4 mr-2" />
                {showPayments ? "Ocultar historial" : "Ver historial de pagos"}
              </Button>

              {isActive && !subscription?.cancel_at_period_end && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full text-[#1a2c4e] border-[#1a2c4e]/20 hover:bg-rose-50/50 bg-transparent"
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Pausar membresía
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Pausar tu membresía?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tu membresía se pausará y no se te cobrará hasta que la reanudes. Perderás acceso temporal a los
                        beneficios pero podrás reactivarla cuando quieras.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handlePauseSubscription}
                        className="bg-[#1a2c4e] hover:bg-[#1a2c4e]/90"
                        disabled={pausing}
                      >
                        {pausing ? "Pausando..." : "Sí, pausar"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {(isActive || isPaused) && !subscription?.cancel_at_period_end && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full text-slate-600 border-slate-200 hover:bg-rose-50/30 bg-transparent"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancelar membresía
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Cancelar tu membresía?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {subscription?.current_period_end
                          ? `Tu membresía seguirá activa hasta el ${new Date(subscription.current_period_end).toLocaleDateString("es-ES")}. Después de esa fecha, perderás acceso a todos los beneficios.`
                          : "Una vez cancelada, perderás acceso a todos los beneficios de tu membresía."}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Mantener membresía</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancelSubscription}
                        className="bg-slate-700 hover:bg-slate-800"
                        disabled={canceling}
                      >
                        {canceling ? "Cancelando..." : "Sí, cancelar"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {showPayments && payments.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="font-serif">Historial de Pagos</CardTitle>
            <CardDescription>Tus últimos pagos y transacciones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        payment.status === "succeeded"
                          ? "bg-green-500"
                          : payment.status === "failed"
                            ? "bg-red-500"
                            : "bg-yellow-500"
                      }`}
                    />
                    <div>
                      <p className="font-medium text-slate-900">{payment.description || "Pago de membresía"}</p>
                      <p className="text-sm text-slate-500">
                        {new Date(payment.payment_date).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">€{(payment.amount / 100).toFixed(2)}</p>
                    {getStatusBadge(payment.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {showPayments && payments.length === 0 && (
        <Card className="mb-6">
          <CardContent className="py-8 text-center text-slate-500">No hay pagos registrados</CardContent>
        </Card>
      )}
    </div>
  )
}

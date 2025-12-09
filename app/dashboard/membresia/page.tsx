"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../hooks/useAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Crown, Check, Loader2, Calendar, CreditCard, AlertCircle, Receipt } from "lucide-react"
import { supabase } from "../../lib/supabaseClient"

interface MembershipData {
  membership_status: string
  membership_type: string | null
  created_at: string | null
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  active_bag_pass?: string | null
  bag_pass_expires?: string | null
}

interface Subscription {
  id: string
  status: string
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  canceled_at: string | null
  membership_type: string
  stripe_subscription_id?: string | null
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
  const [subscription, setSubscription] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [canceling, setCanceling] = useState(false)
  const [pausing, setPausing] = useState(false)
  const [showPayments, setShowPayments] = useState(false)
  const hasFetchedRef = useRef(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id || hasFetchedRef.current) return
      hasFetchedRef.current = true

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select(
            "membership_status, membership_type, created_at, stripe_customer_id, stripe_subscription_id, active_bag_pass, bag_pass_expires",
          )
          .eq("id", user.id)
          .maybeSingle()

        console.log("[v0] Membership data fetched:", data)

        if (error) throw error
        if (data) setMembershipData(data)

        // Fetch subscription and payment history
        try {
          const response = await fetch("/api/user/subscription")
          if (response.ok) {
            const subData = await response.json()
            setSubscription(subData.subscription)
            setPayments(subData.payments || [])
          }
        } catch (subError) {
          console.log("No subscription data available")
        }
      } catch (error) {
        console.error("Error fetching membership:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user?.id]) // Use user?.id instead of user object to prevent re-renders

  const handleCancelSubscription = async () => {
    setCanceling(true)
    try {
      const response = await fetch("/api/user/cancel-subscription", {
        method: "POST",
      })

      if (response.ok) {
        const { data } = await supabase
          .from("profiles")
          .select(
            "membership_status, membership_type, created_at, stripe_customer_id, stripe_subscription_id, active_bag_pass, bag_pass_expires",
          )
          .eq("id", user?.id)
          .maybeSingle()

        if (data) setMembershipData(data)

        const subResponse = await fetch("/api/user/subscription")
        if (subResponse.ok) {
          const subData = await subResponse.json()
          setSubscription(subData.subscription)
        }
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Error al cancelar la suscripción")
      }
    } catch (error) {
      console.error("Error canceling subscription:", error)
      alert("Error al cancelar la suscripción")
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
      }
    } catch (error) {
      console.error("Error pausing subscription:", error)
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
  const isActive = membershipData?.membership_status === "active" && membershipType !== "free"
  const isPastDue = membershipData?.membership_status === "past_due"

  console.log("[v0] Rendering membership page:", { membershipType, isActive, membershipData })

  const membershipInfo = {
    petite: { name: "Petite", price: "19,99", period: "semana" },
    essentiel: { name: "L'Essentiel", price: "59", period: "mes" },
    signature: { name: "Signature", price: "129", period: "mes" },
    prive: { name: "Privé", price: "189", period: "mes" },
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
    "Pases de Bolso disponibles para colecciones premium",
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
    if (isActive) return priveFeatures
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
        <Card className="border-rose-300 bg-rose-50 mb-6">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-rose-600" />
            <div>
              <p className="font-medium text-rose-800">Pago pendiente</p>
              <p className="text-sm text-rose-600">
                Tu último pago no se pudo procesar. Por favor actualiza tu método de pago.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-2 border-indigo-dark mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-serif text-2xl flex items-center gap-2">
              {isActive && <Crown className="h-6 w-6 text-indigo-dark" />}
              {currentMembership.name}
            </CardTitle>
            <Badge variant="secondary" className="bg-rose-50 text-indigo-dark border-rose-200">
              {isActive ? "Activa" : "Inactiva"}
            </Badge>
          </div>
          <CardDescription className="text-3xl font-bold text-indigo-dark mt-2">
            €{currentMembership.price}/{currentMembership.period}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 mb-6">
            {getFeatures().map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <Check className="h-5 w-5 text-indigo-dark mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">{feature}</span>
              </li>
            ))}
          </ul>

          {isActive && subscription?.current_period_end && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 mb-4">
              <p className="text-sm text-slate-600">
                <strong>Válida hasta:</strong>{" "}
                {new Date(subscription.current_period_end).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          )}

          {isPetite && isActive && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 mb-4">
                <h4 className="font-medium text-indigo-dark mb-2">Pases de Bolso Disponibles</h4>
                <p className="text-sm text-slate-600 mb-3">
                  Con tu membresía Petite, puedes acceder a bolsos de colecciones premium comprando un Pase de Bolso:
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-white rounded-lg">
                    <p className="text-xs text-slate-500">L'Essentiel</p>
                    <p className="font-bold text-indigo-dark">52€</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg">
                    <p className="text-xs text-slate-500">Signature</p>
                    <p className="font-bold text-indigo-dark">99€</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg">
                    <p className="text-xs text-slate-500">Privé</p>
                    <p className="font-bold text-indigo-dark">137€</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => router.push("/catalog")}
                className="w-full bg-indigo-dark hover:bg-indigo-dark/90 text-white font-serif"
              >
                Explorar Catálogo y Reservar
              </Button>
            </div>
          )}

          {!isActive && (
            <Button
              onClick={() => router.push("/membership/upgrade")}
              className="w-full bg-indigo-dark hover:bg-indigo-dark/90 text-white font-serif"
            >
              <Crown className="h-4 w-4 mr-2" />
              Activar Membresía
            </Button>
          )}
        </CardContent>
      </Card>

      {isActive && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Información de Suscripción
            </CardTitle>
            <CardDescription>Detalles de tu membresía {currentMembership.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-200">
              <span className="text-slate-600 font-medium">Estado</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Activa
              </Badge>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-slate-200">
              <span className="text-slate-600 font-medium">Plan</span>
              <span className="font-medium text-slate-900">{currentMembership.name}</span>
            </div>

            {subscription?.current_period_end && (
              <div className="flex items-center justify-between py-3 border-b border-slate-200">
                <span className="text-slate-600 font-medium">Válido hasta</span>
                <span className="font-medium text-slate-900">
                  {new Date(subscription.current_period_end).toLocaleDateString("es-ES", {
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
                <span className="text-slate-600 font-medium">Miembro desde</span>
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
            </div>
          </CardContent>
        </Card>
      )}

      {showPayments && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="font-serif">Historial de Pagos</CardTitle>
            <CardDescription>Tus últimos pagos y transacciones</CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length > 0 ? (
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
                              ? "bg-rose-500"
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
            ) : (
              <p className="text-center text-slate-500 py-4">No hay pagos registrados</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

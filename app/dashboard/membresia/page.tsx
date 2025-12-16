"use client"

import { AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../hooks/useAuth"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Crown, Check, Loader2, Calendar, Receipt, Clock, XCircle, Info } from "lucide-react"
import { supabase } from "../../lib/supabaseClient"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface MembershipData {
  membership_status: string
  membership_type: string | null
  created_at: string | null
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  subscription_end_date?: string | null
  can_make_reservations?: boolean
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
        const { data: userMembership, error: membershipError } = await supabase
          .from("user_memberships")
          .select("membership_type, status, start_date, end_date, can_make_reservations")
          .eq("user_id", user.id)
          .maybeSingle()

        // Luego leer de profiles como fallback/complemento
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(
            "membership_status, membership_type, created_at, stripe_customer_id, stripe_subscription_id, subscription_end_date",
          )
          .eq("id", user.id)
          .maybeSingle()

        const combinedData = {
          membership_status: userMembership?.status || profileData?.membership_status || "inactive",
          membership_type: userMembership?.membership_type || profileData?.membership_type || "free",
          created_at: profileData?.created_at || null,
          stripe_customer_id: profileData?.stripe_customer_id || null,
          stripe_subscription_id: profileData?.stripe_subscription_id || null,
          subscription_end_date: userMembership?.end_date || profileData?.subscription_end_date || null,
          can_make_reservations: userMembership?.can_make_reservations || false,
        }

        console.log("[v0] Membership data fetched:", combinedData)
        console.log("[v0] User membership record:", userMembership)
        console.log("[v0] Profile data:", profileData)

        if (profileError && membershipError) throw profileError || membershipError
        if (combinedData) setMembershipData(combinedData)

        // Fetch subscription and payment history
        try {
          const response = await fetch("/api/user/subscription")
          if (response.ok) {
            const subData = await response.json()
            if (subData.subscription) {
              setSubscription(subData.subscription)
            } else if (combinedData?.subscription_end_date) {
              // Create a subscription object from profile data if no subscription record exists
              setSubscription({
                current_period_end: combinedData.subscription_end_date,
                status: combinedData.membership_status,
              })
            }
            setPayments(subData.payments || [])
          }
        } catch (subError) {
          console.log("No subscription data available")
          if (combinedData?.subscription_end_date) {
            setSubscription({
              current_period_end: combinedData.subscription_end_date,
              status: combinedData.membership_status,
            })
          }
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
            "membership_status, membership_type, created_at, stripe_customer_id, stripe_subscription_id, subscription_end_date",
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
  const hasValidEndDate = membershipData?.subscription_end_date
    ? new Date(membershipData.subscription_end_date) > new Date()
    : false
  const isActive = (membershipData?.membership_status === "active" && membershipType !== "free") || hasValidEndDate
  const isPastDue = membershipData?.membership_status === "past_due"

  console.log("[v0] Rendering membership page:", { membershipType, isActive, hasValidEndDate, membershipData })

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
    return <span className={c.className}>{c.label}</span>
  }

  return (
    <div className="min-h-screen bg-white pt-32">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-serif text-indigo-dark mb-8 text-center">MI MEMBRESÍA</h1>

        {isPastDue && (
          <Card className="mb-6 border border-indigo-dark/10 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3 bg-rose-nude border border-rose-pastel/30 p-4 rounded-lg">
                <Info className="w-5 h-5 text-indigo-dark flex-shrink-0 mt-0.5" />
                <div className="text-sm text-indigo-dark">
                  <p className="font-medium">Pago pendiente</p>
                  <p className="mt-1 text-indigo-dark/70">
                    Tu último pago no se pudo procesar. Por favor actualiza tu método de pago.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6 border border-indigo-dark/10 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-6 mb-6">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {isActive && <Crown className="w-6 h-6 text-indigo-dark" />}
                    <h2 className="font-serif text-2xl text-indigo-dark">{currentMembership.name}</h2>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs rounded-full ${
                      isActive
                        ? "bg-rose-nude border border-rose-pastel/30 text-indigo-dark"
                        : "bg-indigo-dark/5 text-indigo-dark/60"
                    }`}
                  >
                    {isActive ? "Activa" : "Inactiva"}
                  </span>
                </div>
                <p className="font-serif text-3xl text-indigo-dark mb-6">
                  €{currentMembership.price}
                  <span className="text-lg text-indigo-dark/60">/{currentMembership.period}</span>
                </p>

                <ul className="space-y-3 mb-6">
                  {getFeatures().map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-indigo-dark mt-0.5 flex-shrink-0" />
                      <span className="text-indigo-dark/70">{feature}</span>
                    </li>
                  ))}
                </ul>

                {isActive && (subscription?.current_period_end || membershipData?.subscription_end_date) && (
                  <div className="bg-rose-nude border border-rose-pastel/30 p-4 rounded-lg mb-4">
                    <p className="text-sm text-indigo-dark">
                      <strong>Válida hasta:</strong>{" "}
                      {new Date(
                        subscription?.current_period_end || membershipData?.subscription_end_date!,
                      ).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                )}

                {isPetite && isActive && (
                  <div className="bg-rose-nude border border-rose-pastel/30 p-4 rounded-lg mb-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-indigo-dark flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-indigo-dark mb-2">Pases de Bolso Disponibles</h4>
                        <p className="text-sm text-indigo-dark/70 mb-3">
                          Con tu membresía Petite, puedes acceder a bolsos de colecciones premium comprando pases
                          individuales:
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-white p-2 rounded-lg text-center border border-indigo-dark/10">
                            <p className="text-xs text-indigo-dark/60 mb-1">L'Essentiel</p>
                            <p className="font-medium text-indigo-dark text-lg">52€</p>
                            <p className="text-xs text-indigo-dark/60 mt-1">por semana</p>
                          </div>
                          <div className="bg-white p-2 rounded-lg text-center border border-indigo-dark/10">
                            <p className="text-xs text-indigo-dark/60 mb-1">Signature</p>
                            <p className="font-medium text-indigo-dark text-lg">99€</p>
                            <p className="text-xs text-indigo-dark/60 mt-1">por semana</p>
                          </div>
                          <div className="bg-white p-2 rounded-lg text-center border border-indigo-dark/10">
                            <p className="text-xs text-indigo-dark/60 mb-1">Privé</p>
                            <p className="font-medium text-indigo-dark text-lg">137€</p>
                            <p className="text-xs text-indigo-dark/60 mt-1">por semana</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => router.push("/catalog")}
                          className="w-full mt-3 bg-indigo-dark hover:bg-indigo-dark/90 text-white"
                        >
                          Comprar Pase y Explorar Catálogo
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {!isActive && (
                  <Button
                    onClick={() => router.push("/membership/upgrade")}
                    className="w-full bg-indigo-dark hover:bg-indigo-dark/90 text-white"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Activar Membresía
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {isActive && (
          <Card className="mb-6 border border-indigo-dark/10 shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-serif text-lg text-indigo-dark mb-4">Información de Suscripción</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm pb-3 border-b border-indigo-dark/10">
                  <span className="text-indigo-dark/70">Estado</span>
                  <span className="px-3 py-1 text-xs rounded-full bg-rose-nude border border-rose-pastel/30 text-indigo-dark">
                    Activa
                  </span>
                </div>

                <div className="flex justify-between text-sm pb-3 border-b border-indigo-dark/10">
                  <span className="text-indigo-dark/70">Plan</span>
                  <span className="text-indigo-dark font-medium">{currentMembership.name}</span>
                </div>

                {subscription?.current_period_end && (
                  <div className="flex justify-between text-sm pb-3 border-b border-indigo-dark/10">
                    <span className="text-indigo-dark/70">Válido hasta</span>
                    <span className="text-indigo-dark font-medium">
                      {new Date(subscription.current_period_end).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-sm pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-indigo-dark/60" />
                    <span className="text-indigo-dark/70">Miembro desde</span>
                  </div>
                  <span className="text-indigo-dark font-medium">
                    {membershipData?.created_at
                      ? new Date(membershipData.created_at).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "No disponible"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-6">
                <Button
                  variant="outline"
                  className="w-full border-indigo-dark/20 text-indigo-dark hover:bg-rose-nude bg-transparent"
                  onClick={() => setShowPayments(!showPayments)}
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  {showPayments ? "Ocultar historial" : "Ver historial de pagos"}
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full border-indigo-dark/20 text-indigo-dark hover:bg-rose-nude bg-transparent"
                      disabled={pausing}
                    >
                      {pausing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Clock className="h-4 w-4 mr-2" />}
                      Pausar membresía
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Pausar tu membresía?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tu membresía será pausada por 1 mes. No se te cobrará durante este período y se reactivará
                        automáticamente después.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handlePauseSubscription}
                        className="bg-indigo-dark hover:bg-indigo-dark/90"
                      >
                        Pausar 1 mes
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full border-indigo-dark/20 text-indigo-dark hover:bg-rose-nude bg-transparent"
                      disabled={canceling}
                    >
                      {canceling ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      Cancelar membresía
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Cancelar tu membresía?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tu membresía será cancelada al final del período de facturación actual. Seguirás teniendo acceso
                        hasta entonces.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>No, mantener membresía</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancelSubscription}
                        className="bg-indigo-dark hover:bg-indigo-dark/90"
                      >
                        Sí, cancelar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        )}

        {showPayments && (
          <Card className="mb-6 border border-indigo-dark/10 shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-serif text-lg text-indigo-dark mb-4">Historial de Pagos</h3>
              {payments.length > 0 ? (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex justify-between items-center py-3 border-b border-indigo-dark/10 last:border-0"
                    >
                      <div>
                        <p className="text-sm text-indigo-dark font-medium">
                          {payment.description || "Pago de membresía"}
                        </p>
                        <p className="text-xs text-indigo-dark/60">
                          {new Date(payment.payment_date).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-indigo-dark font-medium">{payment.amount.toFixed(2)}€</p>
                        {getStatusBadge(payment.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-rose-nude border border-rose-pastel/30 p-4 rounded-lg">
                  <p className="text-sm text-indigo-dark/70 text-center">No hay pagos registrados</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

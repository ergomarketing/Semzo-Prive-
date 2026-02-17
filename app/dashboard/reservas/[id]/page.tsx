"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "../../../hooks/useAuth"
import { getSupabaseBrowser } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Calendar,
  Package,
  MapPin,
  Clock,
  AlertCircle,
  Loader2,
  Truck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Crown,
} from "lucide-react"
import Image from "next/image"
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

interface Bag {
  id: string
  name: string
  brand: string
  image_url: string
  price: number
  monthly_price?: number
  price_essentiel?: number
  price_signature?: number
  price_prive?: number
  description?: string
  status: string
}

interface ReservationDetails {
  id: string
  user_id: string
  bag_id: string
  start_date: string
  end_date: string
  status: string
  created_at: string
  total_amount?: number
  membership_type?: string
  notes?: string
  shipping_address?: string
  shipping_city?: string
  shipping_postal_code?: string
  shipping_phone?: string
  bags: Bag
  profiles?: {
    id: string
    full_name: string
    email: string
    phone: string
    membership_type: string
    membership_status: string
  }
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-4 w-4" /> },
  confirmed: { label: "Confirmada", color: "bg-blue-100 text-blue-800", icon: <CheckCircle2 className="h-4 w-4" /> },
  active: { label: "En curso", color: "bg-green-100 text-green-800", icon: <Package className="h-4 w-4" /> },
  shipped: { label: "Enviado", color: "bg-purple-100 text-purple-800", icon: <Truck className="h-4 w-4" /> },
  delivered: { label: "Entregado", color: "bg-green-100 text-green-800", icon: <CheckCircle2 className="h-4 w-4" /> },
  returning: {
    label: "En devolución",
    color: "bg-orange-100 text-orange-800",
    icon: <RefreshCw className="h-4 w-4" />,
  },
  completed: { label: "Completada", color: "bg-slate-100 text-slate-800", icon: <CheckCircle2 className="h-4 w-4" /> },
  cancelled: { label: "Cancelada", color: "bg-[#fff0f3] text-[#1a1a4b]", icon: <XCircle className="h-4 w-4" /> },
}

const membershipLabels: Record<string, { label: string; color: string }> = {
  signature: { label: "Signature", color: "bg-indigo-100 text-indigo-800" },
  prive: { label: "Privé", color: "bg-purple-100 text-purple-800" },
  essentiel: { label: "L'Essentiel", color: "bg-rose-100 text-rose-800" },
  free: { label: "Free", color: "bg-gray-100 text-gray-800" },
  petite: { label: "Petite", color: "bg-pink-100 text-pink-800" },
}

export default function ReservationDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [reservation, setReservation] = useState<ReservationDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const reservationId = params?.id as string
  const supabase = getSupabaseBrowser()

  useEffect(() => {
    const fetchReservationDetails = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        console.log("[ReservationDetails] Fetching reservation:", reservationId)

        const { data, error } = await supabase
          .from("reservations")
          .select(`
            *,
            bags (
              id,
              name,
              brand,
              image_url,
              price,
              monthly_price,
              price_essentiel,
              price_signature,
              price_prive,
              description,
              status
            )
          `)
          .eq("id", reservationId)
          .eq("user_id", user.id)
          .single()

        if (error) {
          console.error("[ReservationDetails] Error fetching reservation:", error)
          if (error.code === "PGRST116") {
            setError("Reserva no encontrada. Es posible que haya sido eliminada.")
          } else {
            setError(`No se pudo cargar la reserva: ${error.message || "Error desconocido"}`)
          }
          setLoading(false)
          return
        }

        if (!data) {
          console.error("[ReservationDetails] No data returned")
          setError("Reserva no encontrada")
          setLoading(false)
          return
        }

        if (!data.bags) {
          console.error("[ReservationDetails] Bag data missing")
          setError("Información del bolso no disponible")
          setLoading(false)
          return
        }

        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, full_name, email, phone, membership_type, membership_status")
          .eq("id", user.id)
          .single()

        const enrichedData = {
          ...data,
          profiles: profileData,
        }

        console.log("[ReservationDetails] Reservation loaded:", enrichedData)
        setReservation(enrichedData as ReservationDetails)
      } catch (err) {
        console.error("[ReservationDetails] Unexpected error:", err)
        setError("Error inesperado al cargar la reserva")
      } finally {
        setLoading(false)
      }
    }

    fetchReservationDetails()
  }, [user, reservationId, supabase])

  const handleCancelReservation = async () => {
    if (!reservation || !user) return

    setCancelling(true)
    try {
      const response = await fetch(`/api/user/reservations/${reservation.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({
          status: "cancelled",
          cancellation_reason: "Cancelado por el usuario",
        }),
      })

      if (response.ok) {
        setReservation((prev) => (prev ? { ...prev, status: "cancelled" } : null))
        // Wait a moment before redirect to ensure state is updated
        setTimeout(() => {
          router.push("/dashboard/reservas")
        }, 500)
      } else {
        const data = await response.json()
        setError(data.error || "No se pudo cancelar la reserva")
      }
    } catch (err) {
      console.error("Error cancelling reservation:", err)
      setError("Error al cancelar la reserva")
    } finally {
      setCancelling(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const calculateDays = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getMembershipPrice = () => {
    const membershipType = reservation?.membership_type || reservation?.profiles?.membership_type || "free"

    // Si tiene membresía activa, está incluido
    if (membershipType === "signature" || membershipType === "prive" || membershipType === "essentiel") {
      return { price: 0, included: true }
    }

    return { price: reservation?.total_amount || 0, included: false }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-slate-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-[#f4c4cc] bg-[#fff0f3]">
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <AlertCircle className="h-12 w-12 text-[#1a1a4b]" />
            <div className="text-center">
              <h3 className="font-semibold text-[#1a1a4b]">Error al cargar la reserva</h3>
              <p className="text-[#1a1a4b]/70 mt-1">{error}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/reservas")}
              className="mt-4 border-[#1a1a4b] text-[#1a1a4b] hover:bg-[#1a1a4b] hover:text-white"
            >
              Volver a Reservas
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!reservation) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <AlertCircle className="h-12 w-12 text-slate-400" />
            <p className="text-slate-600">Reserva no encontrada</p>
            <Button variant="outline" onClick={() => router.push("/dashboard/reservas")}>
              Volver a Reservas
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const status = statusConfig[reservation.status] || statusConfig.pending
  const days = calculateDays(reservation.start_date, reservation.end_date)
  const canCancel = ["pending", "confirmed"].includes(reservation.status)
  const priceInfo = getMembershipPrice()

  const membershipType = reservation.membership_type || reservation.profiles?.membership_type || "free"
  const membershipInfo = membershipLabels[membershipType.toLowerCase()] || membershipLabels.free

  return (
    <div className="max-w-4xl mx-auto">
      <Button variant="ghost" onClick={() => router.push("/dashboard/reservas")} className="mb-6 -ml-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a Reservas
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Información principal */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-serif text-2xl">Detalles de la Reserva</CardTitle>
                <Badge className={status.color}>
                  {status.icon}
                  <span className="ml-1">{status.label}</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Bolso */}
              <div className="flex gap-4">
                <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                  {reservation.bags?.image_url ? (
                    <Image
                      src={reservation.bags.image_url || "/placeholder.svg"}
                      alt={reservation.bags.name || "Bolso"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Package className="h-8 w-8 text-slate-400" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-slate-900">{reservation.bags?.name || "Bolso"}</h3>
                  <p className="text-slate-600">{reservation.bags?.brand || "Marca"}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={membershipInfo.color}>
                      <Crown className="h-3 w-3 mr-1" />
                      {membershipInfo.label}
                    </Badge>
                    {priceInfo.included && (
                      <span className="text-xs text-green-600 font-medium">Incluido en tu membresía</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Fechas */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Fecha de inicio</p>
                    <p className="font-medium text-slate-900">{formatDate(reservation.start_date)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Fecha de fin</p>
                    <p className="font-medium text-slate-900">{formatDate(reservation.end_date)}</p>
                  </div>
                </div>
              </div>

              {/* Dirección de envío */}
              {reservation.shipping_address && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <MapPin className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Dirección de envío</p>
                    <p className="font-medium text-slate-900">{reservation.shipping_address}</p>
                    <p className="text-slate-600">
                      {reservation.shipping_postal_code} {reservation.shipping_city}
                    </p>
                  </div>
                </div>
              )}

              {/* Notas */}
              {reservation.notes && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500 mb-1">Notas</p>
                  <p className="text-slate-700">{reservation.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Acciones */}
          {canCancel && (
            <Card>
              <CardContent className="py-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancelar reserva
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Cancelar esta reserva?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. El bolso volverá a estar disponible para otros miembros.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>No, mantener reserva</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancelReservation}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={cancelling}
                      >
                        {cancelling ? "Cancelando..." : "Sí, cancelar"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Resumen */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Duración</span>
                <span className="font-medium">{days} días</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Membresía</span>
                <Badge className={membershipInfo.color} variant="outline">
                  {membershipInfo.label}
                </Badge>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span className="font-medium text-slate-900">Total</span>
                  <div className="text-right">
                    {priceInfo.included ? (
                      <div>
                        <span className="font-bold text-lg text-green-600">€0</span>
                        <p className="text-xs text-green-600">Incluido en membresía</p>
                      </div>
                    ) : (
                      <span className="font-bold text-lg text-slate-900">€{priceInfo.price}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-xs text-slate-500">
                  ID de reserva: <code className="bg-slate-100 px-1 rounded">{reservation.id.substring(0, 8)}</code>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Creada: {new Date(reservation.created_at).toLocaleDateString("es-ES")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

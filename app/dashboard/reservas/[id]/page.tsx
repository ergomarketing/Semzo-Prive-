"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/app/hooks/useAuth"
import { supabase } from "../../../lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  Calendar,
  Clock,
  Package,
  CreditCard,
  CheckCircle,
  XCircle,
  Loader2,
  Info,
  Copy,
} from "lucide-react"

interface ReservationDetails {
  id: string
  bag_id: string
  status: string
  start_date: string
  end_date: string
  total_amount: number
  created_at: string
  updated_at: string
  cancellation_reason?: string
  cancelled_at?: string
  bags: {
    id: string
    name: string
    brand: string
    image_url: string
    monthly_price: number
    description?: string
    status: string
  } | null
  profiles: {
    id: string
    full_name: string
    email: string
    phone?: string
    membership_type?: string
    membership_status?: string
  } | null
}

export default function ReservationDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const reservationId = params.id as string

  const [reservation, setReservation] = useState<ReservationDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancellationReason, setCancellationReason] = useState("")
  const [copiedId, setCopiedId] = useState(false)

  useEffect(() => {
    const fetchReservationDetails = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      const supabaseClient = supabase()
      if (!supabaseClient) {
        setError("Error de configuración: cliente Supabase no disponible")
        setLoading(false)
        return
      }

      try {
        console.log("[ReservationDetails] Fetching reservation:", reservationId)

        const { data, error } = await supabaseClient
          .from("reservations")
          .select(`
            *,
            bags (
              id,
              name,
              brand,
              image_url,
              monthly_price,
              description,
              status
            ),
            profiles (
              id,
              full_name,
              email,
              phone,
              membership_type,
              membership_status
            )
          `)
          .eq("id", reservationId)
          .eq("user_id", user.id)
          .single()

        if (error) {
          console.error("[ReservationDetails] Error fetching reservation:", error)
          setError("No se pudo cargar la reserva. Verifica que existe y te pertenece.")
          throw error
        }

        console.log("[ReservationDetails] Reservation loaded successfully")
        setReservation(data)
      } catch (error) {
        console.error("[ReservationDetails] Error:", error)
        setError(error instanceof Error ? error.message : "Error desconocido")
      } finally {
        setLoading(false)
      }
    }

    fetchReservationDetails()
  }, [user, reservationId])

  const handleCancelReservation = async () => {
    if (!reservation || !user) return

    const supabaseClient = supabase()
    if (!supabaseClient) {
      alert("Error de configuración: cliente Supabase no disponible")
      return
    }

    setCancelling(true)
    try {
      const { data, error } = await supabaseClient
        .from("reservations")
        .update({
          status: "cancelled",
          cancellation_reason: cancellationReason || "Cancelada por el usuario",
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", reservationId)
        .eq("user_id", user.id)
        .select()
        .single()

      if (error) {
        console.error("[ReservationDetails] Error cancelling reservation:", error)
        alert("Error al cancelar la reserva. Por favor, intenta de nuevo.")
        return
      }

      console.log("[ReservationDetails] Reservation cancelled successfully")
      setReservation(data)
      setShowCancelDialog(false)
      setCancellationReason("")
    } catch (error) {
      console.error("[ReservationDetails] Error:", error)
      alert("Error inesperado al cancelar la reserva.")
    } finally {
      setCancelling(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: {
        label: "Activa",
        className: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle,
      },
      pending: {
        label: "Pendiente",
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: Clock,
      },
      confirmed: {
        label: "Confirmada",
        className: "bg-blue-100 text-blue-800 border-blue-200",
        icon: CheckCircle,
      },
      completed: {
        label: "Completada",
        className: "bg-slate-100 text-slate-800 border-slate-200",
        icon: CheckCircle,
      },
      cancelled: {
        label: "Cancelada",
        className: "bg-red-100 text-red-800 border-red-200",
        icon: XCircle,
      },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge variant="secondary" className={`${config.className} text-base py-1 px-3`}>
        <Icon className="h-4 w-4 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const canCancel = reservation && ["pending", "confirmed"].includes(reservation.status)

  const copyReservationId = async () => {
    if (!reservation) return

    try {
      await navigator.clipboard.writeText(reservation.id)
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    } catch (error) {
      console.error("Error copying to clipboard:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-slate-600" />
      </div>
    )
  }

  if (error || !reservation) {
    return (
      <div className="max-w-4xl mx-auto">
        <Button onClick={() => router.push("/dashboard/reservas")} variant="ghost" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Reservas
        </Button>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <h3 className="text-red-900 font-serif text-lg mb-2">Error al cargar la reserva</h3>
            <p className="text-red-700 text-sm mb-4">{error || "Reserva no encontrada"}</p>
            <Button
              onClick={() => router.push("/dashboard/reservas")}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Volver a Reservas
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const startDate = new Date(reservation.start_date)
  const endDate = new Date(reservation.end_date)
  const now = new Date()
  const daysTotal = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  const daysUntilStart = Math.max(0, Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  const isUpcoming = startDate > now
  const isActive = reservation.status === "active"
  const isPast = endDate < now

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button onClick={() => router.push("/dashboard/reservas")} variant="ghost" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Reservas
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-serif text-slate-900 mb-2">Detalles de Reserva</h2>
            <div className="flex items-center gap-3">
              <code className="text-slate-600 font-mono text-sm bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
                ID: {reservation.id.substring(0, 18)}...
              </code>
              <Button
                onClick={copyReservationId}
                size="sm"
                variant="outline"
                className="h-8 px-3 hover:bg-green-50 hover:border-green-200 transition-colors bg-transparent"
                title="Copiar ID completo"
              >
                {copiedId ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-green-600 text-xs font-medium">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-slate-500 mr-1" />
                    <span className="text-slate-600 text-xs">Copiar</span>
                  </>
                )}
              </Button>
            </div>
          </div>
          {getStatusBadge(reservation.status)}
        </div>
      </div>

      {/* Alertas de estado */}
      {isUpcoming && reservation.status === "confirmed" && (
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            Tu reserva comienza en <strong>{daysUntilStart} días</strong> ({startDate.toLocaleDateString("es-ES")})
          </AlertDescription>
        </Alert>
      )}

      {isActive && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            Reserva activa. Quedan <strong>{daysRemaining} días</strong> hasta la devolución
          </AlertDescription>
        </Alert>
      )}

      {reservation.status === "cancelled" && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">
            Esta reserva fue cancelada
            {reservation.cancelled_at && <> el {new Date(reservation.cancelled_at).toLocaleDateString("es-ES")}</>}
            {reservation.cancellation_reason && (
              <>
                <br />
                <span className="text-sm">Motivo: {reservation.cancellation_reason}</span>
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="md:col-span-2 space-y-6">
          {/* Información del bolso */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Información del Bolso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="w-32 h-32 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                  {reservation.bags?.image_url ? (
                    <img
                      src={reservation.bags.image_url || "/placeholder.svg"}
                      alt={reservation.bags.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="h-12 w-12 text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-serif text-slate-900 mb-1">
                    {reservation.bags?.name || "Bolso sin nombre"}
                  </h3>
                  <p className="text-slate-600 mb-3">{reservation.bags?.brand || "Marca desconocida"}</p>
                  {reservation.bags?.description && (
                    <p className="text-sm text-slate-600 mb-2">{reservation.bags.description}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      ${reservation.bags?.monthly_price || 0}/mes
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        reservation.bags?.status === "available"
                          ? "text-xs bg-green-50 text-green-700"
                          : "text-xs bg-slate-50 text-slate-700"
                      }
                    >
                      {reservation.bags?.status || "unknown"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fechas y duración */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Período de Reserva
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Fecha de inicio</p>
                  <p className="text-lg font-medium text-slate-900">
                    {startDate.toLocaleDateString("es-ES", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Fecha de fin</p>
                  <p className="text-lg font-medium text-slate-900">
                    {endDate.toLocaleDateString("es-ES", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Duración total:</span>
                  <span className="text-lg font-medium text-slate-900">{daysTotal} días</span>
                </div>
                {isActive && (
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-slate-600">Días restantes:</span>
                    <span className="text-lg font-medium text-green-600">{daysRemaining} días</span>
                  </div>
                )}
                {isUpcoming && (
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-slate-600">Comienza en:</span>
                    <span className="text-lg font-medium text-blue-600">{daysUntilStart} días</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Información de pago */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Información de Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Precio mensual:</span>
                  <span className="font-medium">${reservation.bags?.monthly_price || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Período:</span>
                  <span className="font-medium">{daysTotal} días</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="text-lg font-medium text-slate-900">Total:</span>
                  <span className="text-lg font-bold text-slate-900">
                    ${reservation.total_amount?.toFixed(2) || "0.00"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna lateral */}
        <div className="space-y-6">
          {/* Timeline de estado */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Estado de la Reserva
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      reservation.status !== "cancelled" ? "bg-green-500" : "bg-slate-300"
                    }`}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Creada</p>
                    <p className="text-xs text-slate-600">{new Date(reservation.created_at).toLocaleString("es-ES")}</p>
                  </div>
                </div>

                {reservation.status === "confirmed" && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full mt-2 bg-blue-500" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">Confirmada</p>
                      <p className="text-xs text-slate-600">Esperando inicio</p>
                    </div>
                  </div>
                )}

                {reservation.status === "active" && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full mt-2 bg-green-500" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">Activa</p>
                      <p className="text-xs text-slate-600">En curso</p>
                    </div>
                  </div>
                )}

                {reservation.status === "completed" && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full mt-2 bg-slate-500" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">Completada</p>
                      <p className="text-xs text-slate-600">
                        {new Date(reservation.updated_at).toLocaleString("es-ES")}
                      </p>
                    </div>
                  </div>
                )}

                {reservation.status === "cancelled" && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full mt-2 bg-red-500" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">Cancelada</p>
                      <p className="text-xs text-slate-600">
                        {reservation.cancelled_at
                          ? new Date(reservation.cancelled_at).toLocaleString("es-ES")
                          : "Fecha desconocida"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Acciones */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {canCancel && (
                <Button onClick={() => setShowCancelDialog(true)} variant="destructive" className="w-full">
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancelar Reserva
                </Button>
              )}
              <Button onClick={() => router.push("/dashboard/reservas")} variant="outline" className="w-full">
                Volver a Mis Reservas
              </Button>
              <Button onClick={() => router.push("/catalog")} variant="outline" className="w-full">
                Explorar Catálogo
              </Button>
            </CardContent>
          </Card>

          {/* Información adicional */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Información</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-600 space-y-2">
              <div className="pb-2 border-b border-slate-100">
                <p className="font-medium text-slate-700 mb-1">Fecha del pedido</p>
                <p>
                  {new Date(reservation.created_at).toLocaleDateString("es-ES", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="pt-2">
                <p className="font-medium text-slate-700 mb-1">Última actualización</p>
                <p>{new Date(reservation.updated_at).toLocaleString("es-ES")}</p>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <p className="font-medium text-slate-700 mb-2">ID de la reserva</p>
                <code className="text-xs bg-slate-50 px-2 py-1.5 rounded font-mono break-all block border border-slate-200">
                  {reservation.id}
                </code>
                <p className="text-[10px] text-slate-500 mt-1">Usa este ID para soporte o seguimiento</p>
              </div>
              {reservation.profiles?.membership_type && (
                <div className="pt-2 border-t border-slate-100">
                  <p className="font-medium text-slate-700 mb-1">Tu membresía</p>
                  <p className="capitalize">{reservation.profiles.membership_type}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog de cancelación */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <CardTitle>¿Cancelar esta reserva?</CardTitle>
              <p className="text-sm text-slate-600 mt-2">
                Esta acción no se puede deshacer. La reserva será cancelada y el bolso quedará disponible para otros
                usuarios.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Motivo de cancelación (opcional)
                </label>
                <Textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Cuéntanos por qué cancelas esta reserva..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowCancelDialog(false)} disabled={cancelling}>
                  No, mantener reserva
                </Button>
                <Button onClick={handleCancelReservation} disabled={cancelling} className="bg-red-600 hover:bg-red-700">
                  {cancelling ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cancelando...
                    </>
                  ) : (
                    "Sí, cancelar reserva"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

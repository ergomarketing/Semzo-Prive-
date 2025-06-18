"use client"

import { Label } from "@/components/ui/label"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  RotateCcw,
  Calendar,
  Phone,
  Mail,
  Star,
  MessageSquare,
  RefreshCw,
  ArrowRight,
  Info,
  Heart,
} from "lucide-react"

interface ReservationDetails {
  id: string
  bagId: string
  bagName: string
  bagBrand: string
  bagImages: string[]
  customerName: string
  customerEmail: string
  customerPhone: string
  startDate: Date
  endDate: Date
  totalDays: number
  totalAmount: string
  membershipType: "essentiel" | "signature" | "prive"
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "shipped"
    | "delivered"
    | "active"
    | "return_requested"
    | "returned"
    | "completed"
    | "cancelled"
  createdAt: Date
  updatedAt: Date
}

interface TimelineStep {
  id: string
  title: string
  description: string
  status: "completed" | "current" | "pending" | "skipped"
  timestamp?: Date
  estimatedDate?: Date
  icon: React.ReactNode
  details?: string[]
  actions?: Array<{
    label: string
    action: () => void
    variant?: "default" | "outline" | "destructive"
  }>
}

interface TrackingInfo {
  carrier: string
  trackingNumber: string
  estimatedDelivery: Date
  currentLocation: string
  updates: Array<{
    timestamp: Date
    location: string
    status: string
    description: string
  }>
}

interface ReservationStatusTimelineProps {
  reservation: ReservationDetails
  onExtendReservation?: () => void
  onRequestReturn?: () => void
  onCancelReservation?: () => void
  onRateExperience?: (rating: number, review: string) => void
  onContactSupport?: () => void
}

export default function ReservationStatusTimeline({
  reservation,
  onExtendReservation,
  onRequestReturn,
  onCancelReservation,
  onRateExperience,
  onContactSupport,
}: ReservationStatusTimelineProps) {
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState("")
  const [expandedStep, setExpandedStep] = useState<string | null>(null)

  // Mock tracking data - será reemplazado por API real
  useEffect(() => {
    if (reservation.status === "shipped" || reservation.status === "delivered") {
      const mockTracking: TrackingInfo = {
        carrier: "DHL Express",
        trackingNumber: "1234567890",
        estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000),
        currentLocation: "Centro de distribución Madrid",
        updates: [
          {
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            location: "Centro de distribución Madrid",
            status: "En tránsito",
            description: "El paquete está en camino a su destino",
          },
          {
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
            location: "Almacén central",
            status: "Procesado",
            description: "El paquete ha sido procesado y está listo para envío",
          },
        ],
      }
      setTrackingInfo(mockTracking)
    }
  }, [reservation.status])

  const getTimelineSteps = (): TimelineStep[] => {
    const steps: TimelineStep[] = [
      {
        id: "pending",
        title: "Reserva Recibida",
        description: "Tu reserva ha sido recibida y está siendo procesada",
        status: reservation.status === "pending" ? "current" : "completed",
        timestamp: reservation.createdAt,
        icon: <Clock className="h-5 w-5" />,
        details: [
          `Reserva ID: ${reservation.id}`,
          `Fecha de solicitud: ${reservation.createdAt.toLocaleDateString()}`,
          "Tiempo estimado de confirmación: 2-4 horas",
        ],
      },
      {
        id: "confirmed",
        title: "Reserva Confirmada",
        description: "Tu reserva ha sido confirmada y el bolso está siendo preparado",
        status:
          reservation.status === "confirmed"
            ? "current"
            : ["preparing", "shipped", "delivered", "active", "return_requested", "returned", "completed"].includes(
                  reservation.status,
                )
              ? "completed"
              : "pending",
        timestamp:
          reservation.status !== "pending" ? new Date(reservation.createdAt.getTime() + 2 * 60 * 60 * 1000) : undefined,
        icon: <CheckCircle2 className="h-5 w-5" />,
        details: ["Pago procesado exitosamente", "Bolso reservado en tu nombre", "Preparación iniciada"],
      },
      {
        id: "preparing",
        title: "Preparando Envío",
        description: "El bolso está siendo preparado y empaquetado para el envío",
        status:
          reservation.status === "preparing"
            ? "current"
            : ["shipped", "delivered", "active", "return_requested", "returned", "completed"].includes(
                  reservation.status,
                )
              ? "completed"
              : "pending",
        timestamp: [
          "preparing",
          "shipped",
          "delivered",
          "active",
          "return_requested",
          "returned",
          "completed",
        ].includes(reservation.status)
          ? new Date(reservation.createdAt.getTime() + 4 * 60 * 60 * 1000)
          : undefined,
        icon: <Package className="h-5 w-5" />,
        details: ["Inspección de calidad completada", "Empaquetado en packaging premium", "Documentación preparada"],
      },
      {
        id: "shipped",
        title: "Enviado",
        description: "Tu bolso está en camino",
        status:
          reservation.status === "shipped"
            ? "current"
            : ["delivered", "active", "return_requested", "returned", "completed"].includes(reservation.status)
              ? "completed"
              : "pending",
        timestamp: ["shipped", "delivered", "active", "return_requested", "returned", "completed"].includes(
          reservation.status,
        )
          ? new Date(reservation.createdAt.getTime() + 6 * 60 * 60 * 1000)
          : undefined,
        estimatedDate: reservation.status === "shipped" ? new Date(Date.now() + 24 * 60 * 60 * 1000) : undefined,
        icon: <Truck className="h-5 w-5" />,
        details: trackingInfo
          ? [
              `Transportista: ${trackingInfo.carrier}`,
              `Número de seguimiento: ${trackingInfo.trackingNumber}`,
              `Ubicación actual: ${trackingInfo.currentLocation}`,
              `Entrega estimada: ${trackingInfo.estimatedDelivery.toLocaleDateString()}`,
            ]
          : ["Información de seguimiento disponible pronto"],
        actions:
          reservation.status === "shipped"
            ? [
                {
                  label: "Rastrear paquete",
                  action: () => window.open(`https://tracking.dhl.com/${trackingInfo?.trackingNumber}`, "_blank"),
                },
              ]
            : undefined,
      },
      {
        id: "delivered",
        title: "Entregado",
        description: "El bolso ha sido entregado exitosamente",
        status:
          reservation.status === "delivered"
            ? "current"
            : ["active", "return_requested", "returned", "completed"].includes(reservation.status)
              ? "completed"
              : "pending",
        timestamp: ["delivered", "active", "return_requested", "returned", "completed"].includes(reservation.status)
          ? new Date(reservation.createdAt.getTime() + 30 * 60 * 60 * 1000)
          : undefined,
        icon: <CheckCircle2 className="h-5 w-5" />,
        details: ["Entrega confirmada", "Disfruta tu bolso de lujo", "Período de alquiler iniciado"],
        actions:
          reservation.status === "delivered"
            ? [
                {
                  label: "Confirmar recepción",
                  action: () => {
                    // Mock API call to confirm delivery
                    alert("Recepción confirmada. ¡Disfruta tu bolso!")
                  },
                },
              ]
            : undefined,
      },
      {
        id: "active",
        title: "Período Activo",
        description: "Disfruta tu bolso durante el período de alquiler",
        status:
          reservation.status === "active"
            ? "current"
            : ["return_requested", "returned", "completed"].includes(reservation.status)
              ? "completed"
              : "pending",
        timestamp: reservation.status === "active" ? reservation.startDate : undefined,
        estimatedDate: reservation.status === "active" ? reservation.endDate : undefined,
        icon: <Heart className="h-5 w-5" />,
        details: [
          `Período: ${reservation.startDate.toLocaleDateString()} - ${reservation.endDate.toLocaleDateString()}`,
          `Días restantes: ${Math.max(0, Math.ceil((reservation.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}`,
          "Cuidados incluidos en el servicio",
        ],
        actions:
          reservation.status === "active"
            ? [
                {
                  label: "Extender período",
                  action: onExtendReservation || (() => {}),
                  variant: "outline" as const,
                },
                {
                  label: "Solicitar devolución",
                  action: onRequestReturn || (() => {}),
                },
              ]
            : undefined,
      },
      {
        id: "return",
        title: "Devolución",
        description: "Proceso de devolución del bolso",
        status:
          reservation.status === "return_requested"
            ? "current"
            : ["returned", "completed"].includes(reservation.status)
              ? "completed"
              : "pending",
        timestamp: reservation.status === "return_requested" ? reservation.endDate : undefined,
        icon: <RotateCcw className="h-5 w-5" />,
        details:
          reservation.status === "return_requested"
            ? ["Devolución solicitada", "Programar recogida o envío", "Inspección al recibir"]
            : reservation.status === "returned"
              ? ["Bolso devuelto exitosamente", "Inspección completada", "Sin daños detectados"]
              : ["Pendiente de devolución"],
        actions:
          reservation.status === "return_requested"
            ? [
                {
                  label: "Programar recogida",
                  action: () => alert("Funcionalidad de programación de recogida"),
                },
              ]
            : undefined,
      },
      {
        id: "completed",
        title: "Completado",
        description: "Reserva completada exitosamente",
        status: reservation.status === "completed" ? "completed" : "pending",
        timestamp:
          reservation.status === "completed"
            ? new Date(reservation.endDate.getTime() + 24 * 60 * 60 * 1000)
            : undefined,
        icon: <Star className="h-5 w-5" />,
        details: ["Reserva finalizada", "Experiencia completada", "Gracias por elegir Semzo Privé"],
        actions:
          reservation.status === "completed"
            ? [
                {
                  label: "Calificar experiencia",
                  action: () => setShowRatingModal(true),
                  variant: "outline" as const,
                },
                {
                  label: "Reservar otro bolso",
                  action: () => (window.location.href = "/catalog"),
                },
              ]
            : undefined,
      },
    ]

    return steps
  }

  const getStatusColor = (status: TimelineStep["status"]) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100"
      case "current":
        return "text-indigo-600 bg-indigo-100"
      case "pending":
        return "text-slate-400 bg-slate-100"
      case "skipped":
        return "text-slate-300 bg-slate-50"
      default:
        return "text-slate-400 bg-slate-100"
    }
  }

  const getStatusBadgeColor = (status: ReservationDetails["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "confirmed":
        return "bg-blue-100 text-blue-800"
      case "preparing":
        return "bg-purple-100 text-purple-800"
      case "shipped":
        return "bg-indigo-100 text-indigo-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "active":
        return "bg-emerald-100 text-emerald-800"
      case "return_requested":
        return "bg-orange-100 text-orange-800"
      case "returned":
        return "bg-slate-100 text-slate-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-slate-100 text-slate-800"
    }
  }

  const membershipColors = {
    essentiel: "bg-rose-nude text-slate-900",
    signature: "bg-rose-pastel/50 text-slate-900",
    prive: "bg-indigo-dark text-white",
  }

  const membershipNames = {
    essentiel: "L'Essentiel",
    signature: "Signature",
    prive: "Privé",
  }

  const timelineSteps = getTimelineSteps()

  const handleRatingSubmit = () => {
    if (rating > 0) {
      onRateExperience?.(rating, review)
      setShowRatingModal(false)
      setRating(0)
      setReview("")
      alert("¡Gracias por tu valoración!")
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with reservation details */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-serif text-slate-900">Estado de Reserva</CardTitle>
              <p className="text-slate-600 mt-1">Reserva #{reservation.id}</p>
            </div>
            <Badge className={`text-sm ${getStatusBadgeColor(reservation.status)}`}>
              {reservation.status.replace("_", " ").toUpperCase()}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Bag details */}
            <div className="flex space-x-4">
              <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={reservation.bagImages[0] || "/placeholder.svg"}
                  alt={reservation.bagName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={`text-xs ${membershipColors[reservation.membershipType]}`}>
                    {membershipNames[reservation.membershipType]}
                  </Badge>
                </div>
                <h3 className="font-serif text-lg text-slate-900">{reservation.bagName}</h3>
                <p className="text-slate-600">{reservation.bagBrand}</p>
                <p className="text-sm text-slate-500 mt-1">
                  {reservation.totalDays} días • {reservation.totalAmount}
                </p>
              </div>
            </div>

            {/* Key dates */}
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-2 text-slate-500" />
                <span>
                  <strong>Período:</strong> {reservation.startDate.toLocaleDateString()} -{" "}
                  {reservation.endDate.toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <Clock className="h-4 w-4 mr-2 text-slate-500" />
                <span>
                  <strong>Creado:</strong> {reservation.createdAt.toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <RefreshCw className="h-4 w-4 mr-2 text-slate-500" />
                <span>
                  <strong>Actualizado:</strong> {reservation.updatedAt.toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Progreso de la Reserva
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            {timelineSteps.map((step, index) => (
              <div key={step.id} className="relative">
                {/* Connector line */}
                {index < timelineSteps.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-16 bg-slate-200"></div>
                )}

                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${getStatusColor(
                      step.status,
                    )} flex-shrink-0`}
                  >
                    {step.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-900">{step.title}</h4>
                        <p className="text-slate-600 text-sm">{step.description}</p>
                      </div>
                      {step.timestamp && (
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {step.timestamp.toLocaleDateString()} {step.timestamp.toLocaleTimeString()}
                        </span>
                      )}
                      {step.estimatedDate && !step.timestamp && (
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          Est. {step.estimatedDate.toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Expandable details */}
                    {(step.details || step.actions) && (
                      <div className="mt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                          className="text-xs text-slate-600 hover:text-slate-900 p-0 h-auto"
                        >
                          {expandedStep === step.id ? "Ocultar detalles" : "Ver detalles"}
                          <ArrowRight
                            className={`h-3 w-3 ml-1 transition-transform ${
                              expandedStep === step.id ? "rotate-90" : ""
                            }`}
                          />
                        </Button>

                        {expandedStep === step.id && (
                          <div className="mt-3 p-4 bg-slate-50 rounded-lg space-y-3">
                            {step.details && (
                              <div>
                                <h5 className="font-medium text-sm text-slate-900 mb-2">Detalles:</h5>
                                <ul className="space-y-1">
                                  {step.details.map((detail, idx) => (
                                    <li key={idx} className="text-sm text-slate-600 flex items-start">
                                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                                      {detail}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {step.actions && (
                              <div>
                                <h5 className="font-medium text-sm text-slate-900 mb-2">Acciones disponibles:</h5>
                                <div className="flex flex-wrap gap-2">
                                  {step.actions.map((action, idx) => (
                                    <Button
                                      key={idx}
                                      variant={action.variant || "default"}
                                      size="sm"
                                      onClick={action.action}
                                      className="text-xs"
                                    >
                                      {action.label}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tracking details (if shipped) */}
      {trackingInfo && (reservation.status === "shipped" || reservation.status === "delivered") && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Truck className="h-5 w-5 mr-2" />
              Información de Seguimiento
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="font-medium text-sm w-24">Transportista:</span>
                  <span className="text-sm">{trackingInfo.carrier}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-sm w-24">Tracking:</span>
                  <span className="text-sm font-mono">{trackingInfo.trackingNumber}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-sm w-24">Ubicación:</span>
                  <span className="text-sm">{trackingInfo.currentLocation}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-sm w-24">Entrega:</span>
                  <span className="text-sm">{trackingInfo.estimatedDelivery.toLocaleDateString()}</span>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-3">Actualizaciones recientes:</h4>
                <div className="space-y-2">
                  {trackingInfo.updates.map((update, idx) => (
                    <div key={idx} className="text-xs border-l-2 border-indigo-200 pl-3">
                      <div className="font-medium">{update.status}</div>
                      <div className="text-slate-600">{update.description}</div>
                      <div className="text-slate-500">
                        {update.timestamp.toLocaleDateString()} - {update.location}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact and support */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Soporte y Contacto
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Button variant="outline" className="flex items-center justify-center space-x-2" onClick={onContactSupport}>
              <Phone className="h-4 w-4" />
              <span>Llamar soporte</span>
            </Button>

            <Button
              variant="outline"
              className="flex items-center justify-center space-x-2"
              onClick={() => (window.location.href = "mailto:support@semzoprive.com")}
            >
              <Mail className="h-4 w-4" />
              <span>Enviar email</span>
            </Button>

            <Button
              variant="outline"
              className="flex items-center justify-center space-x-2"
              onClick={() => alert("Funcionalidad de chat en vivo")}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Chat en vivo</span>
            </Button>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">¿Necesitas ayuda?</h4>
                <p className="text-blue-700 text-sm">
                  Nuestro equipo de atención al cliente está disponible 24/7 para ayudarte con cualquier consulta sobre
                  tu reserva.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rating modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Califica tu experiencia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Puntuación general</Label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`p-1 ${star <= rating ? "text-yellow-400" : "text-slate-300"}`}
                    >
                      <Star className="h-6 w-6 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="review" className="text-sm font-medium mb-2 block">
                  Comentarios (opcional)
                </Label>
                <textarea
                  id="review"
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Cuéntanos sobre tu experiencia..."
                  className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div className="flex space-x-3">
                <Button variant="outline" onClick={() => setShowRatingModal(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleRatingSubmit} disabled={rating === 0} className="flex-1">
                  Enviar valoración
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

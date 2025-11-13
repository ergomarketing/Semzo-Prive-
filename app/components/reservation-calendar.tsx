"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronLeft, ChevronRight, Clock, User, Loader2 } from "lucide-react"
import { supabase } from "../lib/supabaseClient"

interface CalendarReservation {
  id: string
  bagId: string
  bagName: string
  customerName: string
  startDate: Date
  endDate: Date
  status: "confirmed" | "pending" | "active" | "completed" | "cancelled"
  membershipType?: string
}

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  reservations: CalendarReservation[]
  isAvailable: boolean
}

interface ReservationCalendarProps {
  userId?: string // Si se proporciona, muestra solo las reservas del usuario
  adminMode?: boolean // Si es true, muestra todas las reservas (modo admin)
}

export default function ReservationCalendar({ userId, adminMode = false }: ReservationCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [reservations, setReservations] = useState<CalendarReservation[]>([])
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar reservas desde Supabase
  useEffect(() => {
    const fetchReservations = async () => {
      setLoading(true)
      setError(null)

      try {
        console.log("[Calendar] Fetching reservations...", { userId, adminMode })

        let query = supabase
          .from("reservations")
          .select(`
            id,
            bag_id,
            user_id,
            status,
            start_date,
            end_date,
            bags (
              name
            ),
            profiles (
              full_name,
              membership_type
            )
          `)
          .in("status", ["active", "confirmed", "pending"])

        // Si no es modo admin y hay userId, filtrar por usuario
        if (!adminMode && userId) {
          query = query.eq("user_id", userId)
        }

        const { data, error: fetchError } = await query

        if (fetchError) {
          console.error("[Calendar] Error fetching reservations:", fetchError)
          setError("Error al cargar las reservas")
          return
        }

        console.log("[Calendar] Reservations fetched:", data?.length || 0)

        // Transformar datos
        const transformedReservations: CalendarReservation[] = (data || []).map((r: any) => ({
          id: r.id,
          bagId: r.bag_id,
          bagName: r.bags?.name || "Bolso desconocido",
          customerName: r.profiles?.full_name || "Cliente desconocido",
          startDate: new Date(r.start_date),
          endDate: new Date(r.end_date),
          status: r.status as CalendarReservation["status"],
          membershipType: r.profiles?.membership_type,
        }))

        setReservations(transformedReservations)
      } catch (err) {
        console.error("[Calendar] Unexpected error:", err)
        setError("Error inesperado al cargar las reservas")
      } finally {
        setLoading(false)
      }
    }

    fetchReservations()
  }, [userId, adminMode])

  // Generar días del calendario
  useEffect(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const firstDayOfWeek = firstDayOfMonth.getDay()
    const daysInMonth = lastDayOfMonth.getDate()

    const days: CalendarDay[] = []

    // Días del mes anterior
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i)
      days.push({
        date,
        isCurrentMonth: false,
        reservations: getReservationsForDate(date),
        isAvailable: true,
      })
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dayReservations = getReservationsForDate(date)
      days.push({
        date,
        isCurrentMonth: true,
        reservations: dayReservations,
        isAvailable: dayReservations.length < 5, // Máximo 5 reservas por día
      })
    }

    // Días del mes siguiente para completar la semana
    const remainingDays = 42 - days.length // 6 semanas × 7 días
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day)
      days.push({
        date,
        isCurrentMonth: false,
        reservations: getReservationsForDate(date),
        isAvailable: true,
      })
    }

    setCalendarDays(days)
  }, [currentDate, reservations])

  const getReservationsForDate = (date: Date): CalendarReservation[] => {
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    
    return reservations.filter((reservation) => {
      const reservationStart = new Date(reservation.startDate.getFullYear(), reservation.startDate.getMonth(), reservation.startDate.getDate())
      const reservationEnd = new Date(reservation.endDate.getFullYear(), reservation.endDate.getMonth(), reservation.endDate.getDate())
      return dateOnly >= reservationStart && dateOnly <= reservationEnd
    })
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const getStatusColor = (status: CalendarReservation["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "confirmed":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-slate-100 text-slate-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getMembershipColor = (membership?: string) => {
    if (!membership) return "border-l-gray-300"
    
    const membershipLower = membership.toLowerCase()
    if (membershipLower.includes("essentiel")) return "border-l-rose-400"
    if (membershipLower.includes("signature")) return "border-l-purple-400"
    if (membershipLower.includes("prive") || membershipLower.includes("privé")) return "border-l-indigo-600"
    return "border-l-gray-300"
  }

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ]

  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin h-8 w-8 text-slate-600" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-0 shadow-lg border-red-200 bg-red-50">
        <CardContent className="p-6">
          <p className="text-red-700">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="mt-4 border-red-300 text-red-700 hover:bg-red-100"
          >
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Calendario de Reservas
              {!adminMode && userId && (
                <Badge variant="outline" className="ml-3 text-xs">
                  Mis reservas
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")} className="p-2">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-medium min-w-[150px] text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <Button variant="outline" size="sm" onClick={() => navigateMonth("next")} className="p-2">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {reservations.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">
                {!adminMode && userId
                  ? "No tienes reservas activas en este momento"
                  : "No hay reservas activas en este momento"}
              </p>
            </div>
          ) : (
            <>
              {/* Encabezados de días */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {dayNames.map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-slate-600">
                    {day}
                  </div>
                ))}
              </div>

              {/* Días del calendario */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={`min-h-[100px] p-2 border border-slate-100 cursor-pointer transition-colors ${
                      day.isCurrentMonth ? "bg-white hover:bg-slate-50" : "bg-slate-50 text-slate-400"
                    } ${
                      selectedDate?.toDateString() === day.date.toDateString()
                        ? "ring-2 ring-indigo-500 bg-indigo-50"
                        : ""
                    }`}
                    onClick={() => setSelectedDate(day.date)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm ${day.isCurrentMonth ? "text-slate-900" : "text-slate-400"}`}>
                        {day.date.getDate()}
                      </span>
                      {!day.isAvailable && (
                        <Badge variant="outline" className="text-xs bg-red-50 text-red-600">
                          Lleno
                        </Badge>
                      )}
                    </div>

                    {/* Reservas del día */}
                    <div className="space-y-1">
                      {day.reservations.slice(0, 2).map((reservation) => (
                        <div
                          key={reservation.id}
                          className={`text-xs p-1 rounded border-l-2 ${getMembershipColor(
                            reservation.membershipType,
                          )} ${getStatusColor(reservation.status)}`}
                        >
                          <div className="font-medium truncate">{reservation.bagName}</div>
                          {adminMode && <div className="truncate text-[10px]">{reservation.customerName}</div>}
                        </div>
                      ))}
                      {day.reservations.length > 2 && (
                        <div className="text-xs text-slate-500">+{day.reservations.length - 2} más</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detalles del día seleccionado */}
      {selectedDate && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Reservas para {selectedDate.toLocaleDateString("es-ES")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const dayReservations = getReservationsForDate(selectedDate)
              if (dayReservations.length === 0) {
                return (
                  <div className="text-center py-8 text-slate-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p>No hay reservas para este día</p>
                  </div>
                )
              }

              return (
                <div className="space-y-4">
                  {dayReservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className={`p-4 rounded-lg border-l-4 ${getMembershipColor(
                        reservation.membershipType,
                      )} bg-slate-50`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900">{reservation.bagName}</h4>
                          {adminMode && (
                            <div className="flex items-center mt-1 text-sm text-slate-600">
                              <User className="h-4 w-4 mr-1" />
                              {reservation.customerName}
                            </div>
                          )}
                          <div className="mt-2 text-sm text-slate-600">
                            <span className="font-medium">Período:</span>{" "}
                            {reservation.startDate.toLocaleDateString("es-ES")} -{" "}
                            {reservation.endDate.toLocaleDateString("es-ES")}
                          </div>
                          {reservation.membershipType && (
                            <div className="mt-1">
                              <Badge className="text-xs capitalize">{reservation.membershipType}</Badge>
                            </div>
                          )}
                        </div>
                        <Badge className={getStatusColor(reservation.status)}>{reservation.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </CardContent>
        </Card>
      )}

      {/* Leyenda */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Leyenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Estados de reserva:</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Badge className="bg-green-100 text-green-800 mr-2">Activa</Badge>
                  <span className="text-sm">Bolso actualmente alquilado</span>
                </div>
                <div className="flex items-center">
                  <Badge className="bg-blue-100 text-blue-800 mr-2">Confirmada</Badge>
                  <span className="text-sm">Reserva confirmada, próxima entrega</span>
                </div>
                <div className="flex items-center">
                  <Badge className="bg-yellow-100 text-yellow-800 mr-2">Pendiente</Badge>
                  <span className="text-sm">Esperando confirmación</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Tipos de membresía:</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-rose-400 rounded mr-2"></div>
                  <span className="text-sm">L'Essentiel</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-purple-400 rounded mr-2"></div>
                  <span className="text-sm">Signature</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-indigo-600 rounded mr-2"></div>
                  <span className="text-sm">Privé</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

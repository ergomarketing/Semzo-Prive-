"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2 } from "lucide-react"

interface BagAvailability {
  id: string
  name: string
  brand: string
  images: string[]
  membershipType: "essentiel" | "signature" | "prive"
}

interface ReservationSlot {
  date: Date
  bagId: string
  status: "available" | "reserved" | "maintenance" | "blocked"
  customerName?: string
  reservationId?: string
}

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  isSelectable: boolean
  slots: ReservationSlot[]
  availableCount: number
}

interface EnhancedReservationCalendarProps {
  selectedBag?: BagAvailability
  onDateSelect?: (startDate: Date, endDate: Date) => void
  onBagSelect?: (bag: BagAvailability) => void
  minRentalDays?: number
  maxRentalDays?: number
}

export default function EnhancedReservationCalendar({
  selectedBag,
  onDateSelect,
  onBagSelect,
  minRentalDays = 7,
  maxRentalDays = 30,
}: EnhancedReservationCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null)
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null)
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([])
  const [availableBags, setAvailableBags] = useState<BagAvailability[]>([])
  const [reservationSlots, setReservationSlots] = useState<ReservationSlot[]>([])
  const [isSelectingRange, setIsSelectingRange] = useState(false)

  // Mock data - será reemplazado por API real
  useEffect(() => {
    const mockBags: BagAvailability[] = [
      {
        id: "chanel-classic",
        name: "Classic Flap Medium",
        brand: "Chanel",
        images: ["/images/chanel-signature.jpeg"],
        membershipType: "signature",
      },
      {
        id: "lv-neverfull",
        name: "Neverfull MM",
        brand: "Louis Vuitton",
        images: ["/images/louis-vuitton-lessentiel.jpeg"],
        membershipType: "essentiel",
      },
      {
        id: "hermes-birkin",
        name: "Birkin 30",
        brand: "Hermès",
        images: ["/images/hermes-prive.jpeg"],
        membershipType: "prive",
      },
    ]

    // Mock reservation slots
    const mockSlots: ReservationSlot[] = []
    const today = new Date()

    for (let i = 0; i < 60; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)

      mockBags.forEach((bag) => {
        const random = Math.random()
        let status: ReservationSlot["status"] = "available"
        let customerName: string | undefined

        if (random < 0.3) {
          status = "reserved"
          customerName = "Cliente Reservado"
        } else if (random < 0.35) {
          status = "maintenance"
        } else if (random < 0.4) {
          status = "blocked"
        }

        mockSlots.push({
          date: new Date(date),
          bagId: bag.id,
          status,
          customerName,
          reservationId: status === "reserved" ? `res-${i}-${bag.id}` : undefined,
        })
      })
    }

    setAvailableBags(mockBags)
    setReservationSlots(mockSlots)
  }, [])

  // Generate calendar days
  useEffect(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const firstDayOfWeek = firstDayOfMonth.getDay()
    const daysInMonth = lastDayOfMonth.getDate()

    const days: CalendarDay[] = []

    // Previous month days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i)
      const daySlots = getSlotsByDate(date)
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isSelectable: false,
        slots: daySlots,
        availableCount: daySlots.filter((slot) => slot.status === "available").length,
      })
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const daySlots = getSlotsByDate(date)
      const isToday = date.getTime() === today.getTime()
      const isSelectable = date >= today

      days.push({
        date,
        isCurrentMonth: true,
        isToday,
        isSelectable,
        slots: daySlots,
        availableCount: daySlots.filter(
          (slot) => slot.status === "available" && (!selectedBag || slot.bagId === selectedBag.id),
        ).length,
      })
    }

    // Next month days to complete grid
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day)
      const daySlots = getSlotsByDate(date)
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isSelectable: date >= today,
        slots: daySlots,
        availableCount: daySlots.filter((slot) => slot.status === "available").length,
      })
    }

    setCalendarDays(days)
  }, [currentDate, reservationSlots, selectedBag])

  const getSlotsByDate = (date: Date): ReservationSlot[] => {
    return reservationSlots.filter((slot) => slot.date.toDateString() === date.toDateString())
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

  const handleDateClick = (day: CalendarDay) => {
    if (!day.isSelectable || day.availableCount === 0) return

    if (!isSelectingRange) {
      // Start selecting range
      setSelectedStartDate(day.date)
      setSelectedEndDate(null)
      setIsSelectingRange(true)
    } else {
      // Complete range selection
      if (selectedStartDate && day.date > selectedStartDate) {
        const daysDiff = Math.ceil((day.date.getTime() - selectedStartDate.getTime()) / (1000 * 60 * 60 * 24))

        if (daysDiff < minRentalDays) {
          alert(`El período mínimo de alquiler es ${minRentalDays} días`)
          return
        }

        if (daysDiff > maxRentalDays) {
          alert(`El período máximo de alquiler es ${maxRentalDays} días`)
          return
        }

        setSelectedEndDate(day.date)
        setIsSelectingRange(false)

        if (onDateSelect) {
          onDateSelect(selectedStartDate, day.date)
        }
      } else {
        // Reset if invalid selection
        setSelectedStartDate(day.date)
        setSelectedEndDate(null)
      }
    }
  }

  const clearSelection = () => {
    setSelectedStartDate(null)
    setSelectedEndDate(null)
    setIsSelectingRange(false)
  }

  const isDateInRange = (date: Date): boolean => {
    if (!selectedStartDate) return false
    if (!selectedEndDate) return date.getTime() === selectedStartDate.getTime()
    return date >= selectedStartDate && date <= selectedEndDate
  }

  const getDateStatus = (day: CalendarDay): string => {
    if (!day.isSelectable) return "disabled"
    if (day.availableCount === 0) return "unavailable"
    if (isDateInRange(day.date)) return "selected"
    if (day.availableCount < availableBags.length) return "partial"
    return "available"
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "selected":
        return "bg-indigo-600 text-white"
      case "available":
        return "bg-green-50 text-green-800 hover:bg-green-100"
      case "partial":
        return "bg-yellow-50 text-yellow-800 hover:bg-yellow-100"
      case "unavailable":
        return "bg-red-50 text-red-800"
      case "disabled":
        return "bg-gray-50 text-gray-400"
      default:
        return "bg-white text-gray-900 hover:bg-gray-50"
    }
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

  return (
    <div className="space-y-6">
      {/* Header with bag selection */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Calendario de Reservas
            </div>
            {selectedBag && (
              <Badge className="bg-indigo-100 text-indigo-800">
                {selectedBag.brand} {selectedBag.name}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent>
          {/* Bag selection */}
          {!selectedBag && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Selecciona un bolso:</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {availableBags.map((bag) => (
                  <Card
                    key={bag.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onBagSelect?.(bag)}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                        <img
                          src={bag.images[0] || "/placeholder.svg"}
                          alt={bag.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h4 className="font-medium">{bag.brand}</h4>
                      <p className="text-sm text-gray-600">{bag.name}</p>
                      <Badge className="mt-2 text-xs capitalize">{bag.membershipType}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Calendar navigation */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-xl font-semibold">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Selection info */}
          {(selectedStartDate || isSelectingRange) && (
            <div className="mb-4 p-4 bg-indigo-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  {selectedStartDate && !selectedEndDate && (
                    <p className="text-sm text-indigo-800">
                      <strong>Fecha de inicio:</strong> {selectedStartDate.toLocaleDateString()}
                      <br />
                      <span className="text-indigo-600">Selecciona la fecha de fin</span>
                    </p>
                  )}
                  {selectedStartDate && selectedEndDate && (
                    <p className="text-sm text-indigo-800">
                      <strong>Período seleccionado:</strong> {selectedStartDate.toLocaleDateString()} -{" "}
                      {selectedEndDate.toLocaleDateString()}
                      <br />
                      <span className="text-indigo-600">
                        {Math.ceil((selectedEndDate.getTime() - selectedStartDate.getTime()) / (1000 * 60 * 60 * 24))}{" "}
                        días
                      </span>
                    </p>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Limpiar
                </Button>
              </div>
            </div>
          )}

          {/* Calendar grid */}
          <div className="space-y-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1">
              {dayNames.map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const status = getDateStatus(day)
                return (
                  <div
                    key={index}
                    className={`min-h-[80px] p-2 border border-gray-200 cursor-pointer transition-colors ${
                      day.isCurrentMonth ? getStatusColor(status) : "bg-gray-50 text-gray-400"
                    } ${day.isToday ? "ring-2 ring-indigo-500" : ""}`}
                    onClick={() => handleDateClick(day)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${day.isToday ? "font-bold" : ""}`}>
                        {day.date.getDate()}
                      </span>
                      {day.isToday && (
                        <Badge variant="outline" className="text-xs bg-indigo-100 text-indigo-800">
                          Hoy
                        </Badge>
                      )}
                    </div>

                    {day.isCurrentMonth && day.isSelectable && (
                      <div className="space-y-1">
                        {day.availableCount > 0 ? (
                          <div className="flex items-center text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1 text-green-600" />
                            <span>
                              {day.availableCount} disponible{day.availableCount > 1 ? "s" : ""}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center text-xs text-red-600">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            <span>No disponible</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-3">Leyenda:</h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-100 border border-green-200 rounded mr-2"></div>
                  <span>Completamente disponible</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded mr-2"></div>
                  <span>Parcialmente disponible</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-100 border border-red-200 rounded mr-2"></div>
                  <span>No disponible</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-indigo-600 rounded mr-2"></div>
                  <span>Fechas seleccionadas</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

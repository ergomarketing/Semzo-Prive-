"use client"

// Reservas Dashboard - v1.0.1
import { useEffect, useState } from "react"
import { useAuth } from "../../hooks/useAuth"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, Loader2, Package, Calendar, Filter, X } from "lucide-react"
import { supabase } from "../../lib/supabaseClient"
import { useRouter } from "next/navigation"

interface Reservation {
  id: string
  bag_id: string
  status: string
  start_date: string
  end_date: string
  total_amount: number
  created_at: string
  bags: {
    name: string
    brand: string
    image_url: string
  } | null
}

interface Stats {
  total: number
  active: number
  pending: number
  confirmed: number
  completed: number
  cancelled: number
}

export default function ReservasPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  })
  const [activeFilter, setActiveFilter] = useState<string>("all")

  useEffect(() => {
    const fetchReservations = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        console.log("[Reservas] Fetching reservations for user:", user.id)
        const { data, error } = await supabase
          .from("reservations")
          .select(`
            id,
            bag_id,
            status,
            start_date,
            end_date,
            total_amount,
            created_at,
            bags (
              name,
              brand,
              image_url
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (error) {
          console.error("[Reservas] Error fetching reservations:", error)
          setError("No se pudieron cargar tus reservas. Por favor, intenta de nuevo.")
          throw error
        }

        console.log("[Reservas] Reservations fetched:", data?.length || 0)
        const reservationsData = data || []
        setReservations(reservationsData)
        setFilteredReservations(reservationsData)

        // Calcular estadísticas
        const newStats = {
          total: reservationsData.length,
          active: reservationsData.filter((r) => r.status === "active").length,
          pending: reservationsData.filter((r) => r.status === "pending").length,
          confirmed: reservationsData.filter((r) => r.status === "confirmed").length,
          completed: reservationsData.filter((r) => r.status === "completed").length,
          cancelled: reservationsData.filter((r) => r.status === "cancelled").length,
        }
        setStats(newStats)
      } catch (error) {
        console.error("[Reservas] Error in fetchReservations:", error)
        setError(error instanceof Error ? error.message : "Error desconocido")
      } finally {
        setLoading(false)
      }
    }

    fetchReservations()
  }, [user])

  useEffect(() => {
    // Aplicar filtro
    if (activeFilter === "all") {
      setFilteredReservations(reservations)
    } else {
      setFilteredReservations(reservations.filter((r) => r.status === activeFilter))
    }
  }, [activeFilter, reservations])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: "Activa", className: "bg-green-100 text-green-800 border-green-200" },
      pending: { label: "Pendiente", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      confirmed: { label: "Confirmada", className: "bg-blue-100 text-blue-800 border-blue-200" },
      completed: { label: "Completada", className: "bg-slate-100 text-slate-800 border-slate-200" },
      cancelled: { label: "Cancelada", className: "bg-red-100 text-red-800 border-red-200" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

    return (
      <Badge variant="secondary" className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const handleViewDetails = (reservationId: string) => {
    router.push(`/dashboard/reservas/${reservationId}`)
  }

  const clearFilter = () => {
    setActiveFilter("all")
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
      <div className="max-w-4xl mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <h3 className="text-red-900 font-serif text-lg mb-2">Error al cargar reservas</h3>
            <p className="text-red-700 text-sm mb-4">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-serif text-slate-900 mb-2">Mis Reservas</h2>
        <p className="text-slate-600">Gestiona tus reservas activas y revisa tu historial</p>
      </div>

      {/* Estadísticas */}
      {reservations.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveFilter("all")}>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
              <div className="text-sm text-slate-600">Total</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveFilter("active")}>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-slate-600">Activas</div>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setActiveFilter("confirmed")}
          >
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.confirmed}</div>
              <div className="text-sm text-slate-600">Confirmadas</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveFilter("pending")}>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-slate-600">Pendientes</div>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setActiveFilter("completed")}
          >
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-slate-600">{stats.completed}</div>
              <div className="text-sm text-slate-600">Completadas</div>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setActiveFilter("cancelled")}
          >
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
              <div className="text-sm text-slate-600">Canceladas</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtro activo */}
      {activeFilter !== "all" && (
        <div className="mb-4 flex items-center gap-2">
          <Badge variant="outline" className="text-sm py-1 px-3">
            <Filter className="h-3 w-3 mr-1" />
            Filtrando por: {activeFilter}
          </Badge>
          <Button variant="ghost" size="sm" onClick={clearFilter} className="h-7 px-2">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Lista de reservas */}
      {filteredReservations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingBag className="h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-xl font-serif text-slate-900 mb-2">
              {activeFilter === "all" ? "No tienes reservas" : `No tienes reservas ${activeFilter}`}
            </h3>
            <p className="text-slate-600 text-center mb-6">
              {activeFilter === "all"
                ? "Explora nuestro catálogo y reserva tu primer bolso de lujo."
                : "Prueba con otro filtro o explora el catálogo."}
            </p>
            <div className="flex gap-3">
              {activeFilter !== "all" && (
                <Button
                  onClick={clearFilter}
                  variant="outline"
                  className="border-slate-300 text-slate-700 hover:bg-slate-100 font-serif bg-transparent"
                >
                  Ver Todas
                </Button>
              )}
              <Button
                onClick={() => router.push("/catalog")}
                className="bg-slate-900 hover:bg-slate-800 text-white font-serif"
              >
                <Package className="h-4 w-4 mr-2" />
                Explorar Catálogo
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReservations.map((reservation) => {
            const startDate = new Date(reservation.start_date)
            const endDate = new Date(reservation.end_date)
            const now = new Date()
            const isUpcoming = startDate > now
            const isActive = reservation.status === "active"
            const isPast = endDate < now

            return (
              <Card key={reservation.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {reservation.bags?.image_url ? (
                      <img
                        src={reservation.bags.image_url || "/placeholder.svg"}
                        alt={reservation.bags?.name || "Bolso"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="h-8 w-8 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-serif text-slate-900 truncate">
                      {reservation.bags?.name || "Bolso sin nombre"}
                    </h3>
                    <p className="text-sm text-slate-600 mb-2">{reservation.bags?.brand || "Marca desconocida"}</p>
                    <div className="flex flex-wrap items-center gap-3">
                      {getStatusBadge(reservation.status)}
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {startDate.toLocaleDateString("es-ES")} - {endDate.toLocaleDateString("es-ES")}
                        </span>
                      </div>
                      {isUpcoming && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          Próxima
                        </Badge>
                      )}
                      {isActive && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          En curso
                        </Badge>
                      )}
                    </div>
                    {reservation.total_amount && (
                      <p className="text-sm text-slate-700 mt-2 font-medium">
                        Total: ${reservation.total_amount.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => handleViewDetails(reservation.id)}
                    variant="outline"
                    className="border-slate-300 text-slate-700 hover:bg-slate-100 font-serif bg-transparent flex-shrink-0"
                  >
                    Ver Detalles
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

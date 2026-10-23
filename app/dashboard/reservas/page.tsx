"use client"

import { useEffect, useState, useRef } from "react"
import { useAuth } from "../../hooks/useAuth"
import { Card, CardContent } from "@/components/panel/card"
import { PageHeader, PanelEmpty } from "@/components/panel/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, Loader2, Package, Calendar, Filter, X, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations, useLocale } from "next-intl"

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
  const t = useTranslations("reservasPage")
  const locale = useLocale()
  const { user, loading: authLoading } = useAuth()
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
  const hasFetched = useRef(false)

  const fetchReservations = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/user/reservations?user_id=${user.id}`, {
        headers: {
          "x-user-id": user.id,
        },
      })

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        throw new Error(response.status === 429 ? t("tooManyRequests") : text)
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar reservas")
      }

      const reservationsData = data.reservations || []
      setReservations(reservationsData)
      setFilteredReservations(reservationsData)
      setStats(
        data.stats || {
          total: reservationsData.length,
          active: reservationsData.filter((r: Reservation) => r.status === "active").length,
          pending: reservationsData.filter((r: Reservation) => r.status === "pending").length,
          confirmed: reservationsData.filter((r: Reservation) => r.status === "confirmed").length,
          completed: reservationsData.filter((r: Reservation) => r.status === "completed").length,
          cancelled: reservationsData.filter((r: Reservation) => r.status === "cancelled").length,
        },
      )
    } catch (error) {
      console.error("Error fetching reservations:", error)
      setError(error instanceof Error ? error.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && user && !hasFetched.current) {
      hasFetched.current = true
      fetchReservations()
    } else if (!authLoading && !user) {
      setLoading(false)
    }
  }, [user, authLoading])

  const handleManualRefresh = () => {
    hasFetched.current = false
    fetchReservations()
  }

  useEffect(() => {
    if (activeFilter === "all") {
      setFilteredReservations(reservations)
    } else {
      setFilteredReservations(reservations.filter((r) => r.status === activeFilter))
    }
  }, [activeFilter, reservations])

  const getStatusBadge = (status: string) => {
    const gold = "bg-[#b08d57]/15 text-[#7a5f33] border-transparent"
    const statusConfig = {
      active:    { label: t("statusActive"),    className: gold },
      pending:   { label: t("statusPending"),   className: "bg-slate-100 text-slate-700 border-transparent" },
      confirmed: { label: t("statusConfirmed"), className: "bg-indigo-dark/10 text-indigo-dark border-transparent" },
      completed: { label: t("statusCompleted"), className: "bg-slate-100 text-slate-500 border-transparent" },
      cancelled: { label: t("statusCancelled"), className: "bg-rose-pastel/40 text-indigo-dark border-transparent" },
      overdue:   { label: t("statusOverdue"),   className: "bg-red-100 text-red-800 border-transparent" },
      queued:    { label: "Próximo bolso (en cola)", className: gold },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, className: "bg-slate-100 text-slate-700 border-transparent" }

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

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-slate-600" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-serif mb-2">{t("loginRequired")}</h3>
            <Button onClick={() => router.push("/auth/login")} className="bg-indigo-dark text-white hover:bg-indigo-dark/90">
              {t("signIn")}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="border-[#f4c4cc] bg-[#fff0f3]">
          <CardContent className="p-6">
            <h3 className="text-[#1a1a4b] font-serif text-lg mb-2">{t("errorTitle")}</h3>
            <p className="text-[#1a1a4b]/70 text-sm mb-4">{error}</p>
            <Button
              onClick={handleManualRefresh}
              variant="outline"
              className="border-[#1a1a4b] text-[#1a1a4b] hover:bg-[#1a1a4b] hover:text-white bg-transparent"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {t("retry")}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Card className={`cursor-pointer transition-colors hover:border-indigo-dark/30 ${activeFilter === "all" ? "border-[#b08d57] bg-[#b08d57]/[0.06]" : ""}`} onClick={() => setActiveFilter("all")}>
          <CardContent className="p-4">
            <div className="font-serif text-3xl text-indigo-dark">{stats.total}</div>
            <div className="text-xs uppercase tracking-wide text-slate-500">{t("statTotal")}</div>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer transition-colors hover:border-indigo-dark/30 ${activeFilter === "active" ? "border-[#b08d57] bg-[#b08d57]/[0.06]" : ""}`} onClick={() => setActiveFilter("active")}>
          <CardContent className="p-4">
            <div className="font-serif text-3xl text-indigo-dark">{stats.active}</div>
            <div className="text-xs uppercase tracking-wide text-slate-500">{t("statActive")}</div>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer transition-colors hover:border-indigo-dark/30 ${activeFilter === "confirmed" ? "border-[#b08d57] bg-[#b08d57]/[0.06]" : ""}`} onClick={() => setActiveFilter("confirmed")}>
          <CardContent className="p-4">
            <div className="font-serif text-3xl text-indigo-dark">{stats.confirmed}</div>
            <div className="text-xs uppercase tracking-wide text-slate-500">{t("statConfirmed")}</div>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer transition-colors hover:border-indigo-dark/30 ${activeFilter === "pending" ? "border-[#b08d57] bg-[#b08d57]/[0.06]" : ""}`} onClick={() => setActiveFilter("pending")}>
          <CardContent className="p-4">
            <div className="font-serif text-3xl text-indigo-dark">{stats.pending}</div>
            <div className="text-xs uppercase tracking-wide text-slate-500">{t("statPending")}</div>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer transition-colors hover:border-indigo-dark/30 ${activeFilter === "completed" ? "border-[#b08d57] bg-[#b08d57]/[0.06]" : ""}`} onClick={() => setActiveFilter("completed")}>
          <CardContent className="p-4">
            <div className="font-serif text-3xl text-indigo-dark">{stats.completed}</div>
            <div className="text-xs uppercase tracking-wide text-slate-500">{t("statCompleted")}</div>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer transition-colors hover:border-indigo-dark/30 ${activeFilter === "cancelled" ? "border-[#b08d57] bg-[#b08d57]/[0.06]" : ""}`} onClick={() => setActiveFilter("cancelled")}>
          <CardContent className="p-4">
            <div className="font-serif text-3xl text-indigo-dark">{stats.cancelled}</div>
            <div className="text-xs uppercase tracking-wide text-slate-500">{t("statCancelled")}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtro activo */}
      {activeFilter !== "all" && (
        <div className="mb-4 flex items-center gap-2">
          <Badge variant="outline" className="text-sm py-1 px-3">
            <Filter className="h-3 w-3 mr-1" />
            {t("filteringBy")} {activeFilter}
          </Badge>
          <Button variant="ghost" size="sm" onClick={clearFilter} className="h-7 px-2">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Lista de reservas */}
      {filteredReservations.length === 0 ? (
        <Card>
          <PanelEmpty
            icon={<ShoppingBag className="h-6 w-6" />}
            title={activeFilter === "all" ? t("noReservations") : t("noReservationsFiltered", { status: activeFilter })}
            text={activeFilter === "all" ? t("noReservationsDesc") : t("noReservationsFilteredDesc")}
            action={
              <div className="flex flex-wrap justify-center gap-3">
                {activeFilter !== "all" && (
                  <Button
                    onClick={clearFilter}
                    variant="outline"
                    className="border-indigo-dark/15 bg-transparent font-serif text-slate-700 hover:bg-rose-nude/40"
                  >
                    {t("seeAll")}
                  </Button>
                )}
                <Button
                  onClick={() => router.push("/catalog")}
                  className="h-11 rounded-md bg-indigo-dark px-6 text-xs font-medium uppercase tracking-[0.18em] text-white hover:bg-indigo-dark/90"
                >
                  <Package className="mr-2 h-4 w-4 text-[#d9bd8a]" />
                  {t("exploreCatalog")}
                </Button>
              </div>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReservations.map((reservation) => {
            const startDate = new Date(reservation.start_date)
            const endDate = new Date(reservation.end_date)
            const now = new Date()
            const isUpcoming = startDate > now
            const isActive = reservation.status === "active"

            return (
              <Card key={reservation.id} className="transition-colors hover:border-indigo-dark/25">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-rose-nude/60">
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
                    <h3 className="truncate text-xl font-serif text-indigo-dark">
                      {reservation.bags?.name || t("unknownBag")}
                    </h3>
                    <p className="text-sm text-slate-600 mb-2">{reservation.bags?.brand || t("unknownBrand")}</p>
                    <div className="flex flex-wrap items-center gap-3">
                      {getStatusBadge(reservation.status)}
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {startDate.toLocaleDateString(locale === "en" ? "en-GB" : "es-ES")} -{" "}
                          {endDate.toLocaleDateString(locale === "en" ? "en-GB" : "es-ES")}
                        </span>
                      </div>
                      {isUpcoming && (
                        <Badge variant="outline" className="text-xs bg-indigo-dark/10 text-indigo-dark border-transparent">
                          {t("upcoming")}
                        </Badge>
                      )}
                      {isActive && (
                        <Badge variant="outline" className="text-xs bg-[#b08d57]/15 text-[#7a5f33] border-transparent">
                          {t("inProgress")}
                        </Badge>
                      )}
                    </div>
                    {reservation.total_amount && (
                      <p className="mt-2 font-serif text-base text-indigo-dark">
                        {t("totalLabel")} {reservation.total_amount.toFixed(2)}€
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => handleViewDetails(reservation.id)}
                    variant="outline"
                    className="flex-shrink-0 border-indigo-dark/15 bg-transparent font-serif text-slate-700 hover:bg-rose-nude/40"
                  >
                    {t("viewDetails")}
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

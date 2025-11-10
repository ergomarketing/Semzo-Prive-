"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, Edit, Trash2, Plus, CheckCircle2, User, X, CalendarIcon } from "lucide-react"
import { getSupabaseBrowser } from "@/app/lib/supabaseClient"
import { useRouter } from "next/navigation"
import { startOfMonth, endOfMonth, eachDayOfInterval, format, parseISO } from "date-fns"
import { es } from "date-fns/locale"

interface Bag {
  id: string
  name: string
  brand: string
  status: "available" | "rented" | "maintenance"
  condition: string
  membership_category?: string
  waitingCount?: number
  last_maintenance?: string
  current_member_id?: string | null
}

interface Reservation {
  id: string
  bagName: string
  memberName: string
  startDate: string
  endDate: string
  status: "pending" | "active" | "completed" | "cancelled"
  membershipType?: string
}

export default function AdminInventoryPage() {
  const [bags, setBags] = useState<Bag[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"inventory" | "calendar">("inventory")
  const [selectedBag, setSelectedBag] = useState<Bag | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const router = useRouter()

  useEffect(() => {
    loadBags()
    loadReservations()
  }, [])

  async function loadBags() {
    console.log("[v0] 📦 Cargando bolsos desde Supabase...")
    try {
      const supabase = getSupabaseBrowser()
      const { data, error } = await supabase.from("bags").select("*").order("name")

      if (error) {
        console.error("[v0] ❌ Error loading bags:", error)
        return
      }

      console.log("[v0] ✅ Bolsos cargados:", data?.length)
      setBags(data || [])
    } catch (error) {
      console.error("[v0] ❌ Error:", error)
    } finally {
      setLoading(false)
    }
  }

  async function loadReservations() {
    try {
      const response = await fetch("/api/admin/reservations")
      if (!response.ok) throw new Error("Failed to fetch reservations")
      const data = await response.json()
      setReservations(data)
    } catch (error) {
      console.error("[v0] ❌ Error loading reservations:", error)
    }
  }

  async function changeStatus(bagId: string, currentStatus: string, newStatus: string) {
    const confirmMessages = {
      rented:
        "¿Marcar este bolso como rentado manualmente? Normalmente esto se hace automáticamente cuando un usuario paga.",
      maintenance: "¿Enviar este bolso a mantenimiento? El bolso no estará disponible para renta.",
      available:
        "¿Marcar este bolso como disponible? Asegúrate de que ha sido devuelto o el mantenimiento está completo.",
    }

    if (!confirm(confirmMessages[newStatus as keyof typeof confirmMessages])) return

    console.log("[v0] 🔄 Cambiando estado de bolso:", bagId, "de", currentStatus, "a", newStatus)
    try {
      const supabase = getSupabaseBrowser()
      const updateData: any = { status: newStatus }

      if (newStatus === "maintenance") {
        updateData.last_maintenance = new Date().toISOString()
      }

      if (newStatus === "available") {
        updateData.current_member_id = null
      }

      const { error } = await supabase.from("bags").update(updateData).eq("id", bagId)

      if (error) {
        console.error("[v0] ❌ Error updating status:", error)
        alert("Error al actualizar el estado del bolso")
        return
      }

      console.log("[v0] ✅ Estado actualizado")
      loadBags()
    } catch (error) {
      console.error("[v0] ❌ Error:", error)
      alert("Error al actualizar el estado del bolso")
    }
  }

  async function deleteBag(bagId: string) {
    if (!confirm("¿Estás seguro de eliminar este bolso?")) return

    console.log("[v0] 🗑️ Eliminando bolso:", bagId)
    try {
      const supabase = getSupabaseBrowser()
      const { error } = await supabase.from("bags").delete().eq("id", bagId)

      if (error) {
        console.error("[v0] ❌ Error deleting bag:", error)
        alert("Error al eliminar el bolso")
        return
      }

      console.log("[v0] ✅ Bolso eliminado")
      loadBags()
    } catch (error) {
      console.error("[v0] ❌ Error:", error)
      alert("Error al eliminar el bolso")
    }
  }

  const availableCount = bags.filter((b) => b.status === "available").length
  const rentedCount = bags.filter((b) => b.status === "rented").length
  const maintenanceCount = bags.filter((b) => b.status === "maintenance").length

  const getDayReservations = (date: Date) => {
    return reservations.filter((res) => {
      const start = parseISO(res.startDate)
      const end = parseISO(res.endDate)
      return date >= start && date <= end
    })
  }

  const getDayColor = (reservations: Reservation[]) => {
    if (reservations.length === 0) return ""
    const hasActive = reservations.some((r) => r.status === "active")
    const hasConfirmed = reservations.some((r) => r.status === "pending")
    if (hasActive) return "bg-green-100"
    if (hasConfirmed) return "bg-blue-100"
    return "bg-yellow-100"
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8 max-w-[1400px]">
        <div className="text-center py-16">
          <p className="text-lg text-gray-500">Cargando inventario...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8 max-w-[1400px]">
      <div className="mb-8">
        <h1 className="text-4xl font-serif mb-2">Panel de Administración</h1>
        <p className="text-gray-600">Gestiona el inventario y reservas de bolsos</p>
      </div>

      <div className="flex gap-8 mb-8 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("inventory")}
          className={`pb-4 px-2 font-medium transition-colors relative ${
            activeTab === "inventory" ? "text-gray-900" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Inventario
          {activeTab === "inventory" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />}
        </button>
        <button
          onClick={() => setActiveTab("calendar")}
          className={`pb-4 px-2 font-medium transition-colors relative ${
            activeTab === "calendar" ? "text-gray-900" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Calendario
          {activeTab === "calendar" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />}
        </button>
      </div>

      {activeTab === "inventory" && (
        <>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-serif">Sistema de Inventario Real</h2>
            <div className="flex items-center gap-6">
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => router.push("/admin/inventory/add")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Bolso
              </Button>
              <div className="flex gap-6 text-sm font-medium">
                <span className="text-gray-700">{availableCount} Disponibles</span>
                <span className="text-gray-700">{rentedCount} Alquilados</span>
                <span className="text-gray-700">{maintenanceCount} Mantenimiento</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {bags.map((bag) => (
              <Card
                key={bag.id}
                className="p-5 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-base mb-1">{bag.name}</h3>
                    <p className="text-sm text-gray-500">{bag.brand}</p>
                    {bag.membership_category && (
                      <div className="mt-2 inline-block px-2 py-1 bg-indigo-50 rounded text-xs font-semibold text-indigo-700">
                        {bag.membership_category === "PRIVÉ"
                          ? "Privé (189€)"
                          : bag.membership_category === "L'ESSENTIEL"
                            ? "L'Essentiel (59€)"
                            : bag.membership_category === "SIGNATURE"
                              ? "Signature (159€)"
                              : bag.membership_category}
                      </div>
                    )}
                  </div>
                  <div className="ml-2">
                    {bag.status === "available" && (
                      <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      </div>
                    )}
                    {bag.status === "rented" && (
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                    )}
                  </div>
                </div>

                {bag.status === "rented" && (
                  <div className="mb-3 px-3 py-2 bg-blue-50 rounded text-sm text-blue-700 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>Fuera con miembro</span>
                  </div>
                )}

                {bag.waitingCount && bag.waitingCount > 0 && (
                  <div className="mb-3 px-3 py-2 bg-gray-100 rounded text-sm text-gray-700 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{bag.waitingCount} en espera</span>
                  </div>
                )}

                <div className="flex gap-2 mb-4">
                  {bag.status === "rented" ? (
                    <>
                      <button
                        onClick={() => changeStatus(bag.id, bag.status, "available")}
                        className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium text-center rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
                        title="Click para marcar como disponible"
                      >
                        Rentado
                      </button>
                      <button
                        onClick={() => changeStatus(bag.id, bag.status, "maintenance")}
                        className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-600 text-sm font-medium text-center rounded-md hover:bg-gray-200 transition-colors cursor-pointer"
                        title="Click para enviar a mantenimiento"
                      >
                        Manten.
                      </button>
                    </>
                  ) : bag.status === "available" ? (
                    <>
                      <button
                        onClick={() => changeStatus(bag.id, bag.status, "rented")}
                        className="flex-1 px-3 py-1.5 bg-pink-200 text-pink-900 text-sm font-medium text-center rounded-md hover:bg-pink-300 transition-colors cursor-pointer"
                        title="Click para marcar como rentado"
                      >
                        Disponible
                      </button>
                      <button
                        onClick={() => changeStatus(bag.id, bag.status, "maintenance")}
                        className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-600 text-sm font-medium text-center rounded-md hover:bg-gray-200 transition-colors cursor-pointer"
                        title="Click para enviar a mantenimiento"
                      >
                        Manten.
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => changeStatus(bag.id, bag.status, "available")}
                        className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-600 text-sm font-medium text-center rounded-md hover:bg-gray-200 transition-colors cursor-pointer"
                        title="Click para marcar como disponible"
                      >
                        Disponible
                      </button>
                      <button
                        onClick={() => changeStatus(bag.id, bag.status, "rented")}
                        className="flex-1 px-3 py-1.5 bg-gray-600 text-white text-sm font-medium text-center rounded-md hover:bg-gray-700 transition-colors cursor-pointer"
                        title="Click para marcar como rentado"
                      >
                        Mantenimiento
                      </button>
                    </>
                  )}
                </div>

                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1 text-gray-600 hover:text-gray-900"
                    onClick={() => setSelectedBag(bag)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1 text-gray-600 hover:text-gray-900"
                    onClick={() => router.push(`/admin/inventory/${bag.id}/edit`)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => deleteBag(bag.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {activeTab === "calendar" && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif flex items-center gap-2">
                <CalendarIcon className="h-6 w-6" />
                Calendario de Reservas
              </h2>
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                >
                  ←
                </Button>
                <span className="font-semibold min-w-[200px] text-center">
                  {format(currentMonth, "MMMM yyyy", { locale: es })}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                >
                  →
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-4">
              {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {eachDayOfInterval({
                start: startOfMonth(currentMonth),
                end: endOfMonth(currentMonth),
              }).map((day) => {
                const dayReservations = getDayReservations(day)
                const colorClass = getDayColor(dayReservations)
                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-[80px] border rounded-lg p-2 ${colorClass} hover:shadow-md transition-shadow cursor-pointer`}
                    title={
                      dayReservations.length > 0
                        ? dayReservations.map((r) => `${r.bagName} - ${r.memberName}`).join("\n")
                        : ""
                    }
                  >
                    <div className="text-sm font-medium text-gray-900">{format(day, "d")}</div>
                    {dayReservations.length > 0 && (
                      <div className="text-xs text-gray-600 mt-1">
                        {dayReservations.length} reserva{dayReservations.length > 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-serif mb-4">Leyenda</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Estados de reserva:</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-100 border border-green-200" />
                    <span className="text-sm text-gray-600">Activa</span>
                    <span className="text-xs text-gray-500">Bolso actualmente alquilado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-100 border border-blue-200" />
                    <span className="text-sm text-gray-600">Confirmada</span>
                    <span className="text-xs text-gray-500">Reserva confirmada, próxima entrega</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-200" />
                    <span className="text-sm text-gray-600">Pendiente</span>
                    <span className="text-xs text-gray-500">Esperando confirmación</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Tipos de membresía:</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-orange-100 border border-orange-200" />
                    <span className="text-sm text-gray-600">L'Essentiel</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-pink-100 border border-pink-200" />
                    <span className="text-sm text-gray-600">Signature</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-purple-100 border border-purple-200" />
                    <span className="text-sm text-gray-600">Privé</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {selectedBag && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedBag(null)}
        >
          <div className="bg-white rounded-lg p-8 max-w-lg w-full mx-4 relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedBag(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full border-2 border-gray-900 flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-2xl font-serif mb-6">
              {selectedBag.name} - {selectedBag.brand}
            </h2>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Estado</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="font-medium capitalize">
                    {selectedBag.status === "available" ? "Available" : selectedBag.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Alquileres</span>
                <span className="font-medium">0</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">En Lista de Espera</span>
                <span className="font-medium">{selectedBag.waitingCount || 0} personas</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Último Mantenimiento</span>
                <span className="font-medium">
                  {selectedBag.last_maintenance
                    ? new Date(selectedBag.last_maintenance).toLocaleDateString("es-ES")
                    : "No registrado"}
                </span>
              </div>

              {selectedBag.membership_category && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Categoría de Membresía</span>
                  <span className="font-medium">
                    {selectedBag.membership_category === "PRIVÉ"
                      ? "Privé (189€)"
                      : selectedBag.membership_category === "L'ESSENTIEL"
                        ? "L'Essentiel (59€)"
                        : selectedBag.membership_category === "SIGNATURE"
                          ? "Signature (159€)"
                          : selectedBag.membership_category}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

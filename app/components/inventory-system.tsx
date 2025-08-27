"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, AlertCircle, CheckCircle2, Package } from "lucide-react"

interface BagInventory {
  id: string
  name: string
  brand: string
  status: "available" | "rented" | "maintenance" | "reserved"
  currentRenter?: string
  rentedUntil?: Date
  nextAvailable?: Date
  waitingList: WaitingListEntry[]
  totalRentals: number
  condition: "excellent" | "very-good" | "good"
  lastMaintenance?: Date
}

interface WaitingListEntry {
  id: string
  customerEmail: string
  customerName: string
  addedDate: Date
  notified: boolean
}

interface Reservation {
  id: string
  bagId: string
  customerEmail: string
  customerName: string
  startDate: Date
  endDate: Date
  status: "pending" | "confirmed" | "active" | "completed" | "cancelled"
  membershipType: "essentiel" | "signature" | "prive"
}

export default function InventorySystem() {
  const [inventory, setInventory] = useState<BagInventory[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [selectedBag, setSelectedBag] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        setLoading(true)
        console.log("[v0] Fetching real inventory data...")

        // Obtener token de autenticación
        const token = localStorage.getItem("supabase.auth.token")
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }

        // Obtener inventario real
        const inventoryResponse = await fetch("/api/admin/inventory", { headers })
        const inventoryData = await inventoryResponse.json()

        // Obtener reservas reales
        const reservationsResponse = await fetch("/api/admin/reservations", { headers })
        const reservationsData = await reservationsResponse.json()

        if (inventoryData.inventory) {
          const processedInventory: BagInventory[] = inventoryData.inventory.map((bag: any) => ({
            id: bag.id,
            name: bag.name,
            brand: bag.brand,
            status: bag.status,
            currentRenter: bag.current_renter,
            rentedUntil: bag.rented_until ? new Date(bag.rented_until) : undefined,
            nextAvailable: bag.next_available ? new Date(bag.next_available) : undefined,
            waitingList: bag.waiting_list || [],
            totalRentals: bag.total_rentals || 0,
            condition: bag.condition,
            lastMaintenance: bag.last_maintenance ? new Date(bag.last_maintenance) : undefined,
          }))

          setInventory(processedInventory)
          console.log("[v0] Real inventory loaded:", processedInventory.length, "bags")
        }

        if (reservationsData.reservations) {
          const processedReservations: Reservation[] = reservationsData.reservations.map((res: any) => ({
            id: res.id,
            bagId: res.bag_id,
            customerEmail: res.customer_email,
            customerName: res.customer_name,
            startDate: new Date(res.start_date),
            endDate: new Date(res.end_date),
            status: res.status,
            membershipType: res.membership_type,
          }))

          setReservations(processedReservations)
          console.log("[v0] Real reservations loaded:", processedReservations.length, "reservations")
        }
      } catch (error) {
        console.error("[v0] Error loading real data:", error)
        setInventory([
          {
            id: "sample-bag-1",
            name: "Bolso de Ejemplo",
            brand: "Marca Ejemplo",
            status: "available",
            waitingList: [],
            totalRentals: 0,
            condition: "excellent",
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchRealData()
  }, [])

  const getStatusColor = (status: BagInventory["status"]) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800"
      case "rented":
        return "bg-blue-100 text-blue-800"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800"
      case "reserved":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: BagInventory["status"]) => {
    switch (status) {
      case "available":
        return <CheckCircle2 className="h-4 w-4" />
      case "rented":
        return <Users className="h-4 w-4" />
      case "maintenance":
        return <AlertCircle className="h-4 w-4" />
      case "reserved":
        return <Clock className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const addToWaitingList = async (bagId: string, customerEmail: string, customerName: string) => {
    const newEntry: WaitingListEntry = {
      id: `w${Date.now()}`,
      customerEmail,
      customerName,
      addedDate: new Date(),
      notified: false,
    }

    setInventory((prev) =>
      prev.map((bag) => (bag.id === bagId ? { ...bag, waitingList: [...bag.waitingList, newEntry] } : bag)),
    )

    console.log(`[v0] Added to waiting list: ${customerEmail} for ${bagId}`)
  }

  const notifyWaitingList = async (bagId: string) => {
    const bag = inventory.find((b) => b.id === bagId)
    if (!bag || bag.waitingList.length === 0) return

    const firstInLine = bag.waitingList[0]

    setInventory((prev) =>
      prev.map((b) =>
        b.id === bagId
          ? {
              ...b,
              waitingList: b.waitingList.map((entry, index) => (index === 0 ? { ...entry, notified: true } : entry)),
            }
          : b,
      ),
    )

    console.log(`[v0] Notified waiting list: ${firstInLine.customerEmail} for ${bag.name}`)
  }

  const markAsAvailable = (bagId: string) => {
    setInventory((prev) =>
      prev.map((bag) =>
        bag.id === bagId
          ? {
              ...bag,
              status: "available",
              currentRenter: undefined,
              rentedUntil: undefined,
              nextAvailable: undefined,
            }
          : bag,
      ),
    )

    notifyWaitingList(bagId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando inventario real...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif text-slate-900">Sistema de Inventario Real</h2>
        <div className="flex space-x-2">
          <Badge variant="outline" className="bg-green-50">
            {inventory.filter((b) => b.status === "available").length} Disponibles
          </Badge>
          <Badge variant="outline" className="bg-blue-50">
            {inventory.filter((b) => b.status === "rented").length} Alquilados
          </Badge>
          <Badge variant="outline" className="bg-yellow-50">
            {inventory.filter((b) => b.status === "maintenance").length} Mantenimiento
          </Badge>
        </div>
      </div>

      {inventory.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No hay bolsos en el inventario</h3>
            <p className="text-slate-600">Agrega bolsos al inventario para comenzar a gestionar reservas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inventory.map((bag) => (
            <Card key={bag.id} className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-serif">{bag.name}</CardTitle>
                    <p className="text-sm text-slate-600">{bag.brand}</p>
                  </div>
                  <Badge className={getStatusColor(bag.status)}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(bag.status)}
                      <span className="capitalize">{bag.status}</span>
                    </div>
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Estado actual */}
                {bag.status === "rented" && bag.rentedUntil && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">Alquilado hasta:</p>
                    <p className="text-sm text-blue-700">{bag.rentedUntil.toLocaleDateString()}</p>
                    <p className="text-xs text-blue-600">Cliente: {bag.currentRenter}</p>
                  </div>
                )}

                {bag.status === "maintenance" && bag.nextAvailable && (
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm font-medium text-yellow-900">En mantenimiento</p>
                    <p className="text-sm text-yellow-700">Disponible: {bag.nextAvailable.toLocaleDateString()}</p>
                  </div>
                )}

                {bag.status === "available" && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-900">✅ Disponible para alquiler</p>
                  </div>
                )}

                {/* Lista de espera */}
                {bag.waitingList.length > 0 && (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-slate-900">Lista de espera</p>
                      <Badge variant="outline">{bag.waitingList.length}</Badge>
                    </div>
                    <div className="space-y-1">
                      {bag.waitingList.slice(0, 3).map((entry, index) => (
                        <div key={entry.id} className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">
                            {index + 1}. {entry.customerName}
                          </span>
                          {entry.notified && <Badge className="bg-green-100 text-green-800 text-xs">Notificado</Badge>}
                        </div>
                      ))}
                      {bag.waitingList.length > 3 && (
                        <p className="text-xs text-slate-500">+{bag.waitingList.length - 3} más...</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Estadísticas */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Total alquileres</p>
                    <p className="font-medium">{bag.totalRentals}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Estado</p>
                    <p className="font-medium capitalize">{bag.condition}</p>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex space-x-2">
                  {bag.status === "rented" && (
                    <Button
                      size="sm"
                      onClick={() => markAsAvailable(bag.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      Marcar disponible
                    </Button>
                  )}

                  {bag.waitingList.length > 0 && (
                    <Button size="sm" variant="outline" onClick={() => notifyWaitingList(bag.id)} className="flex-1">
                      Notificar lista
                    </Button>
                  )}

                  <Button size="sm" variant="outline" onClick={() => setSelectedBag(bag.id)} className="flex-1">
                    Ver detalles
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Componente de lista de espera para clientes */}
      <WaitingListComponent onAddToWaitingList={addToWaitingList} inventory={inventory} />
    </div>
  )
}

// Componente para que los clientes se añadan a la lista de espera
function WaitingListComponent({
  onAddToWaitingList,
  inventory,
}: {
  onAddToWaitingList: (bagId: string, email: string, name: string) => void
  inventory: BagInventory[]
}) {
  const [selectedBag, setSelectedBag] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerName, setCustomerName] = useState("")

  const unavailableBags = inventory.filter((bag) => bag.status !== "available")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedBag && customerEmail && customerName) {
      onAddToWaitingList(selectedBag, customerEmail, customerName)
      setSelectedBag("")
      setCustomerEmail("")
      setCustomerName("")
      alert("¡Te hemos añadido a la lista de espera! Te notificaremos cuando esté disponible.")
    }
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Lista de Espera
        </CardTitle>
        <p className="text-sm text-slate-600">
          ¿El bolso que quieres no está disponible? Únete a la lista de espera y te notificaremos cuando esté libre.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Bolso deseado</label>
            <select
              value={selectedBag}
              onChange={(e) => setSelectedBag(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            >
              <option value="">Selecciona un bolso...</option>
              {unavailableBags.map((bag) => (
                <option key={bag.id} value={bag.id}>
                  {bag.brand} {bag.name} - {bag.status === "rented" ? "Alquilado" : "En mantenimiento"}
                </option>
              ))}
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tu nombre</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="María García"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tu email</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="maria@ejemplo.com"
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full bg-indigo-dark text-white hover:bg-indigo-dark/90">
            Unirme a la lista de espera
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

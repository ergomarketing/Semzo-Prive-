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

  // Simulación de datos iniciales
  useEffect(() => {
    const mockInventory: BagInventory[] = [
      {
        id: "chanel-classic-flap",
        name: "Classic Flap Medium",
        brand: "Chanel",
        status: "rented",
        currentRenter: "maria@ejemplo.com",
        rentedUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 días
        nextAvailable: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        waitingList: [
          {
            id: "w1",
            customerEmail: "ana@ejemplo.com",
            customerName: "Ana García",
            addedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            notified: false,
          },
          {
            id: "w2",
            customerEmail: "lucia@ejemplo.com",
            customerName: "Lucía Martín",
            addedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            notified: false,
          },
        ],
        totalRentals: 12,
        condition: "excellent",
        lastMaintenance: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        id: "lv-speedy-30",
        name: "Speedy 30",
        brand: "Louis Vuitton",
        status: "available",
        waitingList: [],
        totalRentals: 8,
        condition: "very-good",
        lastMaintenance: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      },
      {
        id: "dior-lady-dior",
        name: "Lady Dior Medium",
        brand: "Dior",
        status: "maintenance",
        nextAvailable: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        waitingList: [
          {
            id: "w3",
            customerEmail: "carmen@ejemplo.com",
            customerName: "Carmen López",
            addedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            notified: false,
          },
        ],
        totalRentals: 15,
        condition: "good",
        lastMaintenance: new Date(),
      },
    ]

    const mockReservations: Reservation[] = [
      {
        id: "r1",
        bagId: "chanel-classic-flap",
        customerEmail: "maria@ejemplo.com",
        customerName: "María Rodríguez",
        startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        status: "active",
        membershipType: "signature",
      },
    ]

    setInventory(mockInventory)
    setReservations(mockReservations)
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

    // Aquí enviarías el email de confirmación
    console.log(`Email enviado a ${customerEmail}: Añadido a lista de espera para ${bagId}`)
  }

  const notifyWaitingList = async (bagId: string) => {
    const bag = inventory.find((b) => b.id === bagId)
    if (!bag || bag.waitingList.length === 0) return

    // Notificar al primer cliente en la lista
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

    // Aquí enviarías el email de disponibilidad
    console.log(`Email enviado a ${firstInLine.customerEmail}: ${bag.name} ya está disponible!`)
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

    // Notificar lista de espera automáticamente
    notifyWaitingList(bagId)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif text-slate-900">Sistema de Inventario</h2>
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

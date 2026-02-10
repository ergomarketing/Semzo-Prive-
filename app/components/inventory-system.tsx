"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"
import { useToast } from "@/hooks/use-toast"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Clock,
  Users,
  AlertCircle,
  CheckCircle2,
  Package,
  Mail,
  Trash2,
  Plus,
  Edit,
  Eye,
  Upload,
  Loader2,
} from "lucide-react"

const SEMZO_INDIGO = "#1a1a4b" // Indigo oscuro - color principal
const SEMZO_PINK_PASTEL = "#f4c4cc" // Rosa pastel - acentos
const SEMZO_PINK_NUDE = "#fff0f3" // Rosa nude - fondos sutiles

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
  description?: string
  membership_type?: string
  retail_price?: string
  image_url?: string
  category?: string
  images: string[]
  nfc_uid?: string
  nfc_assigned_at?: Date
  nfc_last_scan?: Date
  nfc_scan_count?: number
  nfc_blocked?: boolean
  nfc_blocked_reason?: string
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
  const [selectedBag, setSelectedBag] = useState<BagInventory | null>(null)
  const [editingBag, setEditingBag] = useState<BagInventory | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showNfcModal, setShowNfcModal] = useState(false)
  const [nfcAction, setNfcAction] = useState<"assign" | "scan">("scan")
  const [nfcInput, setNfcInput] = useState("")
  const [nfcLoading, setNfcLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        setLoading(true)

        const token = localStorage.getItem("supabase.auth.token")
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }

        const inventoryResponse = await fetch("/api/admin/inventory", { headers })
        const inventoryData = await inventoryResponse.json()

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
            description: bag.description,
            membership_type: bag.membership_type,
            retail_price: bag.retail_price,
            image_url: bag.image_url,
            category: bag.category,
            images: bag.images || [],
            nfc_uid: bag.nfc_uid,
            nfc_assigned_at: bag.nfc_assigned_at ? new Date(bag.nfc_assigned_at) : undefined,
            nfc_last_scan: bag.nfc_last_scan ? new Date(bag.nfc_last_scan) : undefined,
            nfc_scan_count: bag.nfc_scan_count || 0,
            nfc_blocked: bag.nfc_blocked || false,
            nfc_blocked_reason: bag.nfc_blocked_reason,
          }))

          setInventory(processedInventory)
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
        }
      } catch (error) {
        console.error("Error loading data:", error)
        setInventory([])
      } finally {
        setLoading(false)
      }
    }

    fetchRealData()
  }, [])

  const getStatusColor = (status: BagInventory["status"]) => {
    switch (status) {
      case "available":
        return "bg-white text-slate-700 border border-slate-300"
      case "rented":
        return "bg-[#fff0f3] text-[#1a1a4b] border border-[#f4c4cc]" // Rosa nude con borde rosa pastel
      case "maintenance":
        return "bg-slate-50 text-slate-700 border border-slate-300"
      case "reserved":
        return "bg-slate-100 text-slate-700 border border-slate-300"
      default:
        return "bg-slate-50 text-slate-700 border border-slate-200"
    }
  }

  const getStatusText = (status: BagInventory["status"]) => {
    switch (status) {
      case "available":
        return "Disponible"
      case "rented":
        return "Alquilado"
      case "maintenance":
        return "Mantenimiento"
      case "reserved":
        return "Reservado"
      default:
        return status
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

  const getMembershipLabel = (type?: string) => {
    switch (type) {
      case "essentiel":
        return "L'Essentiel"
      case "signature":
        return "Signature"
      case "prive":
        return "Privé"
      default:
        return "Sin asignar"
    }
  }

  const getMembershipColor = (type?: string) => {
    switch (type) {
      case "essentiel":
        return "bg-slate-100 text-slate-700 border border-slate-300"
      case "signature":
        return "bg-[#1a1a4b] text-white" // Indigo oscuro SEMZO
      case "prive":
        return "bg-[#f4c4cc] text-[#1a1a4b] border border-[#f4c4cc]" // Rosa pastel SEMZO
      default:
        return "bg-slate-50 text-slate-500 border border-slate-200"
    }
  }

  const notifyWaitingList = async (bagId: string) => {
    const bag = inventory.find((b) => b.id === bagId)
    if (!bag || !bag.waitingList || bag.waitingList.length === 0) return

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
  }

  const toggleBagStatus = async (bagId: string, newStatus: "available" | "rented" | "maintenance") => {
    try {
      const response = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bagId,
          status: newStatus,
        }),
      })

      if (response.ok) {
        setInventory((prev) =>
          prev.map((bag) =>
            bag.id === bagId
              ? {
                  ...bag,
                  status: newStatus,
                  currentRenter: newStatus === "available" ? undefined : bag.currentRenter,
                  rentedUntil: newStatus === "available" ? undefined : bag.rentedUntil,
                }
              : bag,
          ),
        )

        if (newStatus === "available") {
          notifyWaitingList(bagId)
        }

        toast({
          title: "Estado actualizado",
          description: `El bolso ahora está ${newStatus === "available" ? "disponible" : newStatus === "rented" ? "alquilado" : "en mantenimiento"}.`,
        })
      }
    } catch (error) {
      console.error("Error updating bag status:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del bolso.",
        variant: "destructive",
      })
    }
  }

  const deleteBag = async (bagId: string) => {
    if (!confirm("¿Estás seguro de eliminar este bolso? Esta acción no se puede deshacer.")) return

    try {
      const response = await fetch(`/api/admin/inventory/${bagId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setInventory((prev) => prev.filter((bag) => bag.id !== bagId))
        toast({
          title: "Bolso eliminado",
          description: "El bolso ha sido eliminado del inventario.",
        })
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar el bolso.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting bag:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el bolso.",
        variant: "destructive",
      })
    }
  }

  const saveBag = async (bagData: any) => {
    try {
      const isEditing = !!editingBag?.id
      const url = isEditing ? `/api/admin/inventory/${editingBag.id}` : "/api/admin/inventory"
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bagData),
      })

      if (response.ok) {
        const result = await response.json()
        if (isEditing) {
          setInventory((prev) => prev.map((bag) => (bag.id === editingBag.id ? { ...bag, ...result.bag } : bag)))
        } else {
          setInventory((prev) => [...prev, result.bag])
        }
        setShowEditModal(false)
        setEditingBag(null)
        toast({
          title: isEditing ? "Bolso actualizado" : "Bolso agregado",
          description: isEditing
            ? "El bolso ha sido actualizado correctamente."
            : "El bolso ha sido agregado al inventario.",
        })
      } else {
        toast({
          title: "Error",
          description: "No se pudo guardar el bolso.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving bag:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el bolso.",
        variant: "destructive",
      })
    }
  }

  const handleNfcAction = async () => {
    if (!selectedBag || !nfcInput.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un UID de NFC válido",
        variant: "destructive",
      })
      return
    }

    setNfcLoading(true)

    try {
      const response = await fetch("/api/admin/bags/nfc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: nfcAction,
          bagId: selectedBag.id,
          nfcUid: nfcInput.trim(),
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: nfcAction === "assign" ? "NFC Asignado" : "NFC Verificado",
          description: result.message,
        })

        // Actualizar inventario
        setInventory((prev) => prev.map((bag) => (bag.id === selectedBag.id ? { ...bag, ...result.bag } : bag)))

        setShowNfcModal(false)
        setNfcInput("")

        // Si estamos en el modal de detalles, actualizar también
        if (result.bag) {
          setSelectedBag((prev) => (prev ? { ...prev, ...result.bag } : null))
        }
      } else {
        // Escaneo fallido - actualizar inventario para mostrar bloqueo
        if (result.blocked) {
          setInventory((prev) =>
            prev.map((bag) =>
              bag.id === selectedBag.id
                ? {
                    ...bag,
                    nfc_blocked: true,
                    nfc_blocked_reason: result.message,
                  }
                : bag,
            ),
          )
        }

        toast({
          title: "Error de Validación NFC",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error en acción NFC:", error)
      toast({
        title: "Error",
        description: "No se pudo completar la acción NFC",
        variant: "destructive",
      })
    } finally {
      setNfcLoading(false)
    }
  }

  const handleUnblockBag = async (bagId: string) => {
    try {
      const response = await fetch("/api/admin/bags/nfc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "unblock",
          bagId,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Bolso Desbloqueado",
          description: "El bolso ha sido desbloqueado correctamente",
        })

        setInventory((prev) => prev.map((bag) => (bag.id === bagId ? { ...bag, ...result.bag } : bag)))

        if (selectedBag?.id === bagId) {
          setSelectedBag((prev) => (prev ? { ...prev, ...result.bag } : null))
        }
      }
    } catch (error) {
      console.error("[v0] Error desbloqueando:", error)
      toast({
        title: "Error",
        description: "No se pudo desbloquear el bolso",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a1a4b] mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando inventario...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 bg-slate-50/50 p-6 rounded-xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-serif text-[#1a1a4b]">Sistema de Inventario</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            onClick={() => {
              setEditingBag(null)
              setShowEditModal(true)
            }}
            className="bg-[#1a1a4b] hover:bg-[#1a1a4b]/90 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Bolso
          </Button>
          <Badge className="bg-white text-slate-700 border border-slate-300 px-3 py-1">
            {inventory.filter((b) => b.status === "available").length} Disponibles
          </Badge>
          <Badge className="bg-[#fff0f3] text-[#1a1a4b] border border-[#f4c4cc] px-3 py-1">
            {inventory.filter((b) => b.status === "rented").length} Alquilados
          </Badge>
          <Badge className="bg-slate-100 text-slate-700 border border-slate-300 px-3 py-1">
            {inventory.filter((b) => b.status === "maintenance").length} Mantenimiento
          </Badge>
        </div>
      </div>

      {inventory.length === 0 ? (
        <Card className="border border-slate-200 shadow-sm bg-white">
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-[#1a1a4b]/40 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#1a1a4b] mb-2">No hay bolsos en el inventario</h3>
            <p className="text-slate-600">Agrega bolsos al inventario para comenzar a gestionar reservas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
          {inventory.map((bag) => (
            <Card key={bag.id} className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-serif text-[#1a1a4b] truncate">{bag.name}</CardTitle>
                    <p className="text-xs text-slate-500 truncate">{bag.brand}</p>
                  </div>
                  <Badge className={`${getStatusColor(bag.status)} text-xs ml-2 flex-shrink-0 flex items-center gap-1`}>
                    {getStatusIcon(bag.status)}
                    <span>{getStatusText(bag.status)}</span>
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className={`${getMembershipColor(bag.membership_type)} text-xs`}>
                    {getMembershipLabel(bag.membership_type)}
                  </Badge>
                  {bag.nfc_blocked && <Badge className="bg-[#1a1a4b] text-white text-xs">🔒 Bloqueado</Badge>}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-slate-400">Alquileres</p>
                    <p className="font-medium text-[#1a1a4b]">{bag.totalRentals}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Condición</p>
                    <p className="font-medium text-[#1a1a4b] capitalize">
                      {bag.condition === "excellent"
                        ? "Excelente"
                        : bag.condition === "very-good"
                          ? "Muy Bueno"
                          : "Bueno"}
                    </p>
                  </div>
                </div>

                {bag.waitingList && bag.waitingList.length > 0 && (
                  <div className="p-2 bg-slate-50 rounded text-xs border border-slate-200">
                    <p className="font-medium text-[#1a1a4b]">
                      <Users className="h-3 w-3 inline mr-1" />
                      {bag.waitingList.length} en espera
                    </p>
                  </div>
                )}

                <div className="flex flex-col space-y-1.5">
                  <div className="flex space-x-1.5">
                    {bag.status === "available" ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => toggleBagStatus(bag.id, "rented")}
                          className="flex-1 h-8 text-xs bg-[#f4c4cc] text-[#1a1a4b] hover:bg-[#f4c4cc]/90 border-0"
                        >
                          Marcar Alquilado
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleBagStatus(bag.id, "maintenance")}
                          className="flex-1 h-8 text-xs border-slate-300 text-slate-700 hover:bg-slate-50"
                        >
                          Manten.
                        </Button>
                      </>
                    ) : bag.status === "rented" ? (
                      <Button
                        size="sm"
                        onClick={() => toggleBagStatus(bag.id, "available")}
                        className="flex-1 h-8 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300"
                      >
                        Marcar Disponible
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => toggleBagStatus(bag.id, "available")}
                        className="flex-1 h-8 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300"
                      >
                        Marcar Disponible
                      </Button>
                    )}
                  </div>

                  <div className="flex space-x-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedBag(bag)
                        setShowDetailsModal(true)
                      }}
                      className="flex-1 h-8 text-xs border-slate-300 hover:bg-slate-50"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Ver
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingBag(bag)
                        setShowEditModal(true)
                      }}
                      className="flex-1 h-8 text-xs border-slate-300 hover:bg-slate-50"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteBag(bag.id)}
                      className="h-8 w-8 p-0 text-xs border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedBag(bag)
                      setNfcAction(bag.nfc_uid ? "scan" : "assign")
                      setShowNfcModal(true)
                    }}
                    className="w-full h-8 text-xs bg-[#1a1a4b] text-white hover:bg-[#1a1a4b]/90"
                    disabled={bag.nfc_blocked}
                  >
                    📱 {bag.nfc_uid ? "Escanear NFC" : "Asignar NFC"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de detalles */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif text-[#1a1a4b]">
              {selectedBag?.name} - {selectedBag?.brand}
            </DialogTitle>
          </DialogHeader>
          {selectedBag && (
            <div className="space-y-4">
              {selectedBag.nfc_uid && (
                <div className="p-4 bg-slate-100 border border-slate-200 rounded-lg">
                  <h3 className="font-semibold text-slate-800 mb-2">Control NFC</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <Label className="text-slate-700">UID Asignado</Label>
                      <p className="font-mono text-slate-900">{selectedBag.nfc_uid}</p>
                    </div>
                    <div>
                      <Label className="text-slate-700">Asignado el</Label>
                      <p className="text-slate-900">
                        {selectedBag.nfc_assigned_at
                          ? new Date(selectedBag.nfc_assigned_at).toLocaleDateString("es-ES")
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-slate-700">Último Escaneo</Label>
                      <p className="text-slate-900">
                        {selectedBag.nfc_last_scan
                          ? new Date(selectedBag.nfc_last_scan).toLocaleString("es-ES")
                          : "Nunca"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-slate-700">Total Escaneos</Label>
                      <p className="text-slate-900">{selectedBag.nfc_scan_count || 0}</p>
                    </div>
                  </div>
                  {selectedBag.nfc_blocked && (
                    <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded">
                      <p className="text-red-900 font-semibold">⚠️ BOLSO BLOQUEADO</p>
                      <p className="text-red-800 text-sm mt-1">{selectedBag.nfc_blocked_reason}</p>
                      <Button
                        size="sm"
                        onClick={() => handleUnblockBag(selectedBag.id)}
                        className="mt-2 bg-red-700 hover:bg-red-800 text-white"
                      >
                        Desbloquear Bolso
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-500 text-sm">Estado</Label>
                  <Badge className={`${getStatusColor(selectedBag.status)} mt-1`}>
                    {getStatusIcon(selectedBag.status)}
                    <span className="ml-1">{getStatusText(selectedBag.status)}</span>
                  </Badge>
                </div>
                <div>
                  <Label className="text-slate-500 text-sm">Membresía</Label>
                  <Badge className={`${getMembershipColor(selectedBag.membership_type)} mt-1`}>
                    {getMembershipLabel(selectedBag.membership_type)}
                  </Badge>
                </div>
                <div>
                  <Label className="text-slate-500 text-sm">Condición</Label>
                  <p className="font-medium text-[#1a1a4b] capitalize">
                    {selectedBag.condition === "excellent"
                      ? "Excelente"
                      : selectedBag.condition === "very-good"
                        ? "Muy Bueno"
                        : "Bueno"}
                  </p>
                </div>
                <div>
                  <Label className="text-slate-500 text-sm">Total Alquileres</Label>
                  <p className="font-medium text-[#1a1a4b]">{selectedBag.totalRentals}</p>
                </div>
              </div>

              {selectedBag.currentRenter && (
                <div className="p-4 bg-slate-100 rounded-lg border border-slate-200">
                  <Label className="text-[#1a1a4b] font-medium">Alquilado actualmente</Label>
                  <p className="text-sm text-slate-600 mt-1">Cliente: {selectedBag.currentRenter}</p>
                  {selectedBag.rentedUntil && (
                    <p className="text-sm text-slate-500">
                      Hasta: {new Date(selectedBag.rentedUntil).toLocaleDateString("es-ES")}
                    </p>
                  )}
                </div>
              )}

              {selectedBag.waitingList && selectedBag.waitingList.length > 0 && (
                <div>
                  <Label className="text-[#1a1a4b] mb-2 block font-medium">Lista de Espera</Label>
                  <div className="space-y-2">
                    {selectedBag.waitingList.map((entry, index) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200"
                      >
                        <div>
                          <p className="font-medium text-sm text-[#1a1a4b]">
                            {index + 1}. {entry.customerName}
                          </p>
                          <p className="text-xs text-slate-500">{entry.customerEmail}</p>
                        </div>
                        {entry.notified && <Badge className="bg-green-100 text-green-700 text-xs">Notificado</Badge>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de edición */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-[#1a1a4b]">{editingBag ? "Editar Bolso" : "Agregar Nuevo Bolso"}</DialogTitle>
          </DialogHeader>
          <BagForm
            bag={editingBag}
            onSave={saveBag}
            onCancel={() => {
              setShowEditModal(false)
              setEditingBag(null)
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showNfcModal} onOpenChange={setShowNfcModal}>
        <DialogContent className="max-w-md border-slate-200">
          <DialogHeader>
            <DialogTitle>{nfcAction === "assign" ? "Asignar Chip NFC" : "Escanear Chip NFC"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedBag && (
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <p className="text-sm text-slate-600">Bolso seleccionado:</p>
                <p className="font-semibold text-slate-900">
                  {selectedBag.name} - {selectedBag.brand}
                </p>
                {selectedBag.nfc_uid && nfcAction === "scan" && (
                  <p className="text-xs text-slate-500 mt-1 font-mono">UID registrado: {selectedBag.nfc_uid}</p>
                )}
              </div>
            )}

            <div>
              <Label>
                {nfcAction === "assign" ? "Ingresa el UID del chip NFC" : "Escanea o ingresa el UID del chip NFC"}
              </Label>
              <Input
                value={nfcInput}
                onChange={(e) => setNfcInput(e.target.value)}
                placeholder="Ej: 04:5A:B2:C3:D4:E5:F6"
                className="mt-2 font-mono"
                disabled={nfcLoading}
              />
              {nfcAction === "assign" && (
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ El UID solo se puede asignar una vez y quedará en solo lectura.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNfcModal(false)} disabled={nfcLoading}>
              Cancelar
            </Button>
            <Button onClick={handleNfcAction} disabled={nfcLoading || !nfcInput.trim()}>
              {nfcLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : nfcAction === "assign" ? (
                "Asignar NFC"
              ) : (
                "Verificar NFC"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AdminWaitlistView inventory={inventory} />
    </div>
  )
}

function BagForm({
  bag,
  onSave,
  onCancel,
}: {
  bag: BagInventory | null
  onSave: (data: any) => void
  onCancel: () => void
}) {
  const originalImageUrl = bag?.image_url || ""
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: bag?.name || "",
    brand: bag?.brand || "",
    description: bag?.description || "",
    membership_type: bag?.membership_type || "essentiel",
    retail_price: bag?.retail_price || "",
    condition: bag?.condition || "excellent",
    status: bag?.status || "available",
    image_url: bag?.image_url || "",
    images: bag?.images || ([] as string[]),
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const uploadedUrls: string[] = []

      for (const file of Array.from(files)) {
        const formDataUpload = new FormData()
        formDataUpload.append("file", file)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formDataUpload,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Error al subir imagen")
        }

        const { url } = await response.json()
        uploadedUrls.push(url)
      }

      // Si es la primera imagen, también la ponemos como image_url principal
      const newImages = [...formData.images, ...uploadedUrls]
      setFormData({
        ...formData,
        images: newImages,
        image_url: formData.image_url || uploadedUrls[0],
      })
    } catch (error) {
      console.error("Error uploading:", error)
      alert(error instanceof Error ? error.message : "Error al subir imagen")
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const dataToSave = {
      ...formData,
      image_url: formData.image_url.trim() || originalImageUrl,
    }
    onSave(dataToSave)
  }

  const removeImage = (indexToRemove: number) => {
    const newImages = formData.images.filter((_, index) => index !== indexToRemove)
    setFormData({
      ...formData,
      images: newImages,
      // Si eliminamos la imagen principal, usar la siguiente disponible
      image_url: formData.image_url === formData.images[indexToRemove] ? newImages[0] || "" : formData.image_url,
    })
  }

  const setMainImage = (url: string) => {
    setFormData({ ...formData, image_url: url })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name" className="text-[#1a1a4b]">
            Nombre del Bolso *
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="border-slate-300 focus:border-[#1a1a4b] focus:ring-[#1a1a4b]"
          />
        </div>
        <div>
          <Label htmlFor="brand" className="text-[#1a1a4b]">
            Marca *
          </Label>
          <Input
            id="brand"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            required
            className="border-slate-300 focus:border-[#1a1a4b] focus:ring-[#1a1a4b]"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description" className="text-[#1a1a4b]">
          Descripción
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="border-slate-300 focus:border-[#1a1a4b] focus:ring-[#1a1a4b]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="membership_type" className="text-[#1a1a4b]">
            Tipo de Membresía *
          </Label>
          <Select
            value={formData.membership_type}
            onValueChange={(value) => setFormData({ ...formData, membership_type: value })}
          >
            <SelectTrigger className="border-slate-300 focus:border-[#1a1a4b]">
              <SelectValue placeholder="Seleccionar membresía" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="essentiel">L'Essentiel</SelectItem>
              <SelectItem value="signature">Signature</SelectItem>
              <SelectItem value="prive">Privé</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="retail_price" className="text-[#1a1a4b]">
            Precio Retail (€)
          </Label>
          <Input
            id="retail_price"
            type="number"
            step="0.01"
            value={formData.retail_price}
            onChange={(e) => setFormData({ ...formData, retail_price: e.target.value })}
            className="border-slate-300 focus:border-[#1a1a4b] focus:ring-[#1a1a4b]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="condition" className="text-[#1a1a4b]">
            Condición
          </Label>
          <Select value={formData.condition} onValueChange={(value) => setFormData({ ...formData, condition: value })}>
            <SelectTrigger className="border-slate-300 focus:border-[#1a1a4b]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="excellent">Excelente</SelectItem>
              <SelectItem value="very-good">Muy Bueno</SelectItem>
              <SelectItem value="good">Bueno</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="status" className="text-[#1a1a4b]">
            Estado
          </Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger className="border-slate-300 focus:border-[#1a1a4b]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Disponible</SelectItem>
              <SelectItem value="rented">Alquilado</SelectItem>
              <SelectItem value="maintenance">Mantenimiento</SelectItem>
              <SelectItem value="reserved">Reservado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Imágenes del Bolso</Label>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full border-[#1a1a4b] text-[#1a1a4b] hover:bg-[#1a1a4b] hover:text-white"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Subir Imágenes
              </>
            )}
          </Button>
        </div>

        {/* Galería de imágenes */}
        {formData.images.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mt-3">
            {formData.images.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url || "/placeholder.svg"}
                  alt={`Imagen ${index + 1}`}
                  className={`h-20 w-20 object-cover rounded border-2 cursor-pointer ${
                    formData.image_url === url ? "border-[#1a1a4b]" : "border-gray-200"
                  }`}
                  onClick={() => setMainImage(url)}
                  title="Clic para establecer como principal"
                />
                {formData.image_url === url && (
                  <span className="absolute -top-1 -left-1 bg-[#1a1a4b] text-white text-xs px-1 rounded">
                    Principal
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {formData.images.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4 border border-dashed rounded">
            No hay imágenes. Sube al menos una imagen del bolso.
          </p>
        )}
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-slate-300 text-slate-600 bg-transparent"
        >
          Cancelar
        </Button>
        <Button type="submit" className="bg-[#1a1a4b] hover:bg-[#2a3c5e] text-white">
          {bag ? "Actualizar" : "Crear"} Bolso
        </Button>
      </DialogFooter>
    </form>
  )
}

function AdminWaitlistView({ inventory }: { inventory: BagInventory[] }) {
  const [waitlistEntries, setWaitlistEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchWaitlist()
  }, [])

  const fetchWaitlist = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/waitlist")
      const data = await response.json()

      if (data.waitlist) {
        setWaitlistEntries(data.waitlist)
      }
    } catch (error) {
      console.error("Error loading waitlist:", error)
    } finally {
      setLoading(false)
    }
  }

  const notifyUser = async (entryId: string, email: string, bagName: string) => {
    try {
      const response = await fetch("/api/admin/waitlist/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId, email, bagName }),
      })

      if (response.ok) {
        toast({
          title: "Notificación enviada",
          description: `Se ha enviado un email a ${email}.`,
        })
        fetchWaitlist()
      }
    } catch (error) {
      console.error("Error notifying user:", error)
      toast({
        title: "Error",
        description: "No se pudo enviar la notificación.",
        variant: "destructive",
      })
    }
  }

  const removeFromWaitlist = async (entryId: string) => {
    if (!confirm("¿Eliminar esta entrada de la lista de espera?")) return

    try {
      const response = await fetch(`/api/admin/waitlist/${entryId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Entrada eliminada",
          description: "La entrada ha sido eliminada de la lista de espera.",
        })
        fetchWaitlist()
      }
    } catch (error) {
      console.error("Error removing from waitlist:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la entrada.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <Card className="border border-slate-200 shadow-sm bg-white">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a1a4b] mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando lista de espera...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-slate-200 shadow-sm bg-white">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-[#1a1a4b]">
          <div className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Lista de Espera
          </div>
          <Badge className="bg-slate-100 text-slate-700 border border-slate-300">
            {waitlistEntries.length} personas
          </Badge>
        </CardTitle>
        <p className="text-sm text-slate-500">Usuarios que esperan ser notificados cuando un bolso esté disponible</p>
      </CardHeader>
      <CardContent>
        {waitlistEntries.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No hay personas en la lista de espera</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-[#1a1a4b]">Bolso</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[#1a1a4b]">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[#1a1a4b]">Fecha</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[#1a1a4b]">Estado</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[#1a1a4b]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {waitlistEntries.map((entry) => (
                  <tr key={entry.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-[#1a1a4b]">{entry.bags?.name || "Bolso eliminado"}</p>
                        <p className="text-sm text-slate-500">{entry.bags?.brand}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-slate-600">{entry.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-slate-500">
                        {new Date(entry.created_at).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      {entry.notified ? (
                        <Badge className="bg-green-100 text-green-700 border border-green-200">Notificado</Badge>
                      ) : (
                        <Badge className="bg-amber-50 text-amber-700 border border-amber-200">Pendiente</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end space-x-2">
                        {!entry.notified && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => notifyUser(entry.id, entry.email, entry.bags?.name || "bolso")}
                            className="text-slate-700 hover:bg-slate-100 border-slate-300"
                          >
                            <Mail className="h-4 w-4 mr-1" />
                            Notificar
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeFromWaitlist(entry.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

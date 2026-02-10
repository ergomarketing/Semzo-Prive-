"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Mail, Phone, Calendar, MapPin, Loader2, Send, RefreshCw, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Member {
  id: string
  name: string
  email: string
  phone: string
  membership: string
  joinDate: string
  status: string
  totalRentals: number
  shippingAddress?: string
  shippingCity?: string
  shippingPostalCode?: string
  shippingCountry?: string
}

interface Reservation {
  id: string
  status: string
  start_date: string
  end_date: string
  bag_name: string
  bag_brand: string
}

const colors = {
  primary: "#1a2c4e",
  accent: "#d4a5a5",
  bg: "#faf8f7",
}

export default function MembersAdminPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({ total: 0, signature: 0, prive: 0, essentiel: 0, free: 0, active: 0 })
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [memberHistory, setMemberHistory] = useState<Reservation[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [emailSubject, setEmailSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")
  const [sendingEmail, setSendingEmail] = useState(false)
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)

  useEffect(() => {
    fetchMembers()
  }, [])
  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(t)
    }
  }, [notification])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/members")
      if (!response.ok) throw new Error("Error al cargar")
      const data = await response.json()
      setMembers(data.members || [])
      setStats(data.stats || stats)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error")
    } finally {
      setLoading(false)
    }
  }

  const fetchMemberHistory = async (memberId: string) => {
    setLoadingHistory(true)
    try {
      const response = await fetch(`/api/admin/members/history?userId=${memberId}`)
      if (response.ok) {
        const data = await response.json()
        setMemberHistory(data.reservations || [])
      }
    } catch (err) {
      setMemberHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleViewHistory = async (member: Member) => {
    setSelectedMember(member)
    setShowHistoryDialog(true)
    await fetchMemberHistory(member.id)
  }

  const handleContact = (member: Member) => {
    setSelectedMember(member)
    setEmailSubject(`Contacto desde Semzo Privé - ${member.name}`)
    setEmailBody(`Hola ${member.name},\n\n`)
    setShowEmailDialog(true)
  }

  const handleSendEmail = async () => {
    if (!selectedMember) return
    setSendingEmail(true)
    try {
      const response = await fetch("/api/admin/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: selectedMember.email, subject: emailSubject, body: emailBody }),
      })
      const data = await response.json()
      if (data.success) {
        setShowEmailDialog(false)
        setEmailSubject("")
        setEmailBody("")
        setNotification({ type: "success", message: "Email enviado" })
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      setNotification({ type: "error", message: "Error al enviar" })
    } finally {
      setSendingEmail(false)
    }
  }

  const handleDeleteOrphanedUser = async (memberId: string) => {
    if (!confirm("¿Eliminar todos los registros de este usuario? Esta acción no se puede deshacer.")) {
      return
    }

    setDeletingUserId(memberId)
    try {
      const response = await fetch(`/api/admin/members?userId=${memberId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        setNotification({ type: "success", message: "Usuario eliminado correctamente" })
        await fetchMembers()
      } else {
        throw new Error(data.error || "Error al eliminar")
      }
    } catch (err) {
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Error al eliminar usuario",
      })
    } finally {
      setDeletingUserId(null)
    }
  }

  const statCards = [
    { label: "Total", value: stats.total },
    { label: "Signature", value: stats.signature },
    { label: "Privé", value: stats.prive },
    { label: "L'Essentiel", value: stats.essentiel },
    { label: "Free", value: stats.free },
    { label: "Activos", value: stats.active },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {notification && (
        <div
          className="fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 text-white"
          style={{ backgroundColor: notification.type === "success" ? colors.primary : colors.accent }}
        >
          {notification.message}
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: colors.primary }}>
            Gestión de Miembros
          </h1>
          <p style={{ color: "#888" }}>Administra todas las membresías y clientes</p>
        </div>
        <Button onClick={fetchMembers} variant="outline" style={{ borderColor: colors.primary, color: colors.primary }}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {statCards.map((s, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold" style={{ color: colors.primary }}>
                {s.value}
              </p>
              <p className="text-xs" style={{ color: "#888" }}>
                {s.label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: colors.primary }} />
          <span className="ml-2" style={{ color: "#888" }}>
            Cargando...
          </span>
        </div>
      ) : error ? (
        <Card className="p-8 text-center border-0 shadow-sm">
          <p style={{ color: colors.accent }}>{error}</p>
          <Button onClick={fetchMembers} className="mt-4" style={{ backgroundColor: colors.primary, color: "white" }}>
            Reintentar
          </Button>
        </Card>
      ) : members.length === 0 ? (
        <Card className="p-8 text-center border-0 shadow-sm">
          <Users className="h-12 w-12 mx-auto mb-4" style={{ color: colors.accent }} />
          <p style={{ color: "#888" }}>No hay miembros</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {members.map((member) => (
            <Card key={member.id} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 rounded-full" style={{ backgroundColor: colors.accent }}>
                      <Users className="h-6 w-6" style={{ color: colors.primary }} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold" style={{ color: colors.primary }}>
                        {member.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm" style={{ color: "#888" }}>
                        <span className="flex items-center">
                          <Mail className="h-4 w-4 mr-1" />
                          {member.email}
                        </span>
                        <span className="flex items-center">
                          <Phone className="h-4 w-4 mr-1" />
                          {member.phone}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Desde {new Date(member.joinDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge style={{ backgroundColor: colors.primary, color: "white" }}>
                          {member.membership?.toUpperCase() || "FREE"}
                        </Badge>
                        <Badge
                          style={{
                            backgroundColor: member.status === "active" ? colors.primary : colors.accent,
                            color: "white",
                          }}
                        >
                          {member.status === "active" ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                      {member.shippingAddress && (
                        <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: colors.bg }}>
                          <p className="text-sm font-medium flex items-center" style={{ color: colors.primary }}>
                            <MapPin className="h-4 w-4 mr-1" />
                            Dirección de envío:
                          </p>
                          <p className="text-sm" style={{ color: "#888" }}>
                            {member.shippingAddress}, {member.shippingCity} {member.shippingPostalCode},{" "}
                            {member.shippingCountry}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm" style={{ color: "#888" }}>
                      Total alquileres
                    </p>
                    <p className="text-2xl font-bold" style={{ color: colors.primary }}>
                      {member.totalRentals}
                    </p>
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewHistory(member)}
                        style={{ borderColor: colors.primary, color: colors.primary }}
                      >
                        Ver historial
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleContact(member)}
                        style={{ backgroundColor: colors.primary, color: "white" }}
                      >
                        Contactar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteOrphanedUser(member.id)}
                        disabled={deletingUserId === member.id}
                        style={{ borderColor: colors.accent, color: colors.accent }}
                      >
                        {deletingUserId === member.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: colors.primary }}>Historial de Reservas</DialogTitle>
            <DialogDescription>
              {selectedMember?.name} - {selectedMember?.email}
            </DialogDescription>
          </DialogHeader>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: colors.primary }} />
            </div>
          ) : memberHistory.length === 0 ? (
            <p className="text-center py-8" style={{ color: "#888" }}>
              No hay reservas
            </p>
          ) : (
            <div className="space-y-3">
              {memberHistory.map((res) => (
                <Card key={res.id} className="border-0" style={{ backgroundColor: colors.bg }}>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold" style={{ color: colors.primary }}>
                        {res.bag_name}
                      </h4>
                      <p className="text-sm" style={{ color: "#888" }}>
                        {res.bag_brand}
                      </p>
                      <p className="text-xs" style={{ color: "#888" }}>
                        {new Date(res.start_date).toLocaleDateString()} - {new Date(res.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      style={{
                        backgroundColor: res.status === "completed" ? colors.primary : colors.accent,
                        color: "white",
                      }}
                    >
                      {res.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ color: colors.primary }}>Enviar Email</DialogTitle>
            <DialogDescription>
              Enviar a {selectedMember?.name} ({selectedMember?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label style={{ color: colors.primary }}>Asunto</Label>
              <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
            </div>
            <div>
              <Label style={{ color: colors.primary }}>Mensaje</Label>
              <Textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={8} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEmailDialog(false)} disabled={sendingEmail}>
                Cancelar
              </Button>
              <Button
                onClick={handleSendEmail}
                disabled={sendingEmail || !emailSubject || !emailBody}
                style={{ backgroundColor: colors.primary, color: "white" }}
              >
                {sendingEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

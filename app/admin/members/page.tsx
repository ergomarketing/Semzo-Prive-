"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Mail, Phone, Calendar, MapPin, Loader2, Send } from "lucide-react"
import Navbar from "../../components/navbar"
import { createClient } from "@supabase/supabase-js"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface Member {
  id: string
  name: string
  email: string
  phone: string
  membership: string
  joinDate: string
  status: string
  currentBag: string | null
  totalRentals: number
  shippingAddress?: string
  shippingCity?: string
  shippingPostalCode?: string
  shippingCountry?: string
}

interface Reservation {
  id: string
  created_at: string
  status: string
  start_date: string
  end_date: string
  bags: {
    name: string
    brand: string
  }
}

export default function MembersAdminPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    signature: 0,
    prive: 0,
    essentiel: 0,
    free: 0,
    active: 0,
  })
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [memberHistory, setMemberHistory] = useState<Reservation[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [emailSubject, setEmailSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")
  const [sendingEmail, setSendingEmail] = useState(false)

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      console.log("[v0] Fetching members from API...")

      const response = await fetch("/api/admin/members")

      console.log("[v0] Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.log("[v0] Error response:", errorData)
        throw new Error(`Error ${response.status}: ${errorData.error || response.statusText}`)
      }

      const data = await response.json()
      console.log("[v0] Received data:", data)

      setMembers(data.members || [])
      setStats(data.stats || stats)
      setError(null)
    } catch (err) {
      console.error("[v0] Error fetching members:", err)
      setError(err instanceof Error ? err.message : "Error al cargar miembros")
    } finally {
      setLoading(false)
    }
  }

  const fetchMemberHistory = async (memberId: string) => {
    setLoadingHistory(true)
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select("id, created_at, status, start_date, end_date, bags(name, brand)")
        .eq("user_id", memberId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setMemberHistory(data || [])
    } catch (err) {
      console.error("[v0] Error fetching member history:", err)
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

    console.log("[v0] 📧 Starting email send to:", selectedMember.email)

    setSendingEmail(true)
    try {
      console.log("[v0] 📧 Sending request to API...")

      const response = await fetch("/api/admin/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: selectedMember.email,
          subject: emailSubject,
          body: emailBody,
        }),
      })

      console.log("[v0] 📧 Response status:", response.status)

      const data = await response.json()
      console.log("[v0] 📧 Response data:", data)

      if (!response.ok) {
        throw new Error(data.details || data.error || "Error al enviar el email")
      }

      console.log("[v0] ✅ Email sent successfully")
      alert("Email enviado correctamente")
      setShowEmailDialog(false)
      setEmailSubject("")
      setEmailBody("")
    } catch (err) {
      console.error("[v0] ❌ Error sending email:", err)
      alert(`Error al enviar el email: ${err instanceof Error ? err.message : "Error desconocido"}`)
    } finally {
      setSendingEmail(false)
    }
  }

  const getMembershipColor = (membership: string) => {
    switch (membership) {
      case "essentiel":
        return "bg-rose-100 text-rose-800"
      case "signature":
        return "bg-purple-100 text-purple-800"
      case "prive":
        return "bg-indigo-100 text-indigo-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente"
      case "confirmed":
        return "Confirmada"
      case "active":
        return "Activa"
      case "completed":
        return "Completada"
      case "cancelled":
        return "Cancelada"
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "waiting":
        return "bg-yellow-100 text-yellow-800"
      case "inactive":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-serif text-slate-900 mb-2">Gestión de Miembros</h1>
            <p className="text-slate-600">Administra todas las membresías y clientes</p>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-slate-600">Total</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-slate-600">Signature</p>
                <p className="text-2xl font-bold text-purple-600">{stats.signature}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-slate-600">Privé</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.prive}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-slate-600">L'Essentiel</p>
                <p className="text-2xl font-bold text-rose-600">{stats.essentiel}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-slate-600">Free</p>
                <p className="text-2xl font-bold text-gray-600">{stats.free}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-slate-600">Activos</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <span className="ml-2 text-slate-600">Cargando miembros...</span>
            </div>
          ) : error ? (
            <Card className="p-8 text-center">
              <h3 className="text-lg font-semibold text-red-600 mb-2">Error</h3>
              <p className="text-slate-600 mb-4">{error}</p>
              <Button onClick={fetchMembers}>Reintentar</Button>
            </Card>
          ) : members.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">No hay miembros</h3>
              <p className="text-slate-500">Aún no hay usuarios registrados en el sistema.</p>
            </Card>
          ) : (
            <div className="grid gap-6">
              {members.map((member) => (
                <Card key={member.id} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="p-3 bg-indigo-100 rounded-full">
                          <Users className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-900">{member.name}</h3>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-slate-600">
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-1" />
                              {member.email}
                            </div>
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-1" />
                              {member.phone}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              Desde {new Date(member.joinDate).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 mt-3">
                            <Badge className={getMembershipColor(member.membership)}>
                              {member.membership.toUpperCase()}
                            </Badge>
                            <Badge className={getStatusColor(member.status)}>
                              {member.status === "active"
                                ? "Activo"
                                : member.status === "waiting"
                                  ? "En espera"
                                  : "Inactivo"}
                            </Badge>
                          </div>

                          {member.shippingAddress && (
                            <div className="mt-3 p-3 bg-green-50 rounded-lg">
                              <p className="text-sm font-medium text-green-900 flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                Dirección de envío:
                              </p>
                              <p className="text-sm text-green-700">
                                {member.shippingAddress}, {member.shippingCity} {member.shippingPostalCode},{" "}
                                {member.shippingCountry}
                              </p>
                            </div>
                          )}

                          {member.currentBag && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                              <p className="text-sm font-medium text-blue-900">Bolso actual:</p>
                              <p className="text-sm text-blue-700">{member.currentBag}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-slate-600">Total alquileres</p>
                        <p className="text-2xl font-bold text-slate-900">{member.totalRentals}</p>
                        <div className="flex space-x-2 mt-4">
                          <Button size="sm" variant="outline" onClick={() => handleViewHistory(member)}>
                            Ver historial
                          </Button>
                          <Button size="sm" onClick={() => handleContact(member)}>
                            Contactar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-8 text-center">
            <Button onClick={fetchMembers} variant="outline">
              <Loader2 className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>
      </main>

      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Historial de Reservas</DialogTitle>
            <DialogDescription>
              {selectedMember?.name} - {selectedMember?.email}
            </DialogDescription>
          </DialogHeader>

          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              <span className="ml-2 text-slate-600">Cargando historial...</span>
            </div>
          ) : memberHistory.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-600">No hay reservas registradas para este miembro.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {memberHistory.map((reservation) => (
                <Card key={reservation.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-900">
                          {reservation.bags?.name || "Bolso no especificado"}
                        </h4>
                        <p className="text-sm text-slate-600">{reservation.bags?.brand || ""}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-slate-600">
                          <span>Desde: {new Date(reservation.start_date).toLocaleDateString()}</span>
                          <span>Hasta: {new Date(reservation.end_date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Creada: {new Date(reservation.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        className={
                          reservation.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : reservation.status === "active"
                              ? "bg-blue-100 text-blue-800"
                              : reservation.status === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {getStatusLabel(reservation.status)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enviar Email</DialogTitle>
            <DialogDescription>
              Enviar email a {selectedMember?.name} ({selectedMember?.email})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="subject">Asunto</Label>
              <Input
                id="subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Asunto del email"
              />
            </div>

            <div>
              <Label htmlFor="body">Mensaje</Label>
              <Textarea
                id="body"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Escribe tu mensaje aquí..."
                rows={10}
                className="resize-none"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEmailDialog(false)} disabled={sendingEmail}>
                Cancelar
              </Button>
              <Button onClick={handleSendEmail} disabled={sendingEmail || !emailSubject || !emailBody}>
                {sendingEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Email
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

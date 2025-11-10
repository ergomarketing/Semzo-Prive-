"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Mail, Phone, Calendar, MapPin, RefreshCw } from "lucide-react"

interface Member {
  id: string
  name: string
  email: string
  phone: string
  membership: string
  joinDate: string
  status: string
  shippingAddress: string | null
  shippingCity: string | null
  shippingPostalCode: string | null
  shippingCountry: string | null
  totalRentals: number
}

export default function AdminMembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    signature: 0,
    prive: 0,
    essentiel: 0,
    free: 0,
    active: 0,
  })

  useEffect(() => {
    loadMembers()
  }, [])

  async function loadMembers() {
    try {
      const response = await fetch("/api/admin/members")
      const data = await response.json()
      const membersList = data.members || []
      setMembers(membersList)

      const statsCalc = {
        total: membersList.length,
        signature: membersList.filter((m: Member) => m.membership?.toUpperCase() === "SIGNATURE").length,
        prive: membersList.filter((m: Member) => m.membership?.toUpperCase() === "PRIVÉ").length,
        essentiel: membersList.filter((m: Member) => m.membership?.toUpperCase() === "L'ESSENTIEL").length,
        free: membersList.filter((m: Member) => m.membership?.toLowerCase() === "free").length,
        active: membersList.filter(
          (m: Member) => m.status?.toLowerCase() === "active" || m.status?.toLowerCase() === "activo",
        ).length,
      }
      setStats(statsCalc)
    } catch (error) {
      console.error("[v0] Error loading members:", error)
    } finally {
      setLoading(false)
    }
  }

  async function sendEmail(member: Member) {
    const subject = `Contacto desde Semzo Privé - ${member.name}`
    const body = `Hola ${member.name},\n\nEste es un mensaje de contacto.`

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: member.email, subject, body }),
      })

      const result = await response.json()
      if (result.success) {
        alert("Email enviado correctamente")
      } else {
        alert("Error al enviar email: " + result.message)
      }
    } catch (error) {
      console.error("[v0] Error sending email:", error)
      alert("Error al enviar email")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Cargando miembros...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-serif mb-2">Gestión de Miembros</h1>
          <p className="text-gray-600">Administra todas las membresías y clientes</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="p-4 bg-white border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Total</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </Card>
          <Card className="p-4 bg-white border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Signature (159€)</p>
            <p className="text-3xl font-bold text-purple-600">{stats.signature}</p>
          </Card>
          <Card className="p-4 bg-white border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Privé (189€)</p>
            <p className="text-3xl font-bold text-blue-600">{stats.prive}</p>
          </Card>
          <Card className="p-4 bg-white border-gray-200">
            <p className="text-sm text-gray-600 mb-1">L'Essentiel (59€)</p>
            <p className="text-3xl font-bold text-red-600">{stats.essentiel}</p>
          </Card>
          <Card className="p-4 bg-white border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Free (Registro)</p>
            <p className="text-3xl font-bold text-gray-600">{stats.free}</p>
          </Card>
          <Card className="p-4 bg-white border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Activos</p>
            <p className="text-3xl font-bold text-green-600">{stats.active}</p>
          </Card>
        </div>

        <div className="space-y-4">
          {members.map((member) => (
            <Card key={member.id} className="p-6 bg-white border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-3">{member.name}</h3>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>{member.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{member.phone || "No disponible"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Desde {new Date(member.joinDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mb-3">
                      <Badge variant="outline" className="bg-gray-100">
                        {member.membership}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={member.status === "Activo" ? "bg-green-100 text-green-800" : "bg-gray-100"}
                      >
                        {member.status}
                      </Badge>
                    </div>

                    {member.shippingAddress && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-green-800">
                          <p className="font-medium mb-1">Dirección de envío:</p>
                          <p>
                            {member.shippingAddress}, {member.shippingCity} {member.shippingPostalCode},{" "}
                            {member.shippingCountry}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3 ml-4">
                  <div className="text-right">
                    <p className="text-sm text-blue-600 mb-1">Total alquileres</p>
                    <p className="text-3xl font-bold">{member.totalRentals || 0}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Ver historial
                    </Button>
                    <Button
                      size="sm"
                      className="bg-gray-900 hover:bg-gray-800 text-white"
                      onClick={() => sendEmail(member)}
                    >
                      Contactar
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex justify-center mt-8">
          <Button variant="outline" onClick={loadMembers} className="gap-2 bg-transparent">
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
        </div>
      </div>
    </div>
  )
}

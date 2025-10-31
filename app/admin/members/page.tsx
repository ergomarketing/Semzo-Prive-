"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Mail, Phone, Calendar, MapPin, Loader2 } from "lucide-react"
import Navbar from "../../components/navbar"
import { useAuth } from "../../hooks/useAuth"
import { createClient } from "@supabase/supabase-js"

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

export default function MembersAdminPage() {
  const { user, loading: authLoading } = useAuth()
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

  useEffect(() => {
    if (!authLoading && user) {
      fetchMembers()
    }
  }, [user, authLoading])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      console.log("[v0] Fetching members from API...")

      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setError("No hay sesión de usuario")
        return
      }

      const response = await fetch("/api/admin/members", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("[v0] Members data received:", data)

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

  const adminEmails = ["admin@semzoprive.com"] // Removed user email, keeping only admin emails

  // Verificar autorización de admin
  const isAdmin = user && adminEmails.includes(user.email || "")

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Acceso Requerido</h2>
          <p className="text-slate-600">Debes iniciar sesión para acceder al panel de administración.</p>
        </Card>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Acceso Denegado</h2>
          <p className="text-slate-600">No tienes permisos para acceder al panel de administración.</p>
        </Card>
      </div>
    )
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
                          <Button size="sm" variant="outline">
                            Ver historial
                          </Button>
                          <Button size="sm">Contactar</Button>
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
    </>
  )
}

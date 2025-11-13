"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { useAuth } from "@/app/context/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Package, Copy, Check } from "lucide-react"

export default function ReservaDetallesPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [reserva, setReserva] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    if (user && params.id) {
      fetchReserva()
    }
  }, [user, params.id])

  const fetchReserva = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          bags (
            id,
            name,
            image_url,
            brand
          )
        `)
        .eq("id", params.id)
        .eq("user_id", user.id)
        .single()

      if (error) throw error
      setReserva(data)
    } catch (error) {
      console.error("Error fetching reserva:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyId = async () => {
    if (reserva?.id) {
      try {
        await navigator.clipboard.writeText(reserva.id)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error("Error copying to clipboard:", error)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-600">Cargando detalles...</p>
      </div>
    )
  }

  if (!reserva) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-slate-600">Reserva no encontrada</p>
        <Button onClick={() => router.push("/dashboard/reservas")} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a reservas
        </Button>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendiente", className: "bg-amber-100 text-amber-700 border-amber-200" },
      confirmed: { label: "Confirmado", className: "bg-blue-100 text-blue-700 border-blue-200" },
      ready: { label: "Listo para Envío", className: "bg-green-100 text-green-700 border-green-200" },
      shipped: { label: "En Tránsito", className: "bg-purple-100 text-purple-700 border-purple-200" },
      delivered: { label: "Entregado", className: "bg-slate-100 text-slate-700 border-slate-200" },
      cancelled: { label: "Cancelado", className: "bg-red-100 text-red-700 border-red-200" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge className={config.className}>{config.label}</Badge>
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header con botón de volver */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Button
              onClick={() => router.push("/dashboard/reservas")}
              variant="ghost"
              className="mb-4 -ml-3 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Reservas
            </Button>
            <h1 className="text-4xl font-serif text-slate-900">Detalles de Reserva</h1>
            <div className="flex items-center gap-2 mt-2">
              <code className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                {reserva.id}
              </code>
              <Button
                onClick={handleCopyId}
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 mr-1 text-green-600" />
                    <span className="text-green-600">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-slate-400 mt-1">Usa este ID para consultas con soporte</p>
          </div>
          {getStatusBadge(reserva.status)}
        </div>

        <div className="grid gap-6">
          {/* Información del Bolso */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-xl font-serif text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Información del Bolso
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex gap-6">
                {reserva.bags?.image_url && (
                  <img
                    src={reserva.bags.image_url || "/placeholder.svg"}
                    alt={reserva.bags.name}
                    className="w-32 h-32 object-cover rounded-lg border border-slate-200"
                  />
                )}
                <div className="flex-1 space-y-2">
                  <h3 className="text-2xl font-serif text-slate-900">{reserva.bags?.name}</h3>
                  {reserva.bags?.brand && <p className="text-slate-600">{reserva.bags.brand}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de la Reserva */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-xl font-serif text-slate-900">Información</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <dl className="grid grid-cols-2 gap-6">
                <div className="col-span-2 pb-4 border-b border-slate-100">
                  <dt className="text-sm text-slate-500 mb-1">Fecha de Pedido</dt>
                  <dd className="text-lg font-medium text-slate-900">
                    {new Date(reserva.created_at).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-slate-500 mb-1">Estado</dt>
                  <dd className="text-slate-900 font-medium">{getStatusBadge(reserva.status)}</dd>
                </div>

                <div>
                  <dt className="text-sm text-slate-500 mb-1">ID de Reserva</dt>
                  <dd className="text-slate-900 font-mono text-xs break-all">{reserva.id}</dd>
                </div>

                {reserva.tracking_number && (
                  <div className="col-span-2">
                    <dt className="text-sm text-slate-500 mb-1">Número de Seguimiento</dt>
                    <dd className="text-slate-900 font-medium">{reserva.tracking_number}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

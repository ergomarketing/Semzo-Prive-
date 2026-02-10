"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react"

interface EmailLog {
  id: string
  created_at: string
  recipient_email: string
  subject: string
  email_type: string
  status: "pending" | "sent" | "failed"
}

export default function UserEmailsPage() {
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/user/email-logs")
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error("Error fetching logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <Mail className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      sent: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      pending: "bg-yellow-100 text-yellow-800",
    }

    return (
      <Badge className={variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"}>
        {status === "sent" ? "Enviado" : status === "failed" ? "Fallido" : "Pendiente"}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-slate-900 mb-2">Mis Notificaciones</h1>
        <p className="text-slate-600">Historial de emails y notificaciones enviadas a tu cuenta</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="h-5 w-5 mr-2" />
            Emails recibidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600">Cargando notificaciones...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600">No tienes notificaciones aún</p>
              <p className="text-sm text-slate-500 mt-2">
                Aquí aparecerán los emails importantes relacionados con tus reservas y membresía
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(log.status)}
                      <div>
                        <p className="font-medium text-slate-900">{log.subject}</p>
                        <p className="text-sm text-slate-600">{formatDate(log.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="text-xs">
                        {log.email_type}
                      </Badge>
                      {getStatusBadge(log.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <h3 className="font-medium text-blue-900 mb-2">📋 Información</h3>
          <div className="space-y-2 text-sm text-blue-700">
            <p>• Aquí verás todos los emails importantes relacionados con tu cuenta</p>
            <p>• Las notificaciones incluyen confirmaciones de reserva, recordatorios y más</p>
            <p>• Si no recibes algún email, revisa tu carpeta de spam</p>
            <p>• Para cualquier problema, contacta con nuestro servicio de atención al cliente</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mail, CheckCircle2, XCircle, Clock, RefreshCw, Send } from "lucide-react"

interface EmailLog {
  id: string
  type: string
  to: string
  subject: string
  status: "sent" | "failed" | "pending"
  timestamp: string
  details?: any
}

export default function EmailDashboardSimple() {
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    sent: 0,
    failed: 0,
    pending: 0,
    total: 0,
  })

  const fetchLogs = async () => {
    try {
      setLoading(true)

      // Simular datos de ejemplo para demostración
      const mockLogs: EmailLog[] = [
        {
          id: "1",
          type: "Bienvenida",
          to: "usuario@ejemplo.com",
          subject: "¡Bienvenida a Semzo Privé! 🎉",
          status: "sent",
          timestamp: new Date().toISOString(),
          details: { template: "welcome", provider: "resend" },
        },
        {
          id: "2",
          type: "Confirmación",
          to: "test@test.com",
          subject: "Confirmación de registro",
          status: "pending",
          timestamp: new Date(Date.now() - 60000).toISOString(),
          details: { template: "confirmation", provider: "resend" },
        },
      ]

      setLogs(mockLogs)
      setStats({
        sent: mockLogs.filter((log) => log.status === "sent").length,
        failed: mockLogs.filter((log) => log.status === "failed").length,
        pending: mockLogs.filter((log) => log.status === "pending").length,
        total: mockLogs.length,
      })
    } catch (error) {
      console.error("Error fetching logs:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-slate-900">📧 Sistema de Emails</h1>
          <p className="text-slate-600">Monitorea todos los emails enviados desde la plataforma</p>
        </div>
        <Button onClick={fetchLogs} disabled={loading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Enviados</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <Send className="h-8 w-8 text-slate-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Exitosos</p>
                <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Fallidos</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="h-5 w-5 mr-2" />
            Historial de Emails
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600">Cargando emails...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600">No hay emails registrados aún</p>
              <p className="text-sm text-slate-500 mt-2">Los emails aparecerán aquí cuando los usuarios se registren</p>
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
                        <p className="text-sm text-slate-600">Para: {log.to}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="text-xs">
                        {log.type}
                      </Badge>
                      {getStatusBadge(log.status)}
                      <span className="text-sm text-slate-500">{formatDate(log.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <h3 className="font-medium text-blue-900 mb-2">📋 Cómo funciona</h3>
          <div className="space-y-2 text-sm text-blue-700">
            <p>• Los emails se registran automáticamente cuando se envían</p>
            <p>• Puedes ver el estado en tiempo real (enviado, fallido, pendiente)</p>
            <p>
              • Para probar: regístrate como usuario en <strong>/signup</strong>
            </p>
            <p>• El email de bienvenida aparecerá aquí inmediatamente</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

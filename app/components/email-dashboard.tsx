"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, CheckCircle2, XCircle, Clock, RefreshCw, Send, AlertTriangle, Eye, Filter } from "lucide-react"

interface EmailLog {
  id: string
  type: string
  to: string
  subject: string
  status: "sent" | "failed" | "pending"
  timestamp: string
  details?: any
}

interface EmailStats {
  sent: number
  failed: number
  pending: number
}

export default function EmailDashboard() {
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [stats, setStats] = useState<EmailStats>({ sent: 0, failed: 0, pending: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "sent" | "failed" | "pending">("all")
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null)

  const loadEmailLogs = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/emails/logs")
      const data = await response.json()

      if (data.success) {
        setLogs(data.logs)
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Error cargando logs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadEmailLogs()
    // Actualizar cada 30 segundos
    const interval = setInterval(loadEmailLogs, 30000)
    return () => clearInterval(interval)
  }, [])

  const filteredLogs = logs.filter((log) => {
    if (filter === "all") return true
    return log.status === filter
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Mail className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-100 text-green-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      welcome: "Bienvenida",
      membership_confirmation: "Confirmación Membresía",
      bag_available: "Bolso Disponible",
      return_reminder: "Recordatorio Devolución",
      newsletter: "Newsletter",
      payment_confirmation: "Confirmación Pago",
    }
    return types[type] || type
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return "Ahora mismo"
    if (diffMins < 60) return `Hace ${diffMins} min`
    if (diffHours < 24) return `Hace ${diffHours}h`
    if (diffDays < 7) return `Hace ${diffDays}d`
    return date.toLocaleDateString("es-ES")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-slate-900">Dashboard de Emails</h1>
          <p className="text-slate-600">Monitorea todos los emails enviados desde la plataforma</p>
        </div>
        <Button onClick={loadEmailLogs} disabled={isLoading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Enviados</p>
                <p className="text-2xl font-bold text-slate-900">{logs.length}</p>
              </div>
              <Mail className="h-8 w-8 text-slate-600" />
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
              <CheckCircle2 className="h-8 w-8 text-green-500" />
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
              <XCircle className="h-8 w-8 text-red-500" />
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
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            {["all", "sent", "failed", "pending"].map((status) => (
              <Button
                key={status}
                variant={filter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(status as any)}
              >
                {status === "all"
                  ? "Todos"
                  : status === "sent"
                    ? "Enviados"
                    : status === "failed"
                      ? "Fallidos"
                      : "Pendientes"}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Email Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Send className="h-5 w-5 mr-2" />
            Historial de Emails ({filteredLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-dark mx-auto mb-4"></div>
              <p className="text-slate-600">Cargando emails...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No hay emails para mostrar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(log.status)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-slate-900">{log.subject}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(log.status)}`}>
                            {log.status}
                          </span>
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            {getTypeLabel(log.type)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">
                          Para: <span className="font-medium">{log.to}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-slate-500">{formatDate(log.timestamp)}</span>
                      <Button size="sm" variant="outline" onClick={() => setSelectedLog(log)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {log.status === "failed" && log.details?.error && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                        <span className="text-sm text-red-700">Error: {log.details.error}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalles */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-xl text-slate-900">Detalles del Email</h3>
              <Button variant="outline" size="sm" onClick={() => setSelectedLog(null)}>
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Asunto:</label>
                <p className="text-slate-900">{selectedLog.subject}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Destinatario:</label>
                <p className="text-slate-900">{selectedLog.to}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Tipo:</label>
                <p className="text-slate-900">{getTypeLabel(selectedLog.type)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Estado:</label>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(selectedLog.status)}
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedLog.status)}`}>
                    {selectedLog.status}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Fecha:</label>
                <p className="text-slate-900">{new Date(selectedLog.timestamp).toLocaleString("es-ES")}</p>
              </div>

              {selectedLog.details && (
                <div>
                  <label className="text-sm font-medium text-slate-700">Detalles:</label>
                  <pre className="text-sm bg-slate-100 p-3 rounded-lg overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Mail, CheckCircle2, XCircle, Clock, RefreshCw, Send, Search, Filter, Download } from "lucide-react"
import { emailLogger, type EmailLog } from "@/lib/email-logger"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function EmailLogsPage() {
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [stats, setStats] = useState({
    sent: 0,
    failed: 0,
    pending: 0,
    total: 0,
  })

  const fetchLogs = () => {
    try {
      setLoading(true)
      // Obtener logs del servicio
      const allLogs = emailLogger.getLogs()
      setLogs(allLogs)
      applyFilters(allLogs, searchTerm, filterType, filterStatus)

      // Calcular estadísticas
      setStats({
        sent: allLogs.filter((log) => log.status === "sent").length,
        failed: allLogs.filter((log) => log.status === "failed").length,
        pending: allLogs.filter((log) => log.status === "pending").length,
        total: allLogs.length,
      })
    } catch (error) {
      console.error("Error fetching logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = (logsToFilter: EmailLog[], search: string, type: string, status: string) => {
    let result = [...logsToFilter]

    // Filtrar por término de búsqueda
    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(
        (log) =>
          log.to.toLowerCase().includes(searchLower) ||
          log.subject.toLowerCase().includes(searchLower) ||
          log.type.toLowerCase().includes(searchLower),
      )
    }

    // Filtrar por tipo
    if (type !== "all") {
      result = result.filter((log) => log.type === type)
    }

    // Filtrar por estado
    if (status !== "all") {
      result = result.filter((log) => log.status === status)
    }

    setFilteredLogs(result)
  }

  useEffect(() => {
    fetchLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    applyFilters(logs, searchTerm, filterType, filterStatus)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterType, filterStatus])

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

  const getUniqueTypes = () => {
    const types = new Set<string>()
    logs.forEach((log) => types.add(log.type))
    return Array.from(types)
  }

  const clearLogs = () => {
    if (confirm("¿Estás seguro de que quieres borrar todos los logs? Esta acción no se puede deshacer.")) {
      emailLogger.clearLogs()
      fetchLogs()
    }
  }

  const exportLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2))
    const downloadAnchorNode = document.createElement("a")
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", `email-logs-${new Date().toISOString().split("T")[0]}.json`)
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-slate-900">📧 Logs de Emails</h1>
          <p className="text-slate-600">Registro completo de todos los emails enviados desde la plataforma</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportLogs} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={fetchLogs} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
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

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar por email, asunto o tipo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-40">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    {getUniqueTypes().map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-40">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="sent">Enviados</SelectItem>
                    <SelectItem value="failed">Fallidos</SelectItem>
                    <SelectItem value="pending">Pendientes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={clearLogs} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                Limpiar logs
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="h-5 w-5 mr-2" />
            Historial de Emails
            {filteredLogs.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {filteredLogs.length} {filteredLogs.length === 1 ? "resultado" : "resultados"}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600">Cargando emails...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600">No hay emails registrados que coincidan con los filtros</p>
              {logs.length > 0 && (
                <p className="text-sm text-slate-500 mt-2">Prueba con otros filtros o limpia la búsqueda</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(log.status)}
                      <div>
                        <p className="font-medium text-slate-900">{log.subject}</p>
                        <p className="text-sm text-slate-600">Para: {log.to}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0">
                      <Badge variant="outline" className="text-xs">
                        {log.type}
                      </Badge>
                      {getStatusBadge(log.status)}
                      <span className="text-sm text-slate-500">{formatDate(log.timestamp)}</span>
                    </div>
                  </div>
                  {log.details && (
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <details className="text-xs text-slate-500">
                        <summary className="cursor-pointer hover:text-slate-700">Ver detalles</summary>
                        <pre className="mt-2 p-2 bg-slate-50 rounded overflow-auto max-h-40">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Mail, CheckCircle2, XCircle, Clock, RefreshCw, Send, Search, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EmailLog {
  id: string
  created_at: string
  recipient_email: string
  recipient_name: string | null
  subject: string
  email_type: string
  status: "pending" | "sent" | "failed"
  sent_at: string | null
  error_message: string | null
  resend_id: string | null
  metadata: Record<string, any> | null
}

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

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/email-logs")
      const data = await response.json()

      if (data.error) {
        console.error("[v0] Error fetching email logs:", data.error)
        return
      }

      setLogs(data.logs || [])
      setFilteredLogs(data.logs || [])
      setStats(data.stats || { sent: 0, failed: 0, pending: 0, total: 0 })
    } catch (error) {
      console.error("[v0] Error fetching logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let result = [...logs]

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      result = result.filter(
        (log) =>
          log.recipient_email.toLowerCase().includes(searchLower) ||
          log.subject.toLowerCase().includes(searchLower) ||
          log.email_type.toLowerCase().includes(searchLower),
      )
    }

    if (filterType !== "all") {
      result = result.filter((log) => log.email_type === filterType)
    }

    if (filterStatus !== "all") {
      result = result.filter((log) => log.status === filterStatus)
    }

    setFilteredLogs(result)
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  useEffect(() => {
    applyFilters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterType, filterStatus, logs])

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
    logs.forEach((log) => types.add(log.email_type))
    return Array.from(types)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-slate-900">Logs de Emails</h1>
          <p className="text-slate-600">Registro completo de todos los emails enviados desde la plataforma</p>
        </div>
        <Button onClick={fetchLogs} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

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
              <div className="w-48">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Todos los tipos" />
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
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="sent">Enviados</SelectItem>
                    <SelectItem value="failed">Fallidos</SelectItem>
                    <SelectItem value="pending">Pendientes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600">No hay emails registrados que coincidan con los filtros</p>
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
                        <p className="text-sm text-slate-600">Para: {log.recipient_email}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0">
                      <Badge variant="outline" className="text-xs">
                        {log.email_type}
                      </Badge>
                      {getStatusBadge(log.status)}
                      <span className="text-sm text-slate-500">{formatDate(log.created_at)}</span>
                    </div>
                  </div>
                  {log.error_message && (
                    <div className="mt-2 pt-2 border-t border-red-100 bg-red-50 p-2 rounded">
                      <p className="text-xs text-red-600">Error: {log.error_message}</p>
                    </div>
                  )}
                  {log.metadata && (
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <details className="text-xs text-slate-500">
                        <summary className="cursor-pointer hover:text-slate-700">Ver detalles</summary>
                        <pre className="mt-2 p-2 bg-slate-50 rounded overflow-auto max-h-40">
                          {JSON.stringify(log.metadata, null, 2)}
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

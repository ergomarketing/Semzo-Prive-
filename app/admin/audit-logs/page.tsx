"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shield, RefreshCw } from "lucide-react"

interface AuditLog {
  id: string
  user_id: string
  action: string
  resource_type: string
  resource_id: string
  old_value: Record<string, any> | null
  new_value: Record<string, any> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filterAction, setFilterAction] = useState("all")

  useEffect(() => {
    fetchLogs()
  }, [filterAction])

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams()
      if (filterAction !== "all") params.append("action", filterAction)

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const getActionBadge = (action: string) => {
    const config: Record<string, string> = {
      membership_created: "bg-green-100 text-green-800",
      membership_cancelled: "bg-red-100 text-red-800",
      membership_updated: "bg-blue-100 text-blue-800",
      payment_completed: "bg-purple-100 text-purple-800",
      gift_card_redeemed: "bg-yellow-100 text-yellow-800",
    }
    return <Badge className={config[action] || ""}>{action.replace(/_/g, " ")}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1a2c4e" }}>
            Registro de Auditoría
          </h1>
          <p className="text-muted-foreground">Historial completo de acciones en el sistema</p>
        </div>
      </div>

      <Card className="border-0 shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las acciones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las acciones</SelectItem>
                <SelectItem value="membership_created">Membresía creada</SelectItem>
                <SelectItem value="membership_cancelled">Membresía cancelada</SelectItem>
                <SelectItem value="payment_completed">Pago completado</SelectItem>
                <SelectItem value="gift_card_redeemed">Gift card usada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow">
        <CardHeader>
          <CardTitle>Logs de Actividad ({logs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha/Hora</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Recurso</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Detalles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-sm">
                    {new Date(log.created_at).toLocaleString("es-ES")}
                  </TableCell>
                  <TableCell>{getActionBadge(log.action)}</TableCell>
                  <TableCell>
                    {log.resource_type}
                    <br />
                    <code className="text-xs text-muted-foreground">{log.resource_id?.substring(0, 8)}...</code>
                  </TableCell>
                  <TableCell className="text-sm">
                    <code>{log.user_id?.substring(0, 8)}...</code>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                    {log.ip_address && <div>IP: {log.ip_address}</div>}
                    {log.new_value && <div className="mt-1">{JSON.stringify(log.new_value).substring(0, 50)}...</div>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

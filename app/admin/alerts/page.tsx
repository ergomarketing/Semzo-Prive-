"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, AlertTriangle, Clock, DollarSign, TrendingDown } from "lucide-react"

interface Alert {
  id: string
  type: "membership_expiring" | "payment_failed" | "subscription_cancelled" | "low_inventory"
  severity: "high" | "medium" | "low"
  title: string
  description: string
  user_id?: string
  user_name?: string
  user_email?: string
  created_at: string
}

export default function AdminAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/admin/alerts")
      if (res.ok) {
        const data = await res.json()
        setAlerts(data.alerts || [])
      }
    } catch (error) {
      console.error("Error fetching alerts:", error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return ""
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "membership_expiring":
        return <Clock className="h-5 w-5" />
      case "payment_failed":
        return <DollarSign className="h-5 w-5" />
      case "subscription_cancelled":
        return <TrendingDown className="h-5 w-5" />
      default:
        return <AlertTriangle className="h-5 w-5" />
    }
  }

  const highAlerts = alerts.filter((a) => a.severity === "high").length
  const mediumAlerts = alerts.filter((a) => a.severity === "medium").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1a2c4e" }}>
            Centro de Alertas
          </h1>
          <p className="text-muted-foreground">Notificaciones importantes del sistema</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Alertas críticas</p>
                <p className="text-2xl font-bold text-red-600">{highAlerts}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Alertas medias</p>
                <p className="text-2xl font-bold text-yellow-600">{mediumAlerts}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Bell className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total alertas</p>
                <p className="text-2xl font-bold" style={{ color: "#1a2c4e" }}>
                  {alerts.length}
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#d4a5a5" }}
              >
                <Bell className="h-6 w-6" style={{ color: "#1a2c4e" }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow">
        <CardHeader>
          <CardTitle>Todas las Alertas</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No hay alertas pendientes</div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getTypeIcon(alert.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{alert.title}</h3>
                        <Badge variant="outline" className="text-xs">
                          {new Date(alert.created_at).toLocaleDateString("es-ES")}
                        </Badge>
                      </div>
                      <p className="text-sm mt-1">{alert.description}</p>
                      {alert.user_email && (
                        <p className="text-xs mt-2">
                          Cliente: {alert.user_name} ({alert.user_email})
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

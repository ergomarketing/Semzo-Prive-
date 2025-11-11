"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { X, CheckCircle2, AlertCircle, Info, Package } from "lucide-react"

interface Notification {
  id: string
  type: "success" | "error" | "info" | "warning"
  title: string
  message: string
  timestamp: Date
  read: boolean
  action?: {
    label: string
    onClick: () => void
  }
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "info",
      title: "Tu bolso está en camino",
      message: "Tu Chanel Classic Flap Bag llegará mañana entre 10:00 y 14:00",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
      read: false,
      action: {
        label: "Rastrear pedido",
        onClick: () => console.log("Tracking..."),
      },
    },
    {
      id: "2",
      type: "success",
      title: "Pago procesado exitosamente",
      message: "Tu membresía Signature ha sido renovada por otro mes",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 día atrás
      read: false,
    },
    {
      id: "3",
      type: "warning",
      title: "Recordatorio de devolución",
      message: "Tu Louis Vuitton Neverfull debe ser devuelto en 3 días",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 días atrás
      read: true,
      action: {
        label: "Programar devolución",
        onClick: () => console.log("Scheduling return..."),
      },
    },
  ])

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)))
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) return `hace ${days} día${days > 1 ? "s" : ""}`
    if (hours > 0) return `hace ${hours} hora${hours > 1 ? "s" : ""}`
    return "hace unos minutos"
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl text-slate-900">Notificaciones</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))}
        >
          Marcar todas como leídas
        </Button>
      </div>

      {notifications.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <Package className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">No hay notificaciones</h3>
            <p className="text-slate-600">Te mantendremos informada sobre tus bolsos y membresía</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`border-0 shadow-lg transition-all ${
                !notification.read ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getIcon(notification.type)}
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 mb-1">{notification.title}</h4>
                      <p className="text-slate-600 text-sm mb-2">{notification.message}</p>
                      <p className="text-xs text-slate-500">{formatTime(notification.timestamp)}</p>
                      {notification.action && (
                        <Button variant="outline" size="sm" className="mt-3" onClick={notification.action.onClick}>
                          {notification.action.label}
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!notification.read && (
                      <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                        Marcar leída
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => removeNotification(notification.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// Toast notifications para acciones en tiempo real
export function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: string }>>([])

  const addToast = (message: string, type: "success" | "error" | "info" = "info") => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 5000)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  return { toasts, addToast, removeToast }
}

export function ToastContainer({ toasts, removeToast }: { toasts: any[]; removeToast: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Card key={toast.id} className="border-0 shadow-lg min-w-[300px]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {toast.type === "success" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                {toast.type === "error" && <AlertCircle className="h-5 w-5 text-red-500" />}
                {toast.type === "info" && <Info className="h-5 w-5 text-blue-500" />}
                <span className="text-slate-900">{toast.message}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => removeToast(toast.id)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

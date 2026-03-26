"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Mail, Users, Send, Loader2, CheckCircle, XCircle, QrCode } from "lucide-react"

interface Subscriber {
  id: string
  email: string
  name: string | null
  status: string
  subscribed_at: string
}

interface InvitedLead {
  id: string
  nombre: string
  email: string
  whatsapp: string | null
  codigo_descuento: string
  created_at: string
}

const colors = {
  primary: "#1a2c4e",
  accent: "#d4a5a5",
  bg: "#faf8f7",
}

export default function NewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [invitedLeads, setInvitedLeads] = useState<InvitedLead[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showComposer, setShowComposer] = useState(false)
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)

  useEffect(() => {
    loadSubscribers()
  }, [])

  async function loadSubscribers() {
    try {
      const response = await fetch("/api/admin/newsletter")
      if (response.ok) {
        const data = await response.json()
        setSubscribers(data.subscribers || [])
        setInvitedLeads(data.invitedLeads || [])
      }
    } catch (error) {
      console.error("Error loading subscribers:", error)
    } finally {
      setLoading(false)
    }
  }

  function showNotificationMsg(type: "success" | "error", message: string) {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  async function sendNewsletter() {
    if (!subject.trim() || !content.trim()) {
      showNotificationMsg("error", "Por favor completa el asunto y el contenido")
      return
    }
    setSending(true)
    try {
      const response = await fetch("/api/admin/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, content }),
      })
      const data = await response.json()
      if (response.ok) {
        showNotificationMsg("success", `Newsletter enviado a ${data.sent} suscriptores`)
        setSubject("")
        setContent("")
        setShowComposer(false)
      } else {
        showNotificationMsg("error", data.error || "Error al enviar")
      }
    } catch (error) {
      showNotificationMsg("error", "Error al enviar el newsletter")
    } finally {
      setSending(false)
    }
  }

  const activeSubscribers = subscribers.filter((s) => s.status === "active")

  return (
    <div className="max-w-6xl mx-auto">
      {/* Notificación minimalista */}
      {notification && (
        <div
          className="fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-3"
          style={{
            backgroundColor: notification.type === "success" ? colors.primary : colors.accent,
            color: "white",
          }}
        >
          {notification.type === "success" ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
          <p>{notification.message}</p>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: colors.primary }}>
          Newsletter
        </h1>
        <p style={{ color: "#888" }}>Gestiona suscriptores y envía newsletters</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: colors.accent }}
              >
                <Users className="h-6 w-6" style={{ color: colors.primary }} />
              </div>
              <div>
                <p className="text-3xl font-bold" style={{ color: colors.primary }}>
                  {subscribers.length}
                </p>
                <p style={{ color: "#888" }}>Total Suscriptores ({activeSubscribers.length} activos)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: colors.accent }}
              >
                <Mail className="h-6 w-6" style={{ color: colors.primary }} />
              </div>
              <div className="flex-1">
                <p className="font-medium mb-2" style={{ color: colors.primary }}>
                  Envío de Newsletter
                </p>
                <Button
                  onClick={() => setShowComposer(!showComposer)}
                  className="text-white"
                  style={{ backgroundColor: showComposer ? colors.accent : colors.primary }}
                >
                  {showComposer ? "Cancelar" : "Componer"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Composer */}
      {showComposer && (
        <Card className="mb-8 border-0 shadow-sm">
          <CardHeader>
            <CardTitle style={{ color: colors.primary }}>Componer Newsletter</CardTitle>
            <CardDescription style={{ color: "#888" }}>
              Enviar a {activeSubscribers.length} suscriptores activos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.primary }}>
                Asunto
              </label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Asunto del email"
                disabled={sending}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.primary }}>
                Contenido
              </label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Contenido del newsletter"
                rows={8}
                disabled={sending}
              />
            </div>
            <Button
              onClick={sendNewsletter}
              disabled={sending}
              className="w-full text-white"
              style={{ backgroundColor: colors.primary }}
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Newsletter
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Leads de Invitacion QR */}
      <Card className="border-0 shadow-sm mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: colors.primary }}>
            <QrCode className="h-5 w-5" />
            Leads de Invitacion QR
            <span className="text-base font-normal text-gray-400">({invitedLeads.length})</span>
          </CardTitle>
          <CardDescription style={{ color: "#888" }}>
            Personas registradas desde el QR de invitacion
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: colors.accent }} />
            </div>
          ) : invitedLeads.length === 0 ? (
            <p style={{ color: "#888" }}>No hay registros todavia</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ color: colors.primary }}>
                    <th className="text-left py-2 pr-4 font-semibold">Nombre</th>
                    <th className="text-left py-2 pr-4 font-semibold">Email</th>
                    <th className="text-left py-2 pr-4 font-semibold">WhatsApp</th>
                    <th className="text-left py-2 pr-4 font-semibold">Codigo</th>
                    <th className="text-left py-2 font-semibold">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {invitedLeads.map((lead) => (
                    <tr key={lead.id} className="border-b last:border-0" style={{ backgroundColor: colors.bg }}>
                      <td className="py-3 pr-4 font-medium" style={{ color: colors.primary }}>{lead.nombre}</td>
                      <td className="py-3 pr-4 text-gray-600">{lead.email}</td>
                      <td className="py-3 pr-4 text-gray-500">{lead.whatsapp || "—"}</td>
                      <td className="py-3 pr-4">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: colors.accent + "33", color: colors.primary }}>
                          {lead.codigo_descuento}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-gray-400">
                        {new Date(lead.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscribers List */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle style={{ color: colors.primary }}>Lista de Suscriptores</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: colors.accent }} />
              <span className="ml-2" style={{ color: "#888" }}>
                Cargando...
              </span>
            </div>
          ) : subscribers.length === 0 ? (
            <p style={{ color: "#888" }}>No hay suscriptores aún</p>
          ) : (
            <div className="space-y-2">
              {subscribers.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-4 rounded-lg"
                  style={{ backgroundColor: colors.bg }}
                >
                  <div>
                    <p className="font-medium" style={{ color: colors.primary }}>
                      {sub.email}
                    </p>
                    {sub.name && (
                      <p className="text-sm" style={{ color: "#888" }}>
                        {sub.name}
                      </p>
                    )}
                    <p className="text-xs" style={{ color: "#888" }}>
                      Suscrito: {new Date(sub.subscribed_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    style={{
                      backgroundColor: sub.status === "active" ? colors.primary : colors.accent,
                      color: "white",
                    }}
                  >
                    {sub.status === "active" ? "Activo" : sub.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

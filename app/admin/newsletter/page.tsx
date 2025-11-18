"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Mail, Users, Send, Loader2 } from 'lucide-react'

interface Subscriber {
  id: string
  email: string
  name: string | null
  status: string
  subscribed_at: string
}

export default function NewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showComposer, setShowComposer] = useState(false)
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")

  useEffect(() => {
    loadSubscribers()
  }, [])

  async function loadSubscribers() {
    try {
      const response = await fetch("/api/admin/newsletter")
      if (response.ok) {
        const data = await response.json()
        setSubscribers(data.subscribers || [])
      }
    } catch (error) {
      console.error("Error loading subscribers:", error)
    } finally {
      setLoading(false)
    }
  }

  async function sendNewsletter() {
    if (!subject.trim() || !content.trim()) {
      alert("Por favor completa el asunto y el contenido del newsletter")
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
        alert(`Newsletter enviado exitosamente a ${data.sent} suscriptores`)
        setSubject("")
        setContent("")
        setShowComposer(false)
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error("Error sending newsletter:", error)
      alert("Error al enviar el newsletter")
    } finally {
      setSending(false)
    }
  }

  const activeSubscribers = subscribers.filter((s) => s.status === "active")

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Newsletter</h1>
        <p className="text-gray-600">Gestiona suscriptores y envía newsletters</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Total Suscriptores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{subscribers.length}</div>
            <p className="text-sm text-gray-600">{activeSubscribers.length} activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Envío de Newsletter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowComposer(!showComposer)} className="w-full">
              {showComposer ? "Cancelar" : "Componer Newsletter"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {showComposer && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Componer Newsletter</CardTitle>
            <CardDescription>Enviar a {activeSubscribers.length} suscriptores activos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Asunto</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Asunto del email"
                disabled={sending}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Contenido (HTML)</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Contenido HTML del newsletter"
                rows={10}
                disabled={sending}
              />
            </div>
            <Button onClick={sendNewsletter} disabled={sending} className="w-full">
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

      <Card>
        <CardHeader>
          <CardTitle>Lista de Suscriptores</CardTitle>
          <CardDescription>{subscribers.length} suscriptores totales</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Cargando suscriptores...</p>
          ) : subscribers.length === 0 ? (
            <p className="text-gray-500">No hay suscriptores aún</p>
          ) : (
            <div className="space-y-2">
              {subscribers.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{sub.email}</p>
                    {sub.name && <p className="text-sm text-gray-600">{sub.name}</p>}
                    <p className="text-xs text-gray-500">
                      Suscrito: {new Date(sub.subscribed_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={sub.status === "active" ? "default" : "secondary"}>{sub.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

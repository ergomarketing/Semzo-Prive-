"use client"

import { useState, useEffect } from "react"
import { Mail, Download, Send, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface NewsletterSubscription {
  id: string
  email: string
  subscribed_at: string
  status: string
}

export default function NewsletterPage() {
  const [newsletters, setNewsletters] = useState<NewsletterSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  
  const [showComposer, setShowComposer] = useState(false)
  const [subject, setSubject] = useState("")
  const [htmlContent, setHtmlContent] = useState("")
  const [textContent, setTextContent] = useState("")

  useEffect(() => {
    const fetchNewsletters = async () => {
      try {
        const token = localStorage.getItem("supabase.auth.token")
        const response = await fetch("/api/admin/newsletter", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        const data = await response.json()
        if (data.subscriptions) {
          setNewsletters(data.subscriptions)
        }
      } catch (error) {
        console.error("Error loading newsletters:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchNewsletters()
  }, [])

  const exportEmails = () => {
    const emails = newsletters.map((sub) => sub.email).join("\n")
    const blob = new Blob([emails], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "newsletter-subscribers.txt"
    a.click()
  }

  const sendNewsletter = async () => {
    if (!subject || !htmlContent) {
      alert("Por favor completa el asunto y el contenido HTML")
      return
    }

    if (!confirm(`¿Estás seguro de enviar este newsletter a ${newsletters.filter(s => s.status === 'active').length} suscriptores?`)) {
      return
    }

    setSending(true)
    try {
      const response = await fetch("/api/admin/newsletter/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject,
          htmlContent,
          textContent: textContent || htmlContent.replace(/<[^>]*>/g, ""),
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert(`✅ Newsletter enviado exitosamente a ${data.sent} suscriptores`)
        setSubject("")
        setHtmlContent("")
        setTextContent("")
        setShowComposer(false)
      } else {
        alert(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al enviar el newsletter")
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando suscriptores...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Newsletter</h1>
        <p className="text-slate-600">Gestiona los suscriptores de Semzo Magazine</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4" />
              Total Suscriptores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{newsletters.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-green-600" />
              Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {newsletters.filter((s) => s.status === "active").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-slate-400" />
              Inactivos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-400">
              {newsletters.filter((s) => s.status !== "active").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <Button 
          onClick={() => setShowComposer(!showComposer)}
          className="bg-pink-600 hover:bg-pink-700"
        >
          <FileText className="h-4 w-4 mr-2" />
          {showComposer ? "Ocultar compositor" : "Componer newsletter"}
        </Button>
      </div>

      {showComposer && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Componer Newsletter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="subject">Asunto del email</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ej: Nuevas colecciones disponibles en Semzo Privé"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="htmlContent">Contenido HTML</Label>
              <Textarea
                id="htmlContent"
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                placeholder="Pega aquí el HTML de tu newsletter..."
                rows={10}
                className="mt-1 font-mono text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">
                Tip: Puedes usar el template del email de bienvenida como base
              </p>
            </div>

            <div>
              <Label htmlFor="textContent">Contenido en texto plano (opcional)</Label>
              <Textarea
                id="textContent"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Versión en texto plano del email (se genera automáticamente si se deja vacío)"
                rows={5}
                className="mt-1"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={sendNewsletter}
                disabled={sending || !subject || !htmlContent}
                className="bg-green-600 hover:bg-green-700"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar a {newsletters.filter(s => s.status === 'active').length} suscriptores
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowComposer(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Suscriptores</CardTitle>
            <Button onClick={exportEmails} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar emails
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {newsletters.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Fecha de suscripción</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {newsletters.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{sub.email}</TableCell>
                    <TableCell>{new Date(sub.subscribed_at).toLocaleDateString("es-ES")}</TableCell>
                    <TableCell>
                      <Badge variant={sub.status === "active" ? "default" : "secondary"}>{sub.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No hay suscriptores aún</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

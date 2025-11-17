"use client"

import { useState, useEffect } from "react"
import { Mail, Download, Send } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface NewsletterSubscription {
  id: string
  email: string
  subscribed_at: string
  status: string
}

export default function NewsletterPage() {
  const [newsletters, setNewsletters] = useState<NewsletterSubscription[]>([])
  const [loading, setLoading] = useState(true)

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

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            ¿Cómo enviar newsletters?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-600">Para enviar newsletters a estos suscriptores, usa uno de estos servicios:</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Mailchimp</h3>
              <p className="text-sm text-slate-600 mb-3">Importa la lista de emails desde Supabase o exporta desde aquí</p>
              <Button variant="outline" size="sm" onClick={() => window.open("https://mailchimp.com", "_blank")}>
                Ir a Mailchimp
              </Button>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">SendGrid</h3>
              <p className="text-sm text-slate-600 mb-3">API para envío masivo de emails programático</p>
              <Button variant="outline" size="sm" onClick={() => window.open("https://sendgrid.com", "_blank")}>
                Ir a SendGrid
              </Button>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Brevo</h3>
              <p className="text-sm text-slate-600 mb-3">Plataforma completa de email marketing</p>
              <Button variant="outline" size="sm" onClick={() => window.open("https://brevo.com", "_blank")}>
                Ir a Brevo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

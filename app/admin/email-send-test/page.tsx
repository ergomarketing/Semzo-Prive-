"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function EmailSendTestPage() {
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("Prueba de email desde Semzo Privé")
  const [message, setMessage] = useState("Este es un mensaje de prueba.")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const sendEmail = async () => {
    if (!email) {
      setResult({ success: false, message: "Por favor, introduce un email válido" })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/emails/send-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: email,
          subject,
          message,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: `Email enviado correctamente a ${email}`,
        })
      } else {
        setResult({
          success: false,
          message: data.error || "Error al enviar el email",
        })
      }
    } catch (error) {
      console.error("Error:", error)
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Error desconocido",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Prueba de Envío de Email</h1>

      <Card>
        <CardHeader>
          <CardTitle>Enviar email con Resend</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email de destino</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@ejemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Asunto</Label>
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensaje</Label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full min-h-[100px] p-2 border rounded-md"
            />
          </div>

          <Button onClick={sendEmail} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar email"
            )}
          </Button>

          {result && (
            <div
              className={`p-4 mt-4 rounded-md ${result.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
            >
              {result.message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

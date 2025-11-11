"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EMAIL_CONFIG } from "../config/email-config"

export default function EmailTest() {
  const [to, setTo] = useState("")
  const [subject, setSubject] = useState("Prueba de Resend")
  const [message, setMessage] = useState("Este es un email de prueba desde Semzo Privé")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const sendTestEmail = async () => {
    if (!to) {
      setResult({ success: false, message: "Por favor, introduce un email válido" })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/emails/resend-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, message }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, message: `Email enviado correctamente a ${to}` })
      } else {
        setResult({ success: false, message: data.error || "Error al enviar el email" })
      }
    } catch (error) {
      console.error("Error:", error)
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Error desconocido al enviar el email",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto my-8">
      <Card>
        <CardHeader>
          <CardTitle>Prueba de Resend</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 mb-4">
              Proveedor configurado: <strong>{EMAIL_CONFIG.provider}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Email de origen: <strong>{EMAIL_CONFIG.fromEmail}</strong>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="to">Email de destino</Label>
            <Input id="to" type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="tu@email.com" />
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

          <Button onClick={sendTestEmail} disabled={loading} className="w-full">
            {loading ? "Enviando..." : "Enviar email de prueba"}
          </Button>

          {result && (
            <div
              className={`p-4 mt-4 rounded-md ${
                result.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
            >
              {result.message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

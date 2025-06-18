"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SimpleEmailTesterPage() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const sendTestEmail = async () => {
    if (!email || !name) {
      setResult("Por favor, introduce un email y nombre válidos")
      return
    }

    setLoading(true)
    setResult(null)

    try {
      // Simular envío de email
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setResult(`Email de prueba enviado a ${email}`)
    } catch (error) {
      console.error("Error:", error)
      setResult(`Error: ${error instanceof Error ? error.message : "Error desconocido"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Probador de Emails Simple</h1>

      <Card>
        <CardHeader>
          <CardTitle>Enviar email de prueba</CardTitle>
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
            <Label htmlFor="name">Nombre del destinatario</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="María García" />
          </div>

          <Button onClick={sendTestEmail} disabled={loading}>
            {loading ? "Enviando..." : "Enviar email de prueba"}
          </Button>

          {result && (
            <div className={`p-4 mt-4 rounded-md ${result.includes("Error") ? "bg-red-100" : "bg-green-100"}`}>
              {result}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

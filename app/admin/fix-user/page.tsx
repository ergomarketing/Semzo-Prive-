"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function FixUserPage() {
  const [email, setEmail] = useState("ergomaria@hotmail.com")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>("")

  const handleFixUser = async () => {
    setLoading(true)
    setResult("")

    try {
      const response = await fetch("/api/admin/fix-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult(`✅ ${data.message}`)
      } else {
        setResult(`❌ ${data.error}`)
      }
    } catch (error) {
      setResult("❌ Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Confirmar Usuario</CardTitle>
          <CardDescription>Confirma manualmente el email de un usuario existente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="email"
            placeholder="Email del usuario"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Button onClick={handleFixUser} disabled={loading || !email} className="w-full">
            {loading ? "Confirmando..." : "Confirmar Usuario"}
          </Button>

          {result && <div className="p-3 rounded-md bg-gray-50 text-sm">{result}</div>}
        </CardContent>
      </Card>
    </div>
  )
}

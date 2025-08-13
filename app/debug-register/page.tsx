"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { authService } from "@/app/lib/supabase-auth"

export default function DebugRegisterPage() {
  const [email, setEmail] = useState("test@example.com")
  const [password, setPassword] = useState("123456")
  const [firstName, setFirstName] = useState("Test")
  const [lastName, setLastName] = useState("User")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleDebugSupabase = async () => {
    try {
      const response = await fetch("/api/debug-supabase")
      const data = await response.json()
      setResult({ type: "supabase-debug", data })
    } catch (error) {
      setResult({ type: "error", data: error })
    }
  }

  const handleTestRegister = async () => {
    setLoading(true)
    setResult(null)

    try {
      console.log("🧪 === INICIANDO TEST DE REGISTRO ===")

      const registerResult = await authService.register({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
      })

      console.log("🧪 Resultado del registro:", registerResult)
      setResult({ type: "register", data: registerResult })
    } catch (error) {
      console.error("🧪 Error en test:", error)
      setResult({ type: "error", data: error })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🧪 Debug de Registro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Apellido</label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={handleDebugSupabase} variant="outline">
                🔍 Debug Supabase
              </Button>
              <Button onClick={handleTestRegister} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading ? "🔄 Registrando..." : "🧪 Test Registro"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>📋 Resultado</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function TestRegistroPage() {
  const [email, setEmail] = useState("test@example.com")
  const [password, setPassword] = useState("123456")
  const [firstName, setFirstName] = useState("Test")
  const [lastName, setLastName] = useState("User")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testSupabaseConfig = async () => {
    try {
      setResult({ type: "loading", message: "Verificando configuración de Supabase..." })

      const response = await fetch("/api/debug-supabase")
      const data = await response.json()

      setResult({
        type: response.ok ? "success" : "error",
        message: response.ok ? "✅ Supabase configurado correctamente" : "❌ Error en configuración",
        data,
      })
    } catch (error) {
      setResult({
        type: "error",
        message: "❌ Error verificando Supabase",
        data: error,
      })
    }
  }

  const testRegistro = async () => {
    setLoading(true)
    setResult({ type: "loading", message: "Probando registro..." })

    try {
      // Llamar directamente al endpoint de registro
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
          firstName: firstName,
          lastName: lastName,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          type: "success",
          message: "✅ Registro exitoso",
          data: data,
        })
      } else {
        setResult({
          type: "error",
          message: "❌ Error en registro",
          data: data,
        })
      }
    } catch (error) {
      setResult({
        type: "error",
        message: "❌ Error de conexión",
        data: error,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">🧪 Test de Registro</CardTitle>
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
              <Button onClick={testSupabaseConfig} variant="outline" className="flex-1 bg-transparent">
                🔍 Test Supabase
              </Button>
              <Button onClick={testRegistro} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                {loading ? "🔄 Registrando..." : "🧪 Test Registro"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>📋 Resultado del Test</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert
                className={
                  result.type === "success"
                    ? "border-green-200 bg-green-50"
                    : result.type === "error"
                      ? "border-red-200 bg-red-50"
                      : "border-blue-200 bg-blue-50"
                }
              >
                <AlertDescription
                  className={
                    result.type === "success"
                      ? "text-green-800"
                      : result.type === "error"
                        ? "text-red-800"
                        : "text-blue-800"
                  }
                >
                  {result.message}
                </AlertDescription>
              </Alert>

              {result.data && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Detalles:</h4>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-96">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>📝 Instrucciones</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>
              <strong>1.</strong> Primero haz clic en "🔍 Test Supabase" para verificar la configuración
            </p>
            <p>
              <strong>2.</strong> Luego haz clic en "🧪 Test Registro" para probar el registro
            </p>
            <p>
              <strong>3.</strong> Revisa los detalles en la sección "Resultado del Test"
            </p>
            <p>
              <strong>4.</strong> Verifica tu email para ver si llega algún mensaje
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

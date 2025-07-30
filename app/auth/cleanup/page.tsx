"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, XCircle, AlertCircle, Trash2, Mail, RefreshCw } from "lucide-react"

interface AnalysisResult {
  email: string
  userInAuth: boolean
  profileInDatabase: boolean
  isOrphaned: boolean
  actionTaken: "none" | "deleted_orphan" | "created_profile" | "no_action_needed"
}

export default function CleanupPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const handleCleanup = async () => {
    if (!email) {
      setError("Por favor ingresa un email")
      return
    }

    setLoading(true)
    setError("")
    setMessage("")
    setAnalysis(null)

    try {
      const response = await fetch("/api/auth/cleanup-orphaned", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error en la limpieza")
      }

      setAnalysis(data.analysis)
      setMessage(data.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!email) {
      setError("Por favor ingresa un email")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/resend-confirmation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error reenviando email")
      }

      setMessage(data.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: boolean) => {
    return status ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-red-600" />
  }

  const getActionMessage = (actionTaken: string) => {
    switch (actionTaken) {
      case "deleted_orphan":
        return {
          message: "✅ Usuario huérfano eliminado. Ahora puedes registrarte de nuevo.",
          color: "text-green-700 bg-green-50 border-green-200",
        }
      case "no_action_needed":
        return {
          message: "ℹ️ Usuario está completo. Si no puedes iniciar sesión, verifica tu contraseña.",
          color: "text-blue-700 bg-blue-50 border-blue-200",
        }
      case "created_profile":
        return {
          message: "✅ Perfil creado. Ahora puedes iniciar sesión.",
          color: "text-green-700 bg-green-50 border-green-200",
        }
      default:
        return {
          message: "❓ No se realizó ninguna acción.",
          color: "text-gray-700 bg-gray-50 border-gray-200",
        }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="font-serif text-3xl text-slate-900 mb-2">🔧 Herramientas de Limpieza</h1>
          <p className="text-slate-600">
            Herramientas para resolver problemas con usuarios huérfanos y emails de confirmación
          </p>
        </div>

        {/* Formulario Principal */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trash2 className="h-5 w-5 mr-2" />
              Análisis y Limpieza de Usuario
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email del Usuario</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCleanup} disabled={loading || !email} className="bg-red-600 hover:bg-red-700">
                {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Limpiar Usuario
              </Button>

              <Button onClick={handleResendConfirmation} disabled={loading || !email} variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Reenviar Confirmación
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mensajes */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {message && !analysis && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription className="text-green-700">{message}</AlertDescription>
          </Alert>
        )}

        {/* Resultados del Análisis */}
        {analysis && (
          <Card className="mb-6 border-0 shadow-lg">
            <CardHeader>
              <CardTitle>📊 Resultado del Análisis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Usuario en Auth:</span>
                  <div className="flex items-center">
                    {getStatusIcon(analysis.userInAuth)}
                    <span className="ml-2 text-sm">{analysis.userInAuth ? "Encontrado" : "No encontrado"}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Perfil en Database:</span>
                  <div className="flex items-center">
                    {getStatusIcon(analysis.profileInDatabase)}
                    <span className="ml-2 text-sm">{analysis.profileInDatabase ? "Existe" : "No existe"}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Usuario Huérfano:</span>
                  <div className="flex items-center">
                    {analysis.isOrphaned ? (
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    )}
                    <span className="ml-2 text-sm">{analysis.isOrphaned ? "Sí (Problemático)" : "No"}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Email:</span>
                  <span className="text-sm font-mono">{analysis.email}</span>
                </div>
              </div>

              {/* Mensaje de Acción */}
              <Alert className={`border ${getActionMessage(analysis.actionTaken).color}`}>
                <AlertDescription>{getActionMessage(analysis.actionTaken).message}</AlertDescription>
              </Alert>

              {/* Próximos Pasos */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">📋 Próximos Pasos:</h4>
                <div className="space-y-1 text-sm text-blue-700">
                  {analysis.actionTaken === "deleted_orphan" && (
                    <>
                      <p>
                        1. Ve a <strong>/signup</strong> y regístrate de nuevo
                      </p>
                      <p>2. Esta vez SÍ recibirás el email de confirmación</p>
                      <p>3. Confirma tu email haciendo clic en el enlace</p>
                      <p>4. Después podrás iniciar sesión normalmente</p>
                    </>
                  )}
                  {analysis.actionTaken === "no_action_needed" && (
                    <>
                      <p>1. Tu usuario está completo y funcional</p>
                      <p>2. Si no puedes iniciar sesión, verifica tu contraseña</p>
                      <p>3. Si olvidaste tu contraseña, usa "Olvidé mi contraseña"</p>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enlaces Útiles */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>🔗 Enlaces Útiles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/signup")}
                className="h-auto p-4 flex flex-col items-center"
              >
                <span className="text-lg mb-1">📝</span>
                <span className="font-medium">Registro</span>
                <span className="text-xs text-gray-500">Crear nueva cuenta</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => (window.location.href = "/auth/login")}
                className="h-auto p-4 flex flex-col items-center"
              >
                <span className="text-lg mb-1">🔐</span>
                <span className="font-medium">Login</span>
                <span className="text-xs text-gray-500">Iniciar sesión</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => (window.location.href = "/test-signup")}
                className="h-auto p-4 flex flex-col items-center"
              >
                <span className="text-lg mb-1">🧪</span>
                <span className="font-medium">Test Suite</span>
                <span className="text-xs text-gray-500">Probar sistema</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

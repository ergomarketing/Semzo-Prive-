"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2, XCircle, Copy, Eye, EyeOff, AlertTriangle } from "lucide-react"

export default function StripeSetupPage() {
  const [showSecrets, setShowSecrets] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)
  const [isTestingKeys, setIsTestingKeys] = useState(false)

  // Claves actuales del usuario
  const currentKeys = {
    publishable:
      "pk_live_51RP3lcKBSKEgBoTnr4wD4bc7kQjyBS2uvdpVARXyUeXRs3XePkTt1qOJA8GHobCxEjxGZrk5q5HpQpDm00qcY9lh00Y07H4mwB",
    webhook: "whsec_IEcUdP9jyx1fym8l9FQ0LmUszCgecj23",
    secret: "sk_live_...O5hU", // Truncada por seguridad
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // Aquí podrías añadir una notificación
  }

  const testCurrentConfiguration = async () => {
    setIsTestingKeys(true)
    try {
      const response = await fetch("/api/diagnostics/stripe-connection")
      const result = await response.json()
      setTestResults(result)
    } catch (error) {
      setTestResults({
        success: false,
        message: "Error al conectar con el servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      })
    }
    setIsTestingKeys(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuración de Stripe</h1>
          <p className="text-gray-600">Configura y verifica tus claves de Stripe para pagos en vivo</p>
        </div>

        {/* Estado actual */}
        <Card className="mb-6 border-2 border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center text-amber-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Estado Actual Detectado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div>
                  <p className="font-medium text-green-700">✅ Clave Pública</p>
                  <p className="text-sm text-gray-600">Funcionando - Última vez usada: Hoy</p>
                </div>
                <div className="text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div>
                  <p className="font-medium text-red-700">❌ Clave Secreta</p>
                  <p className="text-sm text-gray-600">NO funcionando - Última vez usada: 15 Mayo</p>
                </div>
                <div className="text-red-600">
                  <XCircle className="h-5 w-5" />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div>
                  <p className="font-medium text-blue-700">🎣 Webhook</p>
                  <p className="text-sm text-gray-600">Configurado pero sin actividad</p>
                </div>
                <div className="text-blue-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instrucciones paso a paso */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>📋 Pasos para Solucionar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-medium">Ir a Stripe Dashboard</h4>
                  <p className="text-sm text-gray-600">
                    Ve a{" "}
                    <a
                      href="https://dashboard.stripe.com/apikeys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      dashboard.stripe.com/apikeys
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-medium">Verificar modo LIVE</h4>
                  <p className="text-sm text-gray-600">Asegúrate de que el toggle esté en "Live" (no "Test")</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-medium">Copiar clave secreta completa</h4>
                  <p className="text-sm text-gray-600">
                    Haz clic en "Reveal" y copia la clave que empieza con "sk_live_"
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-medium">Actualizar en Vercel</h4>
                  <p className="text-sm text-gray-600">Ve a tu proyecto en Vercel → Settings → Environment Variables</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  5
                </div>
                <div>
                  <h4 className="font-medium">Redeploy</h4>
                  <p className="text-sm text-gray-600">Haz redeploy del proyecto en Vercel</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Claves actuales */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              🔑 Tus Claves Actuales
              <Button variant="outline" size="sm" onClick={() => setShowSecrets(!showSecrets)}>
                {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Clave Pública (Publishable Key)</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    value={showSecrets ? currentKeys.publishable : currentKeys.publishable.substring(0, 20) + "..."}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(currentKeys.publishable)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-green-600 mt-1">✅ Esta clave está funcionando</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Clave Secreta (Secret Key)</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    value="sk_live_...O5hU (NECESITAS LA CLAVE COMPLETA)"
                    readOnly
                    className="font-mono text-sm text-red-600"
                  />
                </div>
                <p className="text-xs text-red-600 mt-1">❌ Esta clave NO está funcionando - necesitas la completa</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Webhook Secret</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    value={showSecrets ? currentKeys.webhook : currentKeys.webhook.substring(0, 15) + "..."}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(currentKeys.webhook)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-blue-600 mt-1">ℹ️ Esta clave está configurada</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Variables de entorno para Vercel */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>⚙️ Variables de Entorno para Vercel</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">Copia estas variables exactamente como están en Vercel:</p>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span>STRIPE_SECRET_KEY=sk_live_[TU_CLAVE_COMPLETA_AQUI]</span>
                <Button variant="ghost" size="sm" className="text-green-400 hover:text-green-300">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY={currentKeys.publishable}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-green-400 hover:text-green-300"
                  onClick={() => copyToClipboard(`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${currentKeys.publishable}`)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span>STRIPE_WEBHOOK_SECRET={currentKeys.webhook}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-green-400 hover:text-green-300"
                  onClick={() => copyToClipboard(`STRIPE_WEBHOOK_SECRET=${currentKeys.webhook}`)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test de configuración */}
        <Card>
          <CardHeader>
            <CardTitle>🧪 Probar Configuración Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={testCurrentConfiguration} disabled={isTestingKeys} className="mb-4">
              {isTestingKeys ? "Probando..." : "Probar Conexión con Stripe"}
            </Button>

            {testResults && (
              <div
                className={`p-4 rounded-lg border-2 ${
                  testResults.success
                    ? "border-green-200 bg-green-50 text-green-800"
                    : "border-red-200 bg-red-50 text-red-800"
                }`}
              >
                <div className="flex items-center mb-2">
                  {testResults.success ? (
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                  ) : (
                    <XCircle className="h-5 w-5 mr-2" />
                  )}
                  <span className="font-medium">{testResults.message}</span>
                </div>
                {testResults.details && (
                  <p className="text-sm font-mono bg-white/50 p-2 rounded">{testResults.details}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

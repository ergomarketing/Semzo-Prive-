"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CheckCircle2, XCircle, AlertTriangle, Copy, ExternalLink } from "lucide-react"

export default function StripePublicKeyFixPage() {
  const [currentPublicKey, setCurrentPublicKey] = useState(
    "pk_live_51RP3lcKBSKEgBoTnr4wD4bc7kQjyBS2uvdpVARXyUeXRs3XePkTt1qOJA8GHobCxEjxGZrk5q5HpQpDm00qcY9lh00Y07H4mwB",
  )
  const [newPublicKey, setNewPublicKey] = useState("")
  const [testResult, setTestResult] = useState<any>(null)
  const [isTestingKey, setIsTestingKey] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const testPublicKey = async (keyToTest: string) => {
    setIsTestingKey(true)
    try {
      // Simular test de clave pública
      const response = await fetch("/api/diagnostics/test-public-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKey: keyToTest }),
      })
      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({
        success: false,
        message: "Error al probar la clave",
        details: error instanceof Error ? error.message : "Error desconocido",
      })
    }
    setIsTestingKey(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🔑 Arreglar Clave Pública de Stripe</h1>
          <p className="text-gray-600">Solucionemos el error "Invalid API Key provided"</p>
        </div>

        {/* Error detectado */}
        <Card className="mb-6 border-2 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-800">
              <XCircle className="h-5 w-5 mr-2" />
              Error Detectado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="bg-white p-4 rounded-lg border">
                <p className="font-mono text-sm text-red-600 mb-2">Invalid API Key provided: pk_live_***4mwB</p>
                <p className="text-sm text-gray-700">
                  Esto significa que tu <strong>clave pública</strong> no es válida o no coincide con tu cuenta de
                  Stripe.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center p-3 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-green-700 text-sm">Clave secreta: ✅ Funcionando</span>
                </div>
                <div className="flex items-center p-3 bg-red-100 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="text-red-700 text-sm">Clave pública: ❌ Error</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clave actual */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>🔍 Tu Clave Pública Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-gray-600 mb-2">Clave configurada actualmente:</p>
                <div className="flex items-center space-x-2">
                  <Input value={currentPublicKey} readOnly className="font-mono text-xs" />
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(currentPublicKey)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-red-600 mt-2">❌ Esta clave está causando el error</p>
              </div>

              <Button
                onClick={() => testPublicKey(currentPublicKey)}
                disabled={isTestingKey}
                variant="outline"
                className="w-full"
              >
                {isTestingKey ? "Probando..." : "Probar esta clave"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Solución paso a paso */}
        <Card className="mb-6 border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Solución: Obtener la Clave Pública Correcta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium mb-3">Pasos en Stripe Dashboard:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>
                    Ve a{" "}
                    <a
                      href="https://dashboard.stripe.com/apikeys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      dashboard.stripe.com/apikeys
                    </a>
                  </li>
                  <li>
                    Asegúrate de estar en modo <strong>"Live"</strong> (no "Test")
                  </li>
                  <li>
                    Busca la sección <strong>"Publishable key"</strong>
                  </li>
                  <li>Copia la clave que empieza con "pk_live_"</li>
                  <li>Pégala en el campo de abajo</li>
                </ol>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => window.open("https://dashboard.stripe.com/apikeys", "_blank")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir Stripe Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Campo para nueva clave */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>🔑 Pegar Nueva Clave Pública</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-gray-600 mb-3">Pega aquí la nueva clave pública de Stripe:</p>
                <Input
                  placeholder="pk_live_51RP3lcKBSKEgBoTn... (debe empezar con pk_live_)"
                  value={newPublicKey}
                  onChange={(e) => setNewPublicKey(e.target.value)}
                  className="font-mono text-sm"
                />

                {newPublicKey && newPublicKey.startsWith("pk_live_") && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 text-sm">✅ Formato de clave válido</p>
                  </div>
                )}

                {newPublicKey && !newPublicKey.startsWith("pk_live_") && newPublicKey.length > 10 && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">❌ La clave debe empezar con "pk_live_"</p>
                  </div>
                )}
              </div>

              {newPublicKey && newPublicKey.startsWith("pk_live_") && (
                <div className="space-y-3">
                  <Button
                    onClick={() => testPublicKey(newPublicKey)}
                    disabled={isTestingKey}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isTestingKey ? "Probando nueva clave..." : "Probar nueva clave"}
                  </Button>

                  {testResult && (
                    <div
                      className={`p-4 rounded-lg border-2 ${
                        testResult.success
                          ? "border-green-200 bg-green-50 text-green-800"
                          : "border-red-200 bg-red-50 text-red-800"
                      }`}
                    >
                      <div className="flex items-center mb-2">
                        {testResult.success ? (
                          <CheckCircle2 className="h-5 w-5 mr-2" />
                        ) : (
                          <XCircle className="h-5 w-5 mr-2" />
                        )}
                        <span className="font-medium">{testResult.message}</span>
                      </div>
                      {testResult.details && (
                        <p className="text-sm font-mono bg-white/50 p-2 rounded">{testResult.details}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actualizar en Vercel */}
        {newPublicKey && newPublicKey.startsWith("pk_live_") && testResult?.success && (
          <Card className="mb-6 border-2 border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center text-purple-800">
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Actualizar en Vercel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-medium mb-3">Ahora actualiza en Vercel:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Ve a tu proyecto en Vercel</li>
                    <li>Settings → Environment Variables</li>
                    <li>
                      Busca <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>
                    </li>
                    <li>Edit → Pega la nueva clave → Save</li>
                    <li>Redeploy obligatorio</li>
                  </ol>
                </div>

                <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm">
                  <div className="flex items-center justify-between">
                    <span>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY={newPublicKey}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-green-400 hover:text-green-300"
                      onClick={() => copyToClipboard(`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${newPublicKey}`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => window.open("https://vercel.com/dashboard", "_blank")}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir Vercel
                  </Button>
                  <Button variant="outline" onClick={() => window.open("/admin/vercel-guide", "_blank")}>
                    Ver guía de Vercel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Verificación final */}
        <Card className="border-2 border-gray-200">
          <CardHeader>
            <CardTitle>🎯 Verificación Final</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-700">Después de actualizar en Vercel y hacer redeploy:</p>
              <div className="flex items-center space-x-2">
                <Button onClick={() => window.open("/admin/stripe-diagnostics", "_blank")} variant="outline">
                  Ejecutar diagnósticos completos
                </Button>
                <Button onClick={() => window.open("/checkout", "_blank")} className="bg-green-600 hover:bg-green-700">
                  Probar pago real
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

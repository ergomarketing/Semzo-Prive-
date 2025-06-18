"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, Eye, EyeOff } from "lucide-react"

interface DiagnosticResult {
  test: string
  status: "success" | "error" | "warning"
  message: string
  details?: string
}

export default function StripeDiagnosticsPage() {
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [showSecrets, setShowSecrets] = useState(false)

  const runDiagnostics = async () => {
    setIsRunning(true)
    setResults([])

    const tests: DiagnosticResult[] = []

    try {
      // Test 1: Verificar variables de entorno
      const envResponse = await fetch("/api/diagnostics/env-check")
      const envData = await envResponse.json()

      tests.push({
        test: "Variables de entorno",
        status: envData.success ? "success" : "error",
        message: envData.message,
        details: envData.details,
      })

      // Test 2: Conectividad con Stripe API
      const stripeResponse = await fetch("/api/diagnostics/stripe-connection")
      const stripeData = await stripeResponse.json()

      tests.push({
        test: "Conexión con Stripe API",
        status: stripeData.success ? "success" : "error",
        message: stripeData.message,
        details: stripeData.details,
      })

      // Test 3: Webhook endpoint
      const webhookResponse = await fetch("/api/diagnostics/webhook-test")
      const webhookData = await webhookResponse.json()

      tests.push({
        test: "Webhook endpoint",
        status: webhookData.success ? "success" : "error",
        message: webhookData.message,
        details: webhookData.details,
      })

      // Test 4: Payment intent creation
      const paymentResponse = await fetch("/api/diagnostics/payment-test")
      const paymentData = await paymentResponse.json()

      tests.push({
        test: "Creación de Payment Intent",
        status: paymentData.success ? "success" : "error",
        message: paymentData.message,
        details: paymentData.details,
      })
    } catch (error) {
      tests.push({
        test: "Diagnóstico general",
        status: "error",
        message: "Error al ejecutar diagnósticos",
        details: error instanceof Error ? error.message : "Error desconocido",
      })
    }

    setResults(tests)
    setIsRunning(false)
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  const getStatusIcon = (status: DiagnosticResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status: DiagnosticResult["status"]) => {
    switch (status) {
      case "success":
        return "border-green-200 bg-green-50"
      case "error":
        return "border-red-200 bg-red-50"
      case "warning":
        return "border-yellow-200 bg-yellow-50"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Diagnóstico de Stripe</h1>
          <p className="text-gray-600">Verificación completa de la integración con Stripe</p>
        </div>

        <div className="mb-6 flex gap-4">
          <Button onClick={runDiagnostics} disabled={isRunning} className="bg-indigo-600 hover:bg-indigo-700">
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Ejecutando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Ejecutar diagnósticos
              </>
            )}
          </Button>

          <Button variant="outline" onClick={() => setShowSecrets(!showSecrets)}>
            {showSecrets ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Ocultar detalles
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Mostrar detalles
              </>
            )}
          </Button>
        </div>

        <div className="space-y-4">
          {results.map((result, index) => (
            <Card key={index} className={`border-2 ${getStatusColor(result.status)}`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  {getStatusIcon(result.status)}
                  <span className="ml-3">{result.test}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-2">{result.message}</p>
                {result.details && showSecrets && (
                  <div className="mt-3 p-3 bg-gray-100 rounded-lg">
                    <p className="text-sm font-mono text-gray-600">{result.details}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {results.length === 0 && !isRunning && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">Haz clic en "Ejecutar diagnósticos" para comenzar</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

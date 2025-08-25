"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, AlertTriangle, Copy, ExternalLink } from "lucide-react"

export default function DemoModePage() {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Modo Demostración</h1>
          <p className="text-gray-600">Guía para usar el modo de demostración de pagos</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                Modo Demostración Activado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                El sistema está funcionando en <strong>modo demostración</strong> porque no se ha detectado una clave
                válida de Stripe. En este modo:
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li>No se realizan cargos reales a tarjetas</li>
                <li>Se simula el proceso de pago</li>
                <li>Puedes probar la experiencia del usuario</li>
                <li>Los datos no se envían a Stripe</li>
              </ul>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-800 text-sm">
                  Para usar pagos reales, configura las variables de entorno de Stripe en Vercel.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tarjetas de Prueba</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Usa estas tarjetas para probar diferentes escenarios:</p>

              <div className="space-y-4">
                <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                      <h3 className="font-medium">Pago Exitoso</h3>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => copyToClipboard("4242424242424242")}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      {copied ? "¡Copiado!" : "Copiar"}
                    </Button>
                  </div>
                  <p className="text-green-700">
                    <span className="font-mono">4242 4242 4242 4242</span>
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    Cualquier fecha futura, cualquier CVC, cualquier código postal
                  </p>
                </div>

                <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                      <h3 className="font-medium">Fondos Insuficientes</h3>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => copyToClipboard("4000000000000002")}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      {copied ? "¡Copiado!" : "Copiar"}
                    </Button>
                  </div>
                  <p className="text-red-700">
                    <span className="font-mono">4000 0000 0000 0002</span>
                  </p>
                  <p className="text-sm text-red-600 mt-1">Simula un error de "fondos insuficientes"</p>
                </div>
              </div>

              <div className="mt-6">
                <a
                  href="https://stripe.com/docs/testing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-indigo-600 hover:text-indigo-800"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Ver más tarjetas de prueba en la documentación de Stripe
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurar Pagos Reales</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Para activar pagos reales, necesitas configurar:</p>

              <ol className="list-decimal pl-5 space-y-3 mb-4">
                <li>
                  <strong>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</strong>: Clave pública de Stripe (empieza con pk_live_)
                </li>
                <li>
                  <strong>STRIPE_SECRET_KEY</strong>: Clave secreta de Stripe (empieza con sk_live_)
                </li>
                <li>
                  <strong>STRIPE_WEBHOOK_SECRET</strong>: Secreto del webhook (empieza con whsec_)
                </li>
              </ol>

              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                onClick={() => (window.location.href = "/admin/stripe-setup")}
              >
                Ver guía de configuración
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

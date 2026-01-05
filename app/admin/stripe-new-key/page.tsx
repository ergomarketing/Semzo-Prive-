"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CheckCircle2, Copy, AlertTriangle, ArrowRight } from "lucide-react"

export default function StripeNewKeyPage() {
  const [newSecretKey, setNewSecretKey] = useState("")
  const [step, setStep] = useState(1)
  const [copied, setCopied] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const steps = [
    {
      number: 1,
      title: "Crear Nueva Clave Secreta en Stripe",
      description: "Sigue estos pasos en dashboard.stripe.com",
      action: "En progreso...",
    },
    {
      number: 2,
      title: "Copiar la Nueva Clave",
      description: "Guarda la clave secreta que Stripe te muestre",
      action: "Pendiente",
    },
    {
      number: 3,
      title: "Actualizar en Vercel",
      description: "Configura la nueva clave en las variables de entorno",
      action: "Pendiente",
    },
    {
      number: 4,
      title: "Redeploy y Probar",
      description: "Despliega los cambios y verifica que funcione",
      action: "Pendiente",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">✅ Crear Nueva Clave Secreta</h1>
          <p className="text-gray-600">Es completamente seguro y normal crear una nueva clave secreta</p>
        </div>

        {/* Confirmación de que es correcto */}
        <Card className="mb-6 border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center text-green-800">
              <CheckCircle2 className="h-5 w-5 mr-2" />
              ¡SÍ, es lo correcto!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-green-700">
              <p>✅ Crear una nueva clave secreta es la solución correcta</p>
              <p>✅ No afectará a tu configuración actual</p>
              <p>✅ La clave anterior dejará de funcionar (que es lo que queremos)</p>
              <p>✅ Es una práctica común y segura</p>
            </div>
          </CardContent>
        </Card>

        {/* Pasos detallados */}
        <div className="space-y-6">
          {/* Paso 1: Crear en Stripe */}
          <Card className={`border-2 ${step >= 1 ? "border-blue-200 bg-blue-50" : "border-gray-200"}`}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                  1
                </div>
                Crear Nueva Clave en Stripe Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-medium mb-2">En dashboard.stripe.com/apikeys:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Busca la sección "Secret key"</li>
                    <li>
                      Haz clic en <strong>"Create secret key"</strong>
                    </li>
                    <li>
                      Dale un nombre: <code className="bg-gray-100 px-2 py-1 rounded">"Semzo Privé Production"</code>
                    </li>
                    <li>
                      Selecciona permisos: <strong>"Full access"</strong>
                    </li>
                    <li>
                      Haz clic en <strong>"Create"</strong>
                    </li>
                  </ol>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => window.open("https://dashboard.stripe.com/apikeys", "_blank")}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Abrir Stripe Dashboard
                  </Button>
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Ya creé la clave <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Paso 2: Copiar clave */}
          {step >= 2 && (
            <Card className="border-2 border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                    2
                  </div>
                  Copiar la Nueva Clave Secreta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <p className="text-sm text-gray-600 mb-3">
                      Stripe te mostrará la nueva clave secreta <strong>UNA SOLA VEZ</strong>. Cópiala aquí:
                    </p>
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder="sk_live_51RP3lcKBSKEgBoTn... (pega aquí la clave completa)"
                        value={newSecretKey}
                        onChange={(e) => setNewSecretKey(e.target.value)}
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(newSecretKey)}
                        disabled={!newSecretKey}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    {newSecretKey && newSecretKey.startsWith("sk_live_") && (
                      <p className="text-green-600 text-sm mt-2">✅ Clave válida detectada</p>
                    )}
                  </div>

                  {newSecretKey && newSecretKey.startsWith("sk_live_") && (
                    <Button onClick={() => setStep(3)} className="bg-green-600 hover:bg-green-700">
                      Continuar al siguiente paso <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Paso 3: Actualizar en Vercel */}
          {step >= 3 && newSecretKey && (
            <Card className="border-2 border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                    3
                  </div>
                  Actualizar en Vercel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-medium mb-2">Ve a tu proyecto en Vercel:</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm mb-4">
                      <li>Ve a Settings → Environment Variables</li>
                      <li>
                        Busca <code>STRIPE_SECRET_KEY</code>
                      </li>
                      <li>Haz clic en "Edit"</li>
                      <li>Pega la nueva clave</li>
                      <li>Haz clic en "Save"</li>
                    </ol>

                    <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm">
                      <div className="flex items-center justify-between">
                        <span>STRIPE_SECRET_KEY={newSecretKey}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-400 hover:text-green-300"
                          onClick={() => copyToClipboard(`STRIPE_SECRET_KEY=${newSecretKey}`)}
                        >
                          {copied ? "¡Copiado!" : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => window.open("https://vercel.com", "_blank")}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Abrir Vercel
                    </Button>
                    <Button variant="outline" onClick={() => setStep(4)}>
                      Ya actualicé en Vercel <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Paso 4: Redeploy */}
          {step >= 4 && (
            <Card className="border-2 border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                    4
                  </div>
                  Redeploy y Probar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-medium mb-2">Pasos finales:</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>En Vercel, ve a "Deployments"</li>
                      <li>Haz clic en "Redeploy" en el último deployment</li>
                      <li>Espera a que termine el deployment</li>
                      <li>Prueba un pago en tu sitio</li>
                    </ol>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => window.open("/admin/stripe-diagnostics", "_blank")}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      Probar Configuración
                    </Button>
                    <Button variant="outline" onClick={() => window.open("/checkout", "_blank")}>
                      Probar Pago Real
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Advertencia importante */}
        <Card className="mt-8 border-2 border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center text-amber-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              ⚠️ Importante
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-amber-700">
              <p>• La nueva clave reemplazará completamente a la anterior</p>
              <p>• La clave anterior (sk_live_...O5hU) dejará de funcionar</p>
              <p>• Esto es exactamente lo que queremos para solucionar el problema</p>
              <p>• Guarda la nueva clave en un lugar seguro</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

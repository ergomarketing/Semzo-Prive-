"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Copy, ExternalLink, Monitor } from "lucide-react"

export default function VercelGuidePage() {
  const [projectName, setProjectName] = useState("semzo-prive")
  const [newSecretKey, setNewSecretKey] = useState("")

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🔧 Cómo Actualizar en Vercel</h1>
          <p className="text-gray-600">Guía visual paso a paso para actualizar las variables de entorno</p>
        </div>

        {/* Paso 1: Ir a Vercel */}
        <Card className="mb-6 border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                1
              </div>
              Ir a tu Proyecto en Vercel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium mb-3">Opciones para llegar:</h4>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Opción 1: Enlace directo</p>
                      <p className="text-sm text-gray-600">Si conoces el nombre de tu proyecto</p>
                    </div>
                    <Button
                      onClick={() =>
                        window.open(`https://vercel.com/${projectName}/settings/environment-variables`, "_blank")
                      }
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Abrir Directo
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Opción 2: Dashboard principal</p>
                      <p className="text-sm text-gray-600">Navegar desde el dashboard</p>
                    </div>
                    <Button variant="outline" onClick={() => window.open("https://vercel.com/dashboard", "_blank")}>
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Dashboard
                    </Button>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>¿No sabes el nombre exacto de tu proyecto?</strong> Usa la Opción 2 y busca tu proyecto en
                    la lista.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paso 2: Navegar a Settings */}
        <Card className="mb-6 border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                2
              </div>
              Ir a Settings → Environment Variables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium mb-3">Una vez en tu proyecto:</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      1
                    </div>
                    <span>
                      Busca la pestaña <strong>"Settings"</strong> en la parte superior
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      2
                    </div>
                    <span>
                      En el menú lateral, haz clic en <strong>"Environment Variables"</strong>
                    </span>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Ruta visual:</strong>
                  </p>
                  <p className="text-sm font-mono">Tu Proyecto → Settings → Environment Variables</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paso 3: Encontrar STRIPE_SECRET_KEY */}
        <Card className="mb-6 border-2 border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                3
              </div>
              Buscar STRIPE_SECRET_KEY
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium mb-3">En la página de Environment Variables:</h4>

                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">
                      <strong>Si YA EXISTE</strong> STRIPE_SECRET_KEY:
                    </p>
                    <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                      <li>Busca la fila que dice "STRIPE_SECRET_KEY"</li>
                      <li>
                        Haz clic en los <strong>3 puntos (...)</strong> al final de esa fila
                      </li>
                      <li>
                        Selecciona <strong>"Edit"</strong>
                      </li>
                    </ul>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">
                      <strong>Si NO EXISTE</strong> STRIPE_SECRET_KEY:
                    </p>
                    <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                      <li>
                        Haz clic en el botón <strong>"Add New"</strong>
                      </li>
                      <li>
                        En "Name" escribe: <code>STRIPE_SECRET_KEY</code>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paso 4: Pegar la nueva clave */}
        <Card className="mb-6 border-2 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                4
              </div>
              Pegar la Nueva Clave Secreta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium mb-3">Pega tu nueva clave aquí para verificar:</h4>
                <Input
                  placeholder="sk_live_51RP3lcKBSKEgBoTn... (pega la clave completa de Stripe)"
                  value={newSecretKey}
                  onChange={(e) => setNewSecretKey(e.target.value)}
                  className="font-mono text-sm"
                />

                {newSecretKey && newSecretKey.startsWith("sk_live_") && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 text-sm">✅ Clave válida - Cópiala y pégala en Vercel</p>
                    <Button size="sm" className="mt-2" onClick={() => copyToClipboard(newSecretKey)}>
                      <Copy className="h-4 w-4 mr-1" />
                      Copiar Clave
                    </Button>
                  </div>
                )}
              </div>

              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium mb-3">En Vercel:</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      1
                    </div>
                    <span>
                      En el campo <strong>"Value"</strong>, borra todo el contenido anterior
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      2
                    </div>
                    <span>Pega la nueva clave secreta completa</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      3
                    </div>
                    <span>
                      Haz clic en <strong>"Save"</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paso 5: Redeploy */}
        <Card className="mb-6 border-2 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                5
              </div>
              Redeploy (MUY IMPORTANTE)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium mb-3">Después de guardar la variable:</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      1
                    </div>
                    <span>
                      Ve a la pestaña <strong>"Deployments"</strong> (en tu proyecto)
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      2
                    </div>
                    <span>Busca el deployment más reciente (el primero de la lista)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      3
                    </div>
                    <span>
                      Haz clic en los <strong>3 puntos (...)</strong> de ese deployment
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      4
                    </div>
                    <span>
                      Selecciona <strong>"Redeploy"</strong>
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      5
                    </div>
                    <span>Espera a que termine (verás una barra de progreso)</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">
                    <strong>⚠️ Sin redeploy, los cambios NO se aplicarán.</strong> Es obligatorio hacer redeploy después
                    de cambiar variables de entorno.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumen visual */}
        <Card className="border-2 border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Monitor className="h-5 w-5 mr-2" />
              Resumen Visual del Proceso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
              <div className="space-y-1">
                <div>vercel.com → Tu Proyecto → Settings → Environment Variables</div>
                <div>↓</div>
                <div>Buscar: STRIPE_SECRET_KEY</div>
                <div>↓</div>
                <div>Edit → Pegar nueva clave → Save</div>
                <div>↓</div>
                <div>Deployments → Último deployment → ... → Redeploy</div>
                <div>↓</div>
                <div>✅ ¡Listo!</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enlaces rápidos */}
        <div className="mt-8 flex flex-wrap gap-4">
          <Button
            onClick={() => window.open("https://vercel.com/dashboard", "_blank")}
            className="bg-black hover:bg-gray-800 text-white"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir Vercel Dashboard
          </Button>
          <Button variant="outline" onClick={() => window.open("/admin/stripe-diagnostics", "_blank")}>
            Probar después del redeploy
          </Button>
        </div>
      </div>
    </div>
  )
}

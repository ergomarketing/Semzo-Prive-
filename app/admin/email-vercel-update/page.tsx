"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Copy, ExternalLink, Monitor } from "lucide-react"

export default function EmailVercelUpdatePage() {
  const [projectName, setProjectName] = useState("semzo-prive")
  const [newApiKey, setNewApiKey] = useState("")

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📧 Actualizar API Key de Email en Vercel</h1>
          <p className="text-gray-600">Guía paso a paso para actualizar tu nueva API key de email</p>
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paso 3: Encontrar EMAIL_API_KEY */}
        <Card className="mb-6 border-2 border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                3
              </div>
              Buscar EMAIL_API_KEY
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium mb-3">En la página de Environment Variables:</h4>

                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">
                      <strong>Si YA EXISTE</strong> EMAIL_API_KEY:
                    </p>
                    <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                      <li>Busca la fila que dice "EMAIL_API_KEY"</li>
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
                      <strong>Si NO EXISTE</strong> EMAIL_API_KEY:
                    </p>
                    <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                      <li>
                        Haz clic en el botón <strong>"Add New"</strong>
                      </li>
                      <li>
                        En "Name" escribe: <code>EMAIL_API_KEY</code>
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
              Pegar la Nueva API Key
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium mb-3">Pega tu nueva API key aquí para verificar:</h4>
                <Input
                  placeholder="re_123abc... (pega la API key completa)"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  className="font-mono text-sm"
                />

                {newApiKey && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 text-sm">✅ API key lista - Cópiala y pégala en Vercel</p>
                    <Button size="sm" className="mt-2" onClick={() => copyToClipboard(newApiKey)}>
                      <Copy className="h-4 w-4 mr-1" />
                      Copiar API Key
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
                    <span>Pega la nueva API key completa</span>
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

        {/* Paso 6: Probar */}
        <Card className="mb-6 border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                6
              </div>
              Probar que Funcione
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium mb-3">Después del redeploy:</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      1
                    </div>
                    <span>
                      Ve a <strong>"/admin/emails"</strong> en tu sitio
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      2
                    </div>
                    <span>Intenta enviar un email de prueba</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      3
                    </div>
                    <span>¡Verifica que llegue correctamente!</span>
                  </div>
                </div>

                <div className="mt-4 flex justify-center">
                  <Button
                    onClick={() => window.open("/admin/emails", "_blank")}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Ir a Dashboard de Emails
                  </Button>
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
                <div>Buscar: EMAIL_API_KEY</div>
                <div>↓</div>
                <div>Edit → Pegar nueva API key → Save</div>
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
          <Button variant="outline" onClick={() => window.open("/admin/emails", "_blank")}>
            Ir a Dashboard de Emails
          </Button>
        </div>
      </div>
    </div>
  )
}

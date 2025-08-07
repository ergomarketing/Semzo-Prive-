"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react"

interface EnvStatus {
  name: string
  value: boolean
  required: boolean
  description: string
}

export default function EnvDebugPage() {
  const [clientEnv, setClientEnv] = useState<EnvStatus[]>([])
  const [serverEnv, setServerEnv] = useState<EnvStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkClientEnv = () => {
    const envVars: EnvStatus[] = [
      {
        name: "NEXT_PUBLIC_SUPABASE_URL",
        value: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        required: true,
        description: "URL del proyecto Supabase",
      },
      {
        name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        value: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        required: true,
        description: "Clave pública de Supabase",
      },
      {
        name: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
        value: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        required: false,
        description: "Clave pública de Stripe",
      },
      {
        name: "NEXT_PUBLIC_SITE_URL",
        value: !!process.env.NEXT_PUBLIC_SITE_URL,
        required: false,
        description: "URL del sitio web",
      },
    ]
    setClientEnv(envVars)
  }

  const checkServerEnv = async () => {
    try {
      const response = await fetch("/api/debug-env")
      const data = await response.json()

      if (response.ok) {
        setServerEnv(data.envVars)
      } else {
        setError(data.error || "Error verificando variables del servidor")
      }
    } catch (err) {
      setError("Error de conexión con el servidor")
    }
  }

  const refreshCheck = async () => {
    setLoading(true)
    setError(null)

    checkClientEnv()
    await checkServerEnv()

    setLoading(false)
  }

  useEffect(() => {
    refreshCheck()
  }, [])

  const getStatusIcon = (status: boolean, required: boolean) => {
    if (status) {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    } else if (required) {
      return <XCircle className="h-5 w-5 text-red-500" />
    } else {
      return <AlertCircle className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: boolean, required: boolean) => {
    if (status) {
      return (
        <Badge variant="default" className="bg-green-500">
          Configurada
        </Badge>
      )
    } else if (required) {
      return <Badge variant="destructive">Faltante</Badge>
    } else {
      return <Badge variant="secondary">Opcional</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Diagnóstico de Variables de Entorno</h1>
        <p className="text-gray-600">Verifica que todas las variables de entorno estén configuradas correctamente</p>
      </div>

      <div className="mb-4">
        <Button onClick={refreshCheck} disabled={loading} className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Verificando..." : "Actualizar"}
        </Button>
      </div>

      {error && (
        <Card className="mb-6 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Variables del Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Variables del Cliente
              <Badge variant="outline">Frontend</Badge>
            </CardTitle>
            <CardDescription>Variables disponibles en el navegador (NEXT_PUBLIC_*)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clientEnv.map((env) => (
                <div key={env.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(env.value, env.required)}
                    <div>
                      <div className="font-medium text-sm">{env.name}</div>
                      <div className="text-xs text-gray-500">{env.description}</div>
                    </div>
                  </div>
                  {getStatusBadge(env.value, env.required)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Variables del Servidor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Variables del Servidor
              <Badge variant="outline">Backend</Badge>
            </CardTitle>
            <CardDescription>Variables disponibles solo en el servidor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {serverEnv.length > 0 ? (
                serverEnv.map((env) => (
                  <div key={env.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(env.value, env.required)}
                      <div>
                        <div className="font-medium text-sm">{env.name}</div>
                        <div className="text-xs text-gray-500">{env.description}</div>
                      </div>
                    </div>
                    {getStatusBadge(env.value, env.required)}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {loading ? "Cargando..." : "No se pudieron cargar las variables del servidor"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumen */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Resumen del Estado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {clientEnv.filter((env) => env.value).length + serverEnv.filter((env) => env.value).length}
              </div>
              <div className="text-sm text-gray-600">Configuradas</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {clientEnv.filter((env) => !env.value && env.required).length +
                  serverEnv.filter((env) => !env.value && env.required).length}
              </div>
              <div className="text-sm text-gray-600">Faltantes (Requeridas)</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {clientEnv.filter((env) => !env.value && !env.required).length +
                  serverEnv.filter((env) => !env.value && !env.required).length}
              </div>
              <div className="text-sm text-gray-600">Opcionales</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instrucciones */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>¿Cómo configurar las variables faltantes?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">1. En Vercel:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
                <li>Ve a tu proyecto en Vercel</li>
                <li>Settings → Environment Variables</li>
                <li>Agrega las variables faltantes</li>
                <li>Redeploy el proyecto</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">2. Variables de Supabase:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
                <li>Ve a tu proyecto en supabase.com</li>
                <li>Settings → API</li>
                <li>Copia Project URL y anon key</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">3. Variables de Email:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
                <li>Ve a resend.com</li>
                <li>API Keys → Create API Key</li>
                <li>Copia la clave generada</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

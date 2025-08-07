"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react"

interface EnvCheck {
  name: string
  value: string | undefined
  required: boolean
  status: "ok" | "missing" | "warning"
}

export default function EnvCheckPage() {
  const [envVars, setEnvVars] = useState<EnvCheck[]>([])

  useEffect(() => {
    const checkEnvVars = () => {
      const vars: EnvCheck[] = [
        {
          name: "NEXT_PUBLIC_SUPABASE_URL",
          value: process.env.NEXT_PUBLIC_SUPABASE_URL,
          required: true,
          status: process.env.NEXT_PUBLIC_SUPABASE_URL ? "ok" : "missing",
        },
        {
          name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
          value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          required: true,
          status: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "ok" : "missing",
        },
        {
          name: "NEXT_PUBLIC_SITE_URL",
          value: process.env.NEXT_PUBLIC_SITE_URL,
          required: false,
          status: process.env.NEXT_PUBLIC_SITE_URL ? "ok" : "warning",
        },
        {
          name: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
          value: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
          required: false,
          status: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? "ok" : "warning",
        },
      ]

      setEnvVars(vars)
    }

    checkEnvVars()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ok":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case "missing":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ok":
        return <Badge className="bg-green-100 text-green-800">Configurada</Badge>
      case "missing":
        return <Badge className="bg-red-100 text-red-800">Faltante</Badge>
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800">Opcional</Badge>
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Verificación de Variables de Entorno (Cliente)
            </CardTitle>
            <p className="text-center text-gray-600">
              Estas son las variables de entorno disponibles en el cliente (navegador)
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {envVars.map((envVar) => (
                <div key={envVar.name} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(envVar.status)}
                    <div>
                      <h3 className="font-medium">{envVar.name}</h3>
                      <p className="text-sm text-gray-500">
                        {envVar.value ? `${envVar.value.substring(0, 20)}...` : "No configurada"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(envVar.status)}
                    {envVar.required && (
                      <Badge variant="outline" className="text-xs">
                        Requerida
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Información importante:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Las variables NEXT_PUBLIC_* están disponibles en el cliente</li>
                <li>• Las variables sin NEXT_PUBLIC_ solo están disponibles en el servidor</li>
                <li>• Si faltan variables requeridas, verifica la configuración en Vercel</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

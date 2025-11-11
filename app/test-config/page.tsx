"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"

export default function TestConfigPage() {
  const [config, setConfig] = useState({
    supabaseUrl: "",
    supabaseKey: "",
    stripePublic: "",
    emailKey: "",
  })

  useEffect(() => {
    setConfig({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      stripePublic: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
      emailKey: process.env.EMAIL_API_KEY || "",
    })
  }, [])

  const checkStatus = (value: string, name: string) => {
    if (!value) {
      return { status: "error", message: `${name} no configurada` }
    }
    if (value.includes("placeholder") || value.length < 10) {
      return { status: "warning", message: `${name} parece ser un placeholder` }
    }
    return { status: "success", message: `${name} configurada correctamente` }
  }

  const configs = [
    { name: "Supabase URL", value: config.supabaseUrl, key: "supabaseUrl" },
    { name: "Supabase Anon Key", value: config.supabaseKey, key: "supabaseKey" },
    { name: "Stripe Public Key", value: config.stripePublic, key: "stripePublic" },
    { name: "Email API Key", value: config.emailKey, key: "emailKey" },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Diagnóstico de Configuración</h1>
          <p className="text-gray-600">Verificación del estado de las variables de entorno</p>
        </div>

        <div className="grid gap-6">
          {configs.map((item) => {
            const status = checkStatus(item.value, item.name)
            return (
              <Card key={item.key} className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between">
                    <span>{item.name}</span>
                    {status.status === "success" && <CheckCircle className="h-6 w-6 text-green-500" />}
                    {status.status === "warning" && <AlertCircle className="h-6 w-6 text-yellow-500" />}
                    {status.status === "error" && <XCircle className="h-6 w-6 text-red-500" />}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-2">{status.message}</p>
                  <div className="bg-gray-100 p-3 rounded text-xs font-mono break-all">
                    {item.value ? `${item.value.substring(0, 50)}...` : "No configurada"}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Instrucciones:</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• Si ves errores, configura las variables faltantes en Vercel</li>
            <li>• Después de cambiar variables, haz redeploy</li>
            <li>• Las variables NEXT_PUBLIC_ son visibles en el cliente</li>
            <li>• Esta página solo funciona después del deploy</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

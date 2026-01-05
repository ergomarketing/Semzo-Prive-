"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2, Copy, ExternalLink, AlertCircle, Settings } from "lucide-react"

export default function SetupGuidePage() {
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({})
  const [envVars, setEnvVars] = useState({
    EMAIL_API_KEY: "",
    MAILGUN_DOMAIN: "",
    ADMIN_USERNAME: "admin",
    ADMIN_PASSWORD: "",
    NEXT_PUBLIC_FACEBOOK_PIXEL_ID: "",
    NEXT_PUBLIC_GOOGLE_ANALYTICS_ID: "",
    NEXT_PUBLIC_BASE_URL: "https://tu-dominio.vercel.app",
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("¡Copiado al portapapeles!")
  }

  const markStepComplete = (step: string) => {
    setCompletedSteps({ ...completedSteps, [step]: true })
  }

  const generateEnvFile = () => {
    const envContent = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join("\n")

    return `# 🔧 CONFIGURACIÓN SEMZO PRIVÉ
# ================================================================

# 📧 EMAIL CONFIGURATION
${envContent.split("\n").slice(0, 2).join("\n")}

# 🔐 ADMIN CONFIGURATION  
${envContent.split("\n").slice(2, 4).join("\n")}

# 📊 ANALYTICS CONFIGURATION
${envContent.split("\n").slice(4).join("\n")}

# 💳 STRIPE CONFIGURATION (ya configurado)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_..."}
STRIPE_SECRET_KEY=${process.env.STRIPE_SECRET_KEY || "sk_test_..."}
STRIPE_WEBHOOK_SECRET=${process.env.STRIPE_WEBHOOK_SECRET || "whsec_..."}
`
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="font-serif text-3xl text-slate-900 mb-2">🚀 Configuración Inicial</h1>
          <p className="text-slate-600">Completa estos pasos para configurar tu plataforma Semzo Privé</p>
        </div>

        {/* Progress Overview */}
        <Card className="mb-8 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Progreso de Configuración
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(envVars).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div
                    className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                      value ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {value ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  </div>
                  <p className="text-xs text-slate-600">{key.replace("NEXT_PUBLIC_", "").replace("_", " ")}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step 1: Email Configuration */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              📧 Paso 1: Configuración de Email (Resend)
              {completedSteps.email && <CheckCircle2 className="h-5 w-5 ml-2 text-green-600" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">🎯 Recomendación: Usar Resend</h4>
              <p className="text-blue-700 text-sm mb-3">
                Resend es la opción más fácil y confiable para emails transaccionales.
              </p>
              <div className="space-y-2">
                <p className="text-sm text-blue-700">
                  1. Ve a <strong>resend.com</strong>
                </p>
                <p className="text-sm text-blue-700">2. Crea una cuenta gratuita</p>
                <p className="text-sm text-blue-700">3. Verifica tu dominio (opcional para testing)</p>
                <p className="text-sm text-blue-700">4. Copia tu API Key</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => window.open("https://resend.com", "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ir a Resend
              </Button>
            </div>

            <div>
              <Label htmlFor="email-api-key">EMAIL_API_KEY</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="email-api-key"
                  placeholder="re_xxxxxxxxxx"
                  value={envVars.EMAIL_API_KEY}
                  onChange={(e) => setEnvVars({ ...envVars, EMAIL_API_KEY: e.target.value })}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(envVars.EMAIL_API_KEY)}
                  disabled={!envVars.EMAIL_API_KEY}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button
              onClick={() => markStepComplete("email")}
              disabled={!envVars.EMAIL_API_KEY}
              className="bg-green-600 hover:bg-green-700"
            >
              ✅ Marcar Email como Completado
            </Button>
          </CardContent>
        </Card>

        {/* Step 2: Admin Configuration */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              🔐 Paso 2: Configuración de Administrador
              {completedSteps.admin && <CheckCircle2 className="h-5 w-5 ml-2 text-green-600" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-medium text-amber-900 mb-2">🔒 Credenciales de Acceso</h4>
              <p className="text-amber-700 text-sm">
                Estas credenciales te permitirán acceder al panel de administración en <strong>/admin</strong>
              </p>
            </div>

            <div>
              <Label htmlFor="admin-username">ADMIN_USERNAME</Label>
              <Input
                id="admin-username"
                placeholder="admin"
                value={envVars.ADMIN_USERNAME}
                onChange={(e) => setEnvVars({ ...envVars, ADMIN_USERNAME: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="admin-password">ADMIN_PASSWORD</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="Contraseña segura"
                value={envVars.ADMIN_PASSWORD}
                onChange={(e) => setEnvVars({ ...envVars, ADMIN_PASSWORD: e.target.value })}
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">Mínimo 8 caracteres, incluye números y símbolos</p>
            </div>

            <Button
              onClick={() => markStepComplete("admin")}
              disabled={!envVars.ADMIN_USERNAME || !envVars.ADMIN_PASSWORD}
              className="bg-green-600 hover:bg-green-700"
            >
              ✅ Marcar Admin como Completado
            </Button>
          </CardContent>
        </Card>

        {/* Step 3: Analytics Configuration */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              📊 Paso 3: Configuración de Analytics (Opcional)
              {completedSteps.analytics && <CheckCircle2 className="h-5 w-5 ml-2 text-green-600" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-purple-900 mb-2">📈 Tracking y Analytics</h4>
              <p className="text-purple-700 text-sm">
                Opcional pero recomendado para hacer seguimiento de usuarios y conversiones.
              </p>
            </div>

            <div>
              <Label htmlFor="base-url">NEXT_PUBLIC_BASE_URL</Label>
              <Input
                id="base-url"
                placeholder="https://tu-dominio.vercel.app"
                value={envVars.NEXT_PUBLIC_BASE_URL}
                onChange={(e) => setEnvVars({ ...envVars, NEXT_PUBLIC_BASE_URL: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="google-analytics">NEXT_PUBLIC_GOOGLE_ANALYTICS_ID (Opcional)</Label>
              <Input
                id="google-analytics"
                placeholder="G-XXXXXXXXXX"
                value={envVars.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}
                onChange={(e) => setEnvVars({ ...envVars, NEXT_PUBLIC_GOOGLE_ANALYTICS_ID: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="facebook-pixel">NEXT_PUBLIC_FACEBOOK_PIXEL_ID (Opcional)</Label>
              <Input
                id="facebook-pixel"
                placeholder="1234567890123456"
                value={envVars.NEXT_PUBLIC_FACEBOOK_PIXEL_ID}
                onChange={(e) => setEnvVars({ ...envVars, NEXT_PUBLIC_FACEBOOK_PIXEL_ID: e.target.value })}
                className="mt-1"
              />
            </div>

            <Button
              onClick={() => markStepComplete("analytics")}
              disabled={!envVars.NEXT_PUBLIC_BASE_URL}
              className="bg-green-600 hover:bg-green-700"
            >
              ✅ Marcar Analytics como Completado
            </Button>
          </CardContent>
        </Card>

        {/* Step 4: Generate .env file */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader>
            <CardTitle>📄 Paso 4: Generar archivo .env</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">🎯 Archivo de Configuración</h4>
              <p className="text-green-700 text-sm mb-3">
                Copia este contenido y pégalo en tu archivo <strong>.env.local</strong> en Vercel.
              </p>
            </div>

            <div className="bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
              <pre>{generateEnvFile()}</pre>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => copyToClipboard(generateEnvFile())} className="bg-indigo-600 hover:bg-indigo-700">
                <Copy className="h-4 w-4 mr-2" />
                Copiar .env completo
              </Button>
              <Button variant="outline" onClick={() => window.open("/admin/vercel-guide", "_blank")}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Guía de Vercel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-blue-50">
          <CardHeader>
            <CardTitle>🎉 ¡Siguiente Paso!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 mb-4">Una vez que hayas configurado las variables de entorno en Vercel:</p>
            <div className="space-y-2 text-sm text-slate-600">
              <p>✅ 1. Copia las variables a Vercel</p>
              <p>✅ 2. Redeploy tu aplicación</p>
              <p>
                ✅ 3. Accede al panel de admin en <strong>/admin</strong>
              </p>
              <p>
                ✅ 4. Prueba el registro de usuarios en <strong>/signup</strong>
              </p>
            </div>

            <div className="mt-6 flex gap-2">
              <Button
                onClick={() => (window.location.href = "/admin/login")}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Ir al Panel de Admin
              </Button>
              <Button variant="outline" onClick={() => (window.location.href = "/signup")}>
                Probar Registro
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

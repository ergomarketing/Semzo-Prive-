"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle, Smartphone } from "lucide-react"
import { getSupabaseBrowser } from "@/app/lib/supabaseClient"
import { useAuth } from "../../hooks/useAuth"
import { SMSAuthModal } from "@/app/components/sms-auth-modal"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [showSMSModal, setShowSMSModal] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()

  useEffect(() => {
    const plan = searchParams.get("plan")
    const registered = searchParams.get("registered")
    const confirmed = searchParams.get("confirmed")

    if (plan) {
      setSelectedPlan(plan)
    }

    if (registered === "true") {
      setMessage("Registro exitoso. Ahora puedes iniciar sesión para continuar con tu membresía.")
    }

    if (confirmed === "true") {
      setMessage("¡Email confirmado exitosamente! Por favor inicia sesión.")
    }
  }, [searchParams])

  useEffect(() => {
    if (!loading && user) {
      const plan = searchParams.get("plan")
      const redirectUrl = plan ? `/dashboard?plan=${plan}` : "/dashboard"

      setTimeout(() => {
        router.push(redirectUrl)
      }, 500)
    }
  }, [user, loading, router, searchParams])

  useEffect(() => {
    const urlMessage = searchParams.get("message")
    const urlError = searchParams.get("error")

    if (urlMessage === "email_confirmed") {
      setMessage("¡Email confirmado exitosamente! Ya puedes iniciar sesión.")
    } else if (urlMessage === "password_updated") {
      setMessage("¡Contraseña actualizada! Ya puedes iniciar sesión con tu nueva contraseña.")
    } else if (urlMessage === "already_confirmed") {
      setMessage("Tu email ya está confirmado. Puedes iniciar sesión.")
    } else if (urlError === "confirmation_failed") {
      setMessage("Error al confirmar el email. Intenta nuevamente.")
    } else if (urlError === "invalid_link") {
      setMessage("Enlace de confirmación inválido o expirado.")
    } else if (urlError === "invalid_token") {
      setMessage("Token de confirmación inválido. Solicita un nuevo enlace.")
    } else if (urlError === "config_error") {
      setMessage("Error de configuración del servidor.")
    } else if (urlError === "unexpected_error") {
      setMessage("Error inesperado. Intenta más tarde.")
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    if (!email || !password) {
      setMessage("Email y contraseña son requeridos")
      setIsLoading(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setMessage("Por favor ingresa un email válido")
      setIsLoading(false)
      return
    }

    if (password.trim().length < 6) {
      setMessage("La contraseña debe tener al menos 6 caracteres")
      setIsLoading(false)
      return
    }

    try {
      const supabase = getSupabaseBrowser()

      if (!supabase) {
        setMessage("Error de configuración. Contacta al administrador.")
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      })

      if (error) {
        if (
          error.message.includes("Invalid login credentials") ||
          error.message.includes("Email not confirmed") ||
          error.message.includes("Invalid email or password")
        ) {
          setMessage("Email o contraseña incorrectos")
        } else if (error.message.includes("Email not confirmed")) {
          setMessage("Por favor confirma tu email antes de iniciar sesión")
        } else {
          setMessage("Error de autenticación. Inténtalo de nuevo.")
        }
        return
      }

      if (data.user) {
        setMessage("¡Login exitoso! Redirigiendo...")
        const plan = searchParams.get("plan")
        const redirectUrl = plan ? `/dashboard?plan=${plan}` : "/dashboard"

        setTimeout(() => {
          router.push(redirectUrl)
        }, 1000)
      }
    } catch (error: any) {
      setMessage("Error de conexión. Inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSMSSuccess = (user: any) => {
    setMessage("¡Login exitoso! Redirigiendo...")
    const plan = searchParams.get("plan")
    const redirectUrl = plan ? `/dashboard?plan=${plan}` : "/dashboard"

    setTimeout(() => {
      router.push(redirectUrl)
    }, 1000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-nude/10 to-rose-pastel/5 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto mb-4">
            <img src="/images/logo-20semzo-20prive.png" alt="Semzo Privé" className="h-12 w-auto mx-auto" />
          </div>
          <CardTitle className="font-serif text-3xl text-slate-900">Bienvenida de vuelta</CardTitle>
          <CardDescription className="text-slate-600">
            {selectedPlan ? (
              <>
                Continúa con tu plan <span className="font-semibold capitalize">{selectedPlan}</span>
              </>
            ) : (
              "Accede a tu cuenta de Semzo Privé"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          {selectedPlan && (
            <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-lg">
              <p className="text-sm text-rose-800 text-center">
                Plan seleccionado: <span className="font-semibold capitalize">{selectedPlan}</span>
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-slate-700 font-medium mb-2 block">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="h-12"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-slate-700 font-medium mb-2 block">
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  className="h-12 pr-12"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-indigo-dark text-white hover:bg-indigo-dark/90 h-12"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>

            {message && (
              <div
                className={`text-center text-sm p-3 rounded-lg flex items-center justify-center gap-2 ${
                  message.includes("exitoso") || message.includes("confirmado") || message.includes("actualizada")
                    ? "text-indigo-dark bg-rose-50 border border-rose-200"
                    : "text-red-700 bg-red-50 border border-red-200"
                }`}
              >
                {message.includes("exitoso") || message.includes("confirmado") || message.includes("actualizada") ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {message}
              </div>
            )}
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-slate-500">O continúa con</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full mt-4 h-12 border-slate-300 hover:bg-slate-50 bg-transparent"
              onClick={() => setShowSMSModal(true)}
            >
              <Smartphone className="h-5 w-5 mr-2" />
              Iniciar sesión con teléfono
            </Button>
          </div>

          <div className="mt-6 text-center">
            <a href="/auth/forgot-password" className="text-sm text-indigo-dark hover:underline font-medium">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <div className="mt-8 text-center">
            <p className="text-slate-600">
              ¿No tienes cuenta?{" "}
              <a
                href={selectedPlan ? `/signup?plan=${selectedPlan}` : "/signup"}
                className="text-indigo-dark hover:underline font-medium"
              >
                Únete a Semzo Privé
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      <SMSAuthModal isOpen={showSMSModal} onClose={() => setShowSMSModal(false)} onSuccess={handleSMSSuccess} />
    </div>
  )
}

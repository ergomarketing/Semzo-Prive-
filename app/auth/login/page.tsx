"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle, Smartphone } from "lucide-react"
import { getSupabaseBrowser } from "@/app/lib/supabase"
import { useAuth } from "../../hooks/useAuth"
import { SMSAuthModal } from "@/app/components/sms-auth-modal"

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z" />
    </svg>
  )
}

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

  const handleAppleLogin = async () => {
    try {
      const supabase = getSupabaseBrowser()
      if (!supabase) return

      const plan = searchParams.get("plan")
      const redirectTo = plan
        ? `${window.location.origin}/auth/callback?plan=${plan}&origin=checkout`
        : `${window.location.origin}/auth/callback`

      await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: { redirectTo },
      })
    } catch (error) {
      setMessage("Error al iniciar sesión con Apple. Inténtalo de nuevo.")
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
            <img src="/images/logo-20semzo-20prive.png" alt="" loading="eager" className="h-12 w-auto mx-auto" />
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

            <div className="flex flex-col gap-3 mt-4">
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-slate-300 hover:bg-slate-50 bg-transparent"
                onClick={handleAppleLogin}
              >
                <AppleIcon className="h-5 w-5 mr-2" />
                Continuar con Apple
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-slate-300 hover:bg-slate-50 bg-transparent"
                onClick={() => setShowSMSModal(true)}
              >
                <Smartphone className="h-5 w-5 mr-2" />
                Iniciar sesión con teléfono
              </Button>
            </div>
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

      <SMSAuthModal 
        isOpen={showSMSModal} 
        onClose={() => setShowSMSModal(false)} 
        onSuccess={handleSMSSuccess} 
        mode="login"
      />
    </div>
  )
}

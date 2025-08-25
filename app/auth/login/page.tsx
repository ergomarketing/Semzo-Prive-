"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { supabase } from "@/app/lib/supabase-unified"
import { useAuth } from "@/hooks/useAuth"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard")
    }
  }, [user, loading, router])

  // Manejo de mensajes de confirmación de email
  useEffect(() => {
    const urlMessage = searchParams.get("message")
    const urlError = searchParams.get("error")

    if (urlMessage === "email_confirmed") {
      setMessage("¡Email confirmado exitosamente! Ya puedes iniciar sesión.")
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

    try {
      console.log("[Login] Valores antes de signInWithPassword:")
      console.log("[Login] Email:", JSON.stringify(email))
      console.log("[Login] Email length:", email.length)
      console.log("[Login] Email trimmed:", JSON.stringify(email.trim()))
      console.log("[Login] Password:", JSON.stringify(password))
      console.log("[Login] Password length:", password.length)
      console.log("[Login] Password trimmed:", JSON.stringify(password.trim()))

      const credentials = {
        email: email.trim(),
        password: password.trim(),
      }

      console.log("[Login] Credentials object:", JSON.stringify(credentials))
      console.log("[Login] Iniciando sesión con Supabase...")

      const { data, error } = await supabase.auth.signInWithPassword(credentials)

      console.log("[Login] Respuesta de Supabase:")
      console.log("[Login] Data:", data)
      console.log("[Login] Error:", error)

      if (error) {
        console.error("[Login] Error completo:", {
          message: error.message,
          status: error.status,
          statusCode: error.status,
          name: error.name,
        })

        if (error.message.includes("Email not confirmed")) {
          setMessage("Debes confirmar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.")
        } else if (error.message.includes("Invalid login credentials")) {
          setMessage("Email o contraseña incorrectos")
        } else {
          setMessage(error.message)
        }
        return
      }

      if (data.user) {
        console.log("[Login] Login exitoso:", data.user.email)
        setMessage("¡Login exitoso!")
        setTimeout(() => {
          router.push("/dashboard")
        }, 1500)
      }
    } catch (error: any) {
      console.error("[Login] Error catch:", error)
      setMessage("Error de conexión")
    } finally {
      setIsLoading(false)
    }
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
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-pastel/20 flex items-center justify-center">
            <span className="text-2xl text-indigo-dark font-serif">SP</span>
          </div>
          <CardTitle className="font-serif text-3xl text-slate-900">Bienvenida de vuelta</CardTitle>
          <CardDescription className="text-slate-600">Accede a tu cuenta de Semzo Privé</CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
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
                  message.includes("exitoso") || message.includes("confirmado")
                    ? "text-green-700 bg-green-50 border border-green-200"
                    : "text-red-700 bg-red-50 border border-red-200"
                }`}
              >
                {message.includes("exitoso") || message.includes("confirmado") ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {message}
              </div>
            )}
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-600">
              ¿No tienes cuenta?{" "}
              <a href="/signup" className="text-indigo-dark hover:underline font-medium">
                Únete a Semzo Privé
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

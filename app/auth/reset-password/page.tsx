"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Loader2, Eye, EyeOff } from "lucide-react"
import { getSupabaseBrowser } from "@/app/lib/supabaseClient"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [isEmailChange, setIsEmailChange] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const checkRecoveryLink = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))

      const accessToken = hashParams.get("access_token")
      const refreshToken = hashParams.get("refresh_token")
      const type = hashParams.get("type")

      console.log("[ResetPassword] Hash params:", {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        type: type,
      })

      if (!accessToken || !refreshToken) {
        console.error("[ResetPassword] Missing tokens in hash")
        setError("Enlace inválido o expirado. Solicita un nuevo enlace de recuperación.")
        setIsReady(false)
        return
      }

      if (type !== "recovery" && type !== "email_change") {
        console.error("[ResetPassword] Invalid type:", type)
        setError("Enlace inválido. Este no es un enlace válido.")
        setIsReady(false)
        return
      }

      if (type === "email_change") {
        setIsEmailChange(true)
      }

      const supabase = getSupabaseBrowser()
      if (supabase) {
        try {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (sessionError) {
            console.error("[ResetPassword] Error setting session:", sessionError)
            setError("Error al validar el enlace. Por favor, solicita uno nuevo.")
            setIsReady(false)
            return
          }

          console.log("[ResetPassword] Session established successfully")
          setIsReady(true)
        } catch (err) {
          console.error("[ResetPassword] Exception setting session:", err)
          setError("Error al procesar el enlace. Por favor, intenta de nuevo.")
          setIsReady(false)
        }
      } else {
        setError("Error de configuración. Contacta al administrador.")
        setIsReady(false)
      }
    }

    checkRecoveryLink()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!password || !confirmPassword) {
      setError("Todos los campos son obligatorios")
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      setIsLoading(false)
      return
    }

    try {
      const supabase = getSupabaseBrowser()

      if (!supabase) {
        setError("Error de configuración. Contacta al administrador.")
        setIsLoading(false)
        return
      }

      console.log("[ResetPassword] Updating password...")

      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        console.error("[ResetPassword] Error updating password:", updateError)
        setError("Error al actualizar la contraseña. El enlace puede haber expirado.")
        setIsLoading(false)
        return
      }

      if (isEmailChange) {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user?.email) {
          await supabase.from("profiles").update({ email: user.email }).eq("id", user.id)
        }
      }

      console.log("[ResetPassword] Password updated successfully")
      setIsSuccess(true)

      setTimeout(() => {
        router.push("/auth/login")
      }, 3000)
    } catch (error) {
      console.error("[ResetPassword] Exception:", error)
      setError("Error al actualizar la contraseña. Inténtalo de nuevo.")
      setIsLoading(false)
    }
  }

  // Pantalla de éxito
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-nude/10 to-rose-pastel/5 flex items-center justify-center py-12">
        <div className="container mx-auto px-4 max-w-md">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="font-serif text-2xl text-slate-900 mb-4">
                {isEmailChange ? "¡Email y contraseña actualizados!" : "¡Contraseña actualizada!"}
              </h2>
              <p className="text-slate-600 mb-6">
                {isEmailChange
                  ? "Tu email ha sido cambiado y tu nueva contraseña ha sido configurada. Serás redirigido al login."
                  : "Tu contraseña ha sido actualizada exitosamente. Serás redirigido al login en unos segundos."}
              </p>
              <Button
                onClick={() => router.push("/auth/login")}
                className="w-full bg-indigo-dark text-white hover:bg-indigo-dark/90"
              >
                Ir al login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Pantalla de error (enlace inválido)
  if (!isReady && error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-nude/10 to-rose-pastel/5 flex items-center justify-center py-12">
        <div className="container mx-auto px-4 max-w-md">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="font-serif text-2xl text-slate-900 mb-4">Enlace inválido</h2>
              <p className="text-slate-600 mb-6">{error}</p>
              <Button
                onClick={() => router.push("/auth/forgot-password")}
                className="w-full bg-indigo-dark text-white hover:bg-indigo-dark/90"
              >
                Solicitar nuevo enlace
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Pantalla de carga mientras valida el enlace
  if (!isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-nude/10 to-rose-pastel/5 flex items-center justify-center py-12">
        <div className="container mx-auto px-4 max-w-md">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8 text-center">
              <Loader2 className="animate-spin h-12 w-12 text-indigo-dark mx-auto mb-4" />
              <p className="text-slate-600">Validando enlace...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Formulario de cambio de contraseña
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-nude/10 to-rose-pastel/5 flex items-center justify-center py-12">
      <div className="container mx-auto px-4 max-w-md">
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto mb-4">
              <img src="/images/logo-20semzo-20prive.png" alt="Semzo Privé" className="h-12 w-auto mx-auto" />
            </div>
            <CardTitle className="font-serif text-3xl text-slate-900">
              {isEmailChange ? "Configura tu contraseña" : "Nueva contraseña"}
            </CardTitle>
            <p className="text-slate-600">
              {isEmailChange
                ? "Tu email ha sido actualizado. Configura una contraseña para acceder."
                : "Ingresa tu nueva contraseña"}
            </p>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="password" className="text-slate-700 font-medium mb-2 block">
                  {isEmailChange ? "Contraseña" : "Nueva contraseña"}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="h-12 pr-12"
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

              <div>
                <Label htmlFor="confirmPassword" className="text-slate-700 font-medium mb-2 block">
                  Confirmar contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    className="h-12 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-dark text-white hover:bg-indigo-dark/90 h-12"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    {isEmailChange ? "Configurando..." : "Actualizando..."}
                  </>
                ) : isEmailChange ? (
                  "Configurar contraseña"
                ) : (
                  "Actualizar contraseña"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Loader2, Eye, EyeOff } from "lucide-react"
import { getSupabaseBrowser } from "@/app/lib/supabaseClient"

function ResetPasswordForm() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)

  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const verifyAndSetSession = async () => {
      const supabase = getSupabaseBrowser()
      if (!supabase) {
        setError("Error de configuración")
        setIsVerifying(false)
        return
      }

      // Check if we have token_hash in query params (from email link)
      const tokenHash = searchParams.get("token_hash")
      const type = searchParams.get("type")

      if (tokenHash && type === "recovery") {
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        })

        if (verifyError) {
          console.log("[v0] verifyOtp error:", verifyError)
          setError("Enlace inválido o expirado. Solicita un nuevo enlace de recuperación.")
          setIsVerifying(false)
          return
        }

        if (data.session) {
          // Session is set, user can now update password
          setIsReady(true)
          setIsVerifying(false)
          return
        }
      }

      // Fallback: check hash fragment for access_token (old flow)
      const hash = window.location.hash
      if (hash) {
        const hashParams = new URLSearchParams(hash.substring(1))
        const accessToken = hashParams.get("access_token")
        const refreshToken = hashParams.get("refresh_token")
        const hashType = hashParams.get("type")

        if (accessToken && refreshToken) {
          if (hashType && hashType !== "recovery" && hashType !== "email_change") {
            setError("Enlace inválido.")
            setIsVerifying(false)
            return
          }

          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (sessionError) {
            console.log("[v0] setSession error:", sessionError)
            setError("Enlace inválido o expirado. Solicita un nuevo enlace de recuperación.")
            setIsVerifying(false)
            return
          }

          setIsReady(true)
          setIsVerifying(false)
          return
        }
      }

      // Check if user already has a valid session (maybe coming from email client that auto-verified)
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        setIsReady(true)
        setIsVerifying(false)
        return
      }

      setError("Enlace inválido o expirado. Solicita un nuevo enlace de recuperación.")
      setIsVerifying(false)
    }

    verifyAndSetSession()
  }, [searchParams])

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

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      setIsLoading(false)
      return
    }

    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      setError("La contraseña debe contener al menos una mayúscula, una minúscula y un número")
      setIsLoading(false)
      return
    }

    try {
      const supabase = getSupabaseBrowser()

      if (!supabase) {
        setError("Error de configuración.")
        setIsLoading(false)
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        console.log("[v0] updateUser error:", updateError)
        setError("Error al actualizar la contraseña. El enlace puede haber expirado.")
        setIsLoading(false)
        return
      }

      // Sign out after password update
      await supabase.auth.signOut()
      setIsSuccess(true)

      setTimeout(() => {
        router.push("/auth/login?message=password_updated")
      }, 3000)
    } catch (error) {
      console.log("[v0] handleSubmit error:", error)
      setError("Error al actualizar la contraseña. Inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-nude/10 to-rose-pastel/5 flex items-center justify-center py-12">
        <div className="container mx-auto px-4 max-w-md">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="font-serif text-2xl text-slate-900 mb-4">¡Contraseña actualizada!</h2>
              <p className="text-slate-600 mb-6">
                Tu contraseña ha sido actualizada exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-nude/10 to-rose-pastel/5 flex items-center justify-center py-12">
      <div className="container mx-auto px-4 max-w-md">
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto mb-4">
              <img src="/images/logo-20semzo-20prive.png" alt="" loading="eager" className="h-12 w-auto mx-auto" />
            </div>
            <CardTitle className="font-serif text-3xl text-slate-900">Nueva contraseña</CardTitle>
            <p className="text-slate-600">Ingresa tu nueva contraseña</p>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            {isVerifying && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center">
                <Loader2 className="h-5 w-5 text-blue-500 mr-3 animate-spin" />
                <span className="text-blue-700">Verificando enlace...</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="password" className="text-slate-700 font-medium mb-2 block">
                  Nueva contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="h-12 pr-12"
                    disabled={!isReady || isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    disabled={!isReady}
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
                    disabled={!isReady || isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    disabled={!isReady}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !isReady}
                className="w-full bg-indigo-dark text-white hover:bg-indigo-dark/90 h-12"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Actualizando...
                  </>
                ) : (
                  "Actualizar contraseña"
                )}
              </Button>
            </form>

            {error && (
              <div className="mt-6 text-center">
                <Button
                  variant="link"
                  onClick={() => router.push("/auth/forgot-password")}
                  className="text-indigo-dark"
                >
                  Solicitar nuevo enlace de recuperación
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ResetPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-dark" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}

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

export default function SetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [userEmail, setUserEmail] = useState("")

  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const supabase = getSupabaseBrowser()
      if (!supabase) {
        setError("Error de configuración")
        return
      }

      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get("access_token")
      const refreshToken = hashParams.get("refresh_token")

      if (accessToken && refreshToken) {
        try {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (sessionError) {
            console.error("Session error:", sessionError)
            // No retornar error aquí, intentar con la sesión existente
          }
        } catch (err) {
          console.error("Error setting session:", err)
        }
      }

      // Verificar sesión actual
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session?.user) {
          setError("Sesión expirada. Por favor, solicita un nuevo enlace de verificación desde tu perfil.")
          return
        }
        setUserEmail(session.user.email || "")
        setIsReady(true)
        return
      }

      setUserEmail(user.email || "")
      setIsReady(true)
    }

    checkSession()
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
        setError("Error de configuración")
        setIsLoading(false)
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        setError("Error al crear la contraseña: " + updateError.message)
        setIsLoading(false)
        return
      }

      setIsSuccess(true)

      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (error) {
      setError("Error al crear la contraseña")
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50/30 to-white flex items-center justify-center py-12">
        <div className="container mx-auto px-4 max-w-md">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-rose-50 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-slate-700" />
              </div>
              <h2 className="font-serif text-2xl text-slate-900 mb-4">¡Contraseña creada!</h2>
              <p className="text-slate-600 mb-6">Ahora puedes iniciar sesión con tu email y contraseña.</p>
              <Button
                onClick={() => router.push("/dashboard")}
                className="w-full bg-[#1a2c4e] text-white hover:bg-[#1a2c4e]/90"
              >
                Ir al panel
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!isReady && error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50/30 to-white flex items-center justify-center py-12">
        <div className="container mx-auto px-4 max-w-md">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-rose-50 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-slate-600" />
              </div>
              <h2 className="font-serif text-2xl text-slate-900 mb-4">Error</h2>
              <p className="text-slate-600 mb-6">{error}</p>
              <Button
                onClick={() => router.push("/auth/login")}
                className="w-full bg-[#1a2c4e] text-white hover:bg-[#1a2c4e]/90"
              >
                Ir al login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50/30 to-white flex items-center justify-center py-12">
        <div className="container mx-auto px-4 max-w-md">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8 text-center">
              <Loader2 className="animate-spin h-12 w-12 text-[#1a2c4e] mx-auto mb-4" />
              <p className="text-slate-600">Verificando sesión...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/30 to-white flex items-center justify-center py-12">
      <div className="container mx-auto px-4 max-w-md">
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-50 flex items-center justify-center">
              <span className="text-2xl text-[#1a2c4e] font-serif">SP</span>
            </div>
            <CardTitle className="font-serif text-3xl text-slate-900">Crear contraseña</CardTitle>
            <p className="text-slate-600 mt-2">
              {userEmail ? `Para: ${userEmail}` : "Crea una contraseña para acceder con email"}
            </p>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            {error && (
              <div className="mb-6 p-4 bg-rose-50/50 border border-rose-100 rounded-lg flex items-center">
                <AlertCircle className="h-5 w-5 text-slate-600 mr-3" />
                <span className="text-slate-700">{error}</span>
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
                className="w-full bg-[#1a2c4e] text-white hover:bg-[#1a2c4e]/90 h-12"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Creando...
                  </>
                ) : (
                  "Crear contraseña"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

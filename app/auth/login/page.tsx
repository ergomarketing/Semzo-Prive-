"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Loader2 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()

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
      console.log("[Login] Enviando credenciales:", email)

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()
      console.log("[Login] Resultado:", result)

      if (result.success) {
        setMessage("¡Login exitoso!")
        // Guardar datos del usuario
        if (typeof window !== "undefined") {
          localStorage.setItem("semzo_user", JSON.stringify(result.user))
        }
        setTimeout(() => {
          router.push("/dashboard")
        }, 1500)
      } else {
        setMessage(result.message || "Error en el login")
      }
    } catch (error: any) {
      console.error("[Login] Error:", error)
      setMessage("Error de conexión")
    } finally {
      setIsLoading(false)
    }
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
              <div className={`text-center text-sm ${message.includes("exitoso") ? "text-green-600" : "text-red-600"}`}>
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

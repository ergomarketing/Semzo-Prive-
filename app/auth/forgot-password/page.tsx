"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { getSupabaseBrowser } from "../../lib/supabaseClient"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!email) {
      setError("El email es obligatorio")
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

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "https://semzoprive.com/auth/reset",
      })

      if (resetError) {
        console.error("Error enviando reset password:", resetError)
        setError("Error al enviar el email. Verifica que el email esté registrado.")
        return
      }

      console.log("✅ Email de reset enviado exitosamente a:", email)
      setIsSubmitted(true)
    } catch (error) {
      console.error("Error en forgot password:", error)
      setError("Error al enviar el email. Inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-nude/10 to-rose-pastel/5 flex items-center justify-center py-12">
        <div className="container mx-auto px-4 max-w-md">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="font-serif text-2xl text-slate-900 mb-4">Email enviado</h2>
              <p className="text-slate-600 mb-6">
                Hemos enviado las instrucciones para restablecer tu contraseña a <strong>{email}</strong>
              </p>
              <p className="text-sm text-slate-500 mb-6">
                Si no recibes el email en unos minutos, revisa tu carpeta de spam.
              </p>
              <Link href="/auth/login">
                <Button className="w-full bg-indigo-dark text-white hover:bg-indigo-dark/90">Volver al login</Button>
              </Link>
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
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-pastel/20 flex items-center justify-center">
              <span className="text-2xl text-indigo-dark font-serif">SP</span>
            </div>
            <CardTitle className="font-serif text-3xl text-slate-900">¿Olvidaste tu contraseña?</CardTitle>
            <p className="text-slate-600">Te enviaremos un enlace para restablecerla</p>
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
                <Label htmlFor="email" className="text-slate-700 font-medium mb-2 block">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="h-12"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-dark text-white hover:bg-indigo-dark/90 h-12"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Enviando...
                  </>
                ) : (
                  "Enviar instrucciones"
                )}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <Link href="/auth/login" className="text-indigo-dark hover:underline flex items-center justify-center">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { Mail, CheckCircle2, AlertCircle } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

export default function SignupPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [requiresConfirmation, setRequiresConfirmation] = useState(false)

  useEffect(() => {
    const plan = searchParams.get("plan")
    if (plan) {
      setSelectedPlan(plan)
    }
  }, [searchParams])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: "error", text: "Las contraseñas no coinciden" })
      setLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setMessage({ type: "error", text: "La contraseña debe tener al menos 8 caracteres" })
      setLoading(false)
      return
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    if (!passwordRegex.test(formData.password)) {
      setMessage({
        type: "error",
        text: "La contraseña debe contener al menos una mayúscula, una minúscula y un número",
      })
      setLoading(false)
      return
    }

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/login?confirmed=true`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
          },
        },
      })

      if (error) {
        if (error.message.includes("already registered")) {
          setMessage({
            type: "error",
            text: "Este correo ya está registrado. Por favor inicia sesión o usa la opción de recuperar contraseña.",
          })
        } else {
          setMessage({ type: "error", text: error.message })
        }
        setLoading(false)
        return
      }

      const needsConfirmation = data.user && !data.session
      setRequiresConfirmation(needsConfirmation)

      if (needsConfirmation) {
        setMessage({
          type: "success",
          text: "Cuenta creada exitosamente. Por favor revisa tu email para confirmar tu cuenta.",
        })
      } else {
        setMessage({
          type: "success",
          text: "Cuenta creada exitosamente. Redirigiendo...",
        })

        setTimeout(() => {
          const loginUrl = selectedPlan
            ? `/auth/login?plan=${selectedPlan}&registered=true`
            : "/auth/login?registered=true"
          router.push(loginUrl)
        }, 2000)
      }

      setFormData({
        email: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: "",
        phone: "",
      })
    } catch (error) {
      setMessage({ type: "error", text: "Error de conexión. Por favor verifica tu internet e inténtalo de nuevo." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-nude/10 to-rose-pastel/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">Crear Cuenta</CardTitle>
          <CardDescription className="text-gray-600">
            {selectedPlan ? (
              <>
                Únete a Semzo Privé con el plan <span className="font-semibold capitalize">{selectedPlan}</span>
              </>
            ) : (
              "Únete a Semzo Privé y accede a bolsos de lujo exclusivos"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedPlan && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg">
              <p className="text-sm text-rose-800 text-center">
                Plan seleccionado: <span className="font-semibold capitalize">{selectedPlan}</span>
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono (opcional)</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                Mínimo 8 caracteres, debe incluir mayúsculas, minúsculas y números
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            {message && (
              <Alert
                className={
                  message.type === "error"
                    ? "border-red-200 bg-red-50"
                    : message.type === "info"
                      ? "border-blue-200 bg-blue-50"
                      : "border-rose-200 bg-rose-50"
                }
              >
                <div className="flex items-start gap-2">
                  {message.type === "error" && <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />}
                  {message.type === "success" && <CheckCircle2 className="h-4 w-4 text-indigo-dark mt-0.5" />}
                  {message.type === "info" && <Mail className="h-4 w-4 text-blue-600 mt-0.5" />}
                  <AlertDescription
                    className={
                      message.type === "error"
                        ? "text-red-800"
                        : message.type === "info"
                          ? "text-blue-800"
                          : "text-indigo-dark"
                    }
                  >
                    {message.text}
                    {message.type === "success" && requiresConfirmation && (
                      <div className="mt-3 p-3 bg-white/50 rounded border border-indigo-dark">
                        <p className="text-sm font-medium text-indigo-dark mb-1">Revisa tu bandeja de entrada</p>
                        <p className="text-xs text-indigo-dark">
                          Te hemos enviado un email de confirmación. Haz clic en el enlace para activar tu cuenta.
                        </p>
                      </div>
                    )}
                    {message.type === "success" && !requiresConfirmation && (
                      <div className="mt-2 text-sm text-indigo-dark">Serás redirigido al login en 2 segundos...</div>
                    )}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creando cuenta..." : "Crear Cuenta"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes cuenta?{" "}
              <Link
                href={selectedPlan ? `/auth/login?plan=${selectedPlan}` : "/auth/login"}
                className="text-pink-600 hover:text-pink-700 font-medium"
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

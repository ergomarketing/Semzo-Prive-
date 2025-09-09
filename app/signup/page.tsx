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
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

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

    if (formData.password.length < 6) {
      setMessage({ type: "error", text: "La contraseña debe tener al menos 6 caracteres" })
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: "success", text: result.message })

        setFormData({
          email: "",
          password: "",
          confirmPassword: "",
          firstName: "",
          lastName: "",
          phone: "",
        })

        // No redirigir automáticamente, mostrar mensaje de confirmación de email
      } else {
        setMessage({ type: "error", text: result.error || "Error en el registro" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error inesperado. Inténtalo de nuevo." })
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
              <Alert className={message.type === "error" ? "border-red-200 bg-red-50" : "border-blue-200 bg-blue-50"}>
                <AlertDescription className={message.type === "error" ? "text-red-800" : "text-blue-800"}>
                  {message.text}
                </AlertDescription>
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
            {message?.type === "success" && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">📧 Revisa tu email y confirma tu cuenta</p>
                <p className="text-xs text-blue-600 mt-1">
                  Después de confirmar, podrás iniciar sesión y continuar con tu membresía {selectedPlan}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

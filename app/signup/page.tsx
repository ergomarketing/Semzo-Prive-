"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"

export default function SignupPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
    acceptNewsletter: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError("")
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
    setError("")
  }

  const validateForm = () => {
    if (!formData.firstName.trim()) return "El nombre es requerido"
    if (!formData.lastName.trim()) return "Los apellidos son requeridos"
    if (!formData.email.trim()) return "El email es requerido"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return "Email inválido"
    if (formData.password.length < 8) return "La contraseña debe tener al menos 8 caracteres"
    if (formData.password !== formData.confirmPassword) return "Las contraseñas no coinciden"
    if (!formData.acceptTerms) return "Debes aceptar los términos y condiciones"
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      console.log("[Frontend] Enviando datos de registro…")

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

      const data = await response.json()

      if (data.success) {
        setSuccess("¡Cuenta creada exitosamente! Redirigiendo...")
        setTimeout(() => {
          router.push("/auth/login")
        }, 2000)
      } else {
        setError(data.message || "Error al crear la cuenta")
      }
    } catch (err: any) {
      console.error("[Frontend] Registro fallido:", err)
      setError("Error de conexión. Inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">SP</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Únete a Semzo Privé</CardTitle>
          <CardDescription>Crea tu cuenta para acceder a nuestro catálogo exclusivo</CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Nombre *</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Apellidos *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Teléfono (opcional)</Label>
              <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} />
            </div>

            <div>
              <Label htmlFor="password">Contraseña *</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmar contraseña *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="acceptTerms"
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) => handleCheckboxChange("acceptTerms", checked as boolean)}
                />
                <Label htmlFor="acceptTerms" className="text-sm">
                  Acepto los{" "}
                  <Link href="/legal/terms" className="text-blue-600 hover:underline">
                    términos y condiciones
                  </Link>{" "}
                  y la{" "}
                  <Link href="/legal/privacy" className="text-blue-600 hover:underline">
                    política de privacidad
                  </Link>{" "}
                  *
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="acceptNewsletter"
                  checked={formData.acceptNewsletter}
                  onCheckedChange={(checked) => handleCheckboxChange("acceptNewsletter", checked as boolean)}
                />
                <Label htmlFor="acceptNewsletter" className="text-sm">
                  Quiero recibir ofertas exclusivas y novedades por email
                </Label>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creando cuenta..." : "Crear cuenta"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes cuenta?{" "}
              <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">
                Inicia sesión
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

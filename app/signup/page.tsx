"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function SignupPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
    acceptMarketing: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})
    setSuccess(false)

    // Validación
    const newErrors: Record<string, string> = {}
    if (!formData.firstName.trim()) newErrors.firstName = "El nombre es obligatorio"
    if (!formData.lastName.trim()) newErrors.lastName = "Los apellidos son obligatorios"
    if (!formData.email.trim()) newErrors.email = "El email es obligatorio"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido"
    }
    if (!formData.password) newErrors.password = "La contraseña es obligatoria"
    if (formData.password.length < 6) newErrors.password = "La contraseña debe tener al menos 6 caracteres"
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden"
    }
    if (!formData.acceptTerms) newErrors.acceptTerms = "Debes aceptar los términos y condiciones"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsLoading(false)
      return
    }

    try {
      // Llamar a la API de registro
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        setSuccess(true)
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } else {
        setErrors({ general: result.message || "Error al crear la cuenta" })
      }
    } catch (error) {
      setErrors({ general: "Error de conexión. Inténtalo de nuevo." })
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-nude/10 to-rose-pastel/5 flex items-center justify-center py-12">
        <div className="container mx-auto px-4 max-w-md">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="font-serif text-2xl text-slate-900 mb-4">¡Cuenta creada exitosamente!</h2>
              <p className="text-slate-600 mb-6">
                Bienvenida a Semzo Privé. Serás redirigida a tu dashboard en unos segundos...
              </p>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-dark mx-auto"></div>
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
            <CardTitle className="font-serif text-3xl text-slate-900">Únete a Semzo Privé</CardTitle>
            <p className="text-slate-600">Crea tu cuenta para acceder a nuestro catálogo exclusivo</p>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                <span className="text-red-700">{errors.general}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-slate-700 font-medium mb-2 block">
                    Nombre *
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="María"
                    className={`h-12 ${errors.firstName ? "border-red-300" : ""}`}
                  />
                  {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                </div>

                <div>
                  <Label htmlFor="lastName" className="text-slate-700 font-medium mb-2 block">
                    Apellidos *
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="García"
                    className={`h-12 ${errors.lastName ? "border-red-300" : ""}`}
                  />
                  {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="text-slate-700 font-medium mb-2 block">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="maria@ejemplo.com"
                  className={`h-12 ${errors.email ? "border-red-300" : ""}`}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <Label htmlFor="phone" className="text-slate-700 font-medium mb-2 block">
                  Teléfono (opcional)
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+34 600 000 000"
                  className="h-12"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-slate-700 font-medium mb-2 block">
                  Contraseña *
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    className={`h-12 pr-12 ${errors.password ? "border-red-300" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-slate-700 font-medium mb-2 block">
                  Confirmar contraseña *
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Repite tu contraseña"
                    className={`h-12 pr-12 ${errors.confirmPassword ? "border-red-300" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
              </div>

              <div className="space-y-4">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                    className="mt-1 mr-3"
                  />
                  <Label htmlFor="acceptTerms" className="text-sm text-slate-700">
                    Acepto los{" "}
                    <Link href="/legal/terms" className="text-indigo-dark underline">
                      términos y condiciones
                    </Link>{" "}
                    y la{" "}
                    <Link href="/legal/privacy" className="text-indigo-dark underline">
                      política de privacidad
                    </Link>{" "}
                    *
                  </Label>
                </div>
                {errors.acceptTerms && <p className="text-sm text-red-600">{errors.acceptTerms}</p>}

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="acceptMarketing"
                    checked={formData.acceptMarketing}
                    onChange={(e) => setFormData({ ...formData, acceptMarketing: e.target.checked })}
                    className="mt-1 mr-3"
                  />
                  <Label htmlFor="acceptMarketing" className="text-sm text-slate-700">
                    Quiero recibir ofertas exclusivas y novedades por email
                  </Label>
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
                    Creando cuenta...
                  </>
                ) : (
                  "Crear cuenta"
                )}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-slate-600">
                ¿Ya tienes cuenta?{" "}
                <Link href="/auth/login" className="text-indigo-dark hover:underline font-medium">
                  Inicia sesión
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

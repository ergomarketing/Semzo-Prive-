"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/app/lib/supabase-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"

interface FormData {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  phone: string
}

interface FormErrors {
  email?: string
  password?: string
  confirmPassword?: string
  firstName?: string
  lastName?: string
  phone?: string
  general?: string
}

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "El formato del email no es válido"
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "La contraseña es requerida"
    } else if (formData.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres"
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirma tu contraseña"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden"
    }

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = "El nombre es requerido"
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = "El apellido es requerido"
    }

    // Phone validation (optional but if provided, should be valid)
    if (formData.phone && !/^\+?[\d\s\-()]+$/.test(formData.phone)) {
      newErrors.phone = "El formato del teléfono no es válido"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear specific error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const result = await authService.register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
      })

      if (result.success) {
        setIsSuccess(true)
        setSuccessMessage(result.message || "Cuenta creada exitosamente. Revisa tu email para confirmar tu cuenta.")

        // Reset form
        setFormData({
          email: "",
          password: "",
          confirmPassword: "",
          firstName: "",
          lastName: "",
          phone: "",
        })
      } else {
        setErrors({
          general: result.message || "Error al crear la cuenta",
        })
      }
    } catch (error) {
      console.error("Error en registro:", error)
      setErrors({
        general: "Error de conexión. Por favor, intenta de nuevo.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-nude/10 to-rose-pastel/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">¡Cuenta Creada!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
            <div className="space-y-2">
              <p className="text-sm text-gray-600 text-center">
                Te hemos enviado un email de confirmación. Por favor, revisa tu bandeja de entrada y haz clic en el
                enlace para activar tu cuenta.
              </p>
              <p className="text-xs text-gray-500 text-center">Si no ves el email, revisa tu carpeta de spam.</p>
            </div>
            <div className="flex flex-col space-y-2">
              <Button onClick={() => router.push("/login")} className="w-full">
                Ir al Login
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsSuccess(false)
                  setSuccessMessage("")
                }}
                className="w-full"
              >
                Crear otra cuenta
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-nude/10 to-rose-pastel/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Crear Cuenta</CardTitle>
          <CardDescription className="text-center">
            Únete a nuestra exclusiva comunidad de amantes de los bolsos de lujo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre *</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Tu nombre"
                  className={errors.firstName ? "border-red-500" : ""}
                  disabled={isLoading}
                />
                {errors.firstName && <p className="text-sm text-red-500">{errors.firstName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Tu apellido"
                  className={errors.lastName ? "border-red-500" : ""}
                  disabled={isLoading}
                />
                {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="tu@email.com"
                className={errors.email ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+1 (555) 123-4567"
                className={errors.phone ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Mínimo 6 caracteres"
                className={errors.password ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Repite tu contraseña"
                className={errors.confirmPassword ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                "Crear Cuenta"
              )}
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="text-purple-600 hover:underline">
                  Inicia sesión aquí
                </Link>
              </p>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Al crear una cuenta, aceptas nuestros{" "}
                <Link href="/legal/terms" className="text-purple-600 hover:underline">
                  Términos de Servicio
                </Link>{" "}
                y{" "}
                <Link href="/legal/privacy" className="text-purple-600 hover:underline">
                  Política de Privacidad
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

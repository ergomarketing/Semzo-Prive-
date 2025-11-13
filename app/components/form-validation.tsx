"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

interface FormState {
  email: string
  name: string
  phone?: string
}

interface FormErrors {
  email?: string
  name?: string
  phone?: string
  general?: string
}

export default function EnhancedSubscriptionForm() {
  const [formData, setFormData] = useState<FormState>({ email: "", name: "", phone: "" })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es obligatorio"
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "El nombre debe tener al menos 2 caracteres"
    }

    if (!formData.email.trim()) {
      newErrors.email = "El email es obligatorio"
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Por favor, introduce un email válido"
    }

    if (formData.phone && formData.phone.length > 0) {
      const phoneRegex = /^[+]?[\d\s\-$$$$]{9,}$/
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = "Por favor, introduce un teléfono válido"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setIsSubmitted(true)
      } else {
        const error = await response.json()
        setErrors({ general: error.message || "Error al enviar el formulario" })
      }
    } catch (error) {
      setErrors({ general: "Hubo un error al enviar el formulario. Por favor, inténtalo de nuevo." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  if (isSubmitted) {
    return (
      <div className="bg-white p-8 md:p-10 rounded-xl shadow-xl text-center border-0">
        <div className="flex justify-center mb-6">
          <CheckCircle2 className="h-16 w-16 md:h-20 md:w-20 text-green-500" />
        </div>
        <h3 className="text-2xl md:text-3xl font-bold mb-4 text-slate-800">¡Bienvenida a Semzo Privé!</h3>
        <p className="text-lg text-slate-600 mb-8 leading-relaxed">
          Hemos recibido tu solicitud correctamente. Pronto nos pondremos en contacto contigo para darte acceso
          exclusivo a nuestra colección de bolsos de lujo.
        </p>
        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <p className="text-sm text-slate-700 leading-relaxed">
            <strong>Próximos pasos:</strong>
            <br />• Recibirás un email de confirmación en los próximos minutos
            <br />• Nuestro equipo te contactará en 24-48 horas
            <br />• Te enviaremos tu kit de bienvenida exclusivo
          </p>
        </div>
        <Button
          onClick={() => {
            setIsSubmitted(false)
            setFormData({ email: "", name: "", phone: "" })
          }}
          className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-8 py-3"
        >
          Volver al formulario
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-white p-8 md:p-10 rounded-xl shadow-xl border-0">
      <div className="text-center mb-8">
        <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">Únete a la lista de espera</h3>
        <p className="text-lg text-slate-600 leading-relaxed">
          Sé la primera en acceder a nuestra exclusiva colección de bolsos de lujo
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
            <p className="text-red-700 text-sm">{errors.general}</p>
          </div>
        )}

        <div>
          <Label htmlFor="name" className="text-slate-700 font-medium text-base mb-3 block">
            Nombre completo *
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="María García"
            required
            className={`h-12 border-slate-200 focus:border-slate-400 focus:ring-slate-400 text-base ${
              errors.name ? "border-red-300 focus:border-red-400 focus:ring-red-400" : ""
            }`}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
          {errors.name && (
            <p id="name-error" className="mt-2 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="email" className="text-slate-700 font-medium text-base mb-3 block">
            Correo electrónico *
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            placeholder="maria@ejemplo.com"
            required
            className={`h-12 border-slate-200 focus:border-slate-400 focus:ring-slate-400 text-base ${
              errors.email ? "border-red-300 focus:border-red-400 focus:ring-red-400" : ""
            }`}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && (
            <p id="email-error" className="mt-2 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="phone" className="text-slate-700 font-medium text-base mb-3 block">
            Teléfono (opcional)
          </Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            placeholder="+34 600 000 000"
            className={`h-12 border-slate-200 focus:border-slate-400 focus:ring-slate-400 text-base ${
              errors.phone ? "border-red-300 focus:border-red-400 focus:ring-red-400" : ""
            }`}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "phone-error" : undefined}
          />
          {errors.phone && (
            <p id="phone-error" className="mt-2 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.phone}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-4 text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="animate-spin h-5 w-5 mr-3" />
              Enviando...
            </div>
          ) : (
            "Solicitar acceso exclusivo"
          )}
        </Button>

        <div className="bg-gray-50 p-6 rounded-lg">
          <p className="text-sm text-slate-500 text-center leading-relaxed">
            Al registrarte, aceptas nuestros{" "}
            <a href="/legal/terms" className="underline hover:text-slate-700">
              Términos y Condiciones
            </a>{" "}
            y{" "}
            <a href="/legal/privacy" className="underline hover:text-slate-700">
              Política de Privacidad
            </a>
            . Recibirás emails sobre nuestros productos y servicios.
          </p>
        </div>
      </form>
    </div>
  )
}

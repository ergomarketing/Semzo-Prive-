"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { Mail, CheckCircle2, AlertCircle, Phone } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { useAuth } from "@/app/hooks/useAuth"
import { SMSAuthModal } from "@/app/components/sms-auth-modal"

function SignupContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
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
  const [selectedBag, setSelectedBag] = useState<string | null>(null)
  const [requiresConfirmation, setRequiresConfirmation] = useState(false)
  const [showSMSModal, setShowSMSModal] = useState(false)

  useEffect(() => {
    const plan = searchParams.get("plan")
    const bag = searchParams.get("bag")
    if (plan) setSelectedPlan(plan)
    if (bag) setSelectedBag(bag)
  }, [searchParams])

  // Redirigir si el usuario ya está logueado — llevar al carrito con contexto
  useEffect(() => {
    if (!authLoading && user) {
      const plan = searchParams.get("plan")
      const bag = searchParams.get("bag")
      let redirectUrl = "/cart"
      if (plan && bag) {
        redirectUrl = `/cart?plan=${plan}&bag=${bag}`
      } else if (plan) {
        redirectUrl = `/cart?plan=${plan}`
      } else if (bag) {
        redirectUrl = `/cart?bag=${bag}`
      } else {
        redirectUrl = "/dashboard"
      }
      router.push(redirectUrl)
    }
  }, [user, authLoading, router, searchParams])

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
      // USAR ENDPOINT BACKEND en lugar de supabase.auth.signUp directo
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          plan: selectedPlan,
          bag: selectedBag,
          returnUrl: selectedPlan || selectedBag ? "/cart" : undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.error === "EMAIL_ALREADY_EXISTS") {
          setMessage({
            type: "error",
            text: "Este correo ya esta registrado. Por favor inicia sesion o usa la opcion de recuperar contraseña.",
          })
        } else {
          setMessage({ type: "error", text: result.message || "Error al crear la cuenta" })
        }
        setLoading(false)
        return
      }

      const needsConfirmation = result.requiresEmailConfirmation
      setRequiresConfirmation(needsConfirmation)

      // Guardar returnUrl SIEMPRE en localStorage (tanto si requiere confirmación como si no)
      // Si requiere confirmación: lo lee welcome/page.tsx tras confirmar el email
      // Si no requiere confirmación: lo lee auth/login tras iniciar sesión
      let returnUrl = ""
      if (selectedPlan && selectedBag) {
        returnUrl = `/cart?plan=${selectedPlan}&bag=${selectedBag}`
      } else if (selectedPlan) {
        returnUrl = `/cart?plan=${selectedPlan}`
      } else if (selectedBag) {
        returnUrl = `/cart?bag=${selectedBag}`
      }
      if (returnUrl) {
        localStorage.setItem("semzo_post_confirm_url", returnUrl)
      }

      // Si NO requiere confirmación, sincronizar profile inmediatamente
      if (!needsConfirmation) {
        try {
          await fetch("/api/sync-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              firstName: formData.firstName,
              lastName: formData.lastName,
              phone: formData.phone,
            }),
          })
        } catch (syncError) {
          // non-blocking
        }
      }

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
          let loginUrl = "/auth/login?registered=true"
          if (selectedPlan) loginUrl += `&plan=${selectedPlan}`
          if (selectedBag) loginUrl += `&bag=${selectedBag}`
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

  // Mostrar loading mientras verifica auth
  if (authLoading) {
    return (
      <div className="w-full max-w-4xl bg-white rounded-2xl p-10 shadow-2xl flex items-center justify-center">
        <p className="text-slate-600">Cargando...</p>
      </div>
    )
  }

  // Si hay usuario, el useEffect lo redirigirá
  if (user) {
    return (
      <div className="w-full max-w-4xl bg-white rounded-2xl p-10 shadow-2xl flex items-center justify-center">
        <p className="text-slate-600">Ya tienes sesion activa. Redirigiendo...</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl bg-white rounded-2xl overflow-hidden shadow-2xl">
      <div className="grid md:grid-cols-2">
        {/* Imagen lado izquierdo - igual que el LoginModal */}
        <div className="relative hidden md:block min-h-[600px]">
          <img
            src="/images/login-modal-chanel.jpg"
            alt="Bolso de lujo Semzo Prive"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute bottom-8 left-8 right-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4">
              <p className="text-sm font-medium" style={{ color: "#1a1a4b" }}>SEMZO PRIVE</p>
              <p className="text-xs text-slate-600 mt-1">Acceso exclusivo al lujo</p>
            </div>
          </div>
        </div>

        {/* Formulario lado derecho */}
        <div className="p-8 md:p-10 overflow-y-auto max-h-[90vh]">
          <div className="text-center mb-6">
            <h2 className="font-serif text-3xl font-light mb-2" style={{ color: "#1a1a4b" }}>
              Crear Cuenta
            </h2>
            <p className="text-sm text-slate-600">
              {selectedPlan ? (
                <>Plan seleccionado: <span className="font-semibold capitalize">{selectedPlan}</span></>
              ) : (
                "Únete a nuestro círculo exclusivo"
              )}
            </p>
          </div>
        <div>

        {/* Opción SMS */}
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 mb-4 border-slate-300 text-slate-700 font-serif"
          onClick={() => setShowSMSModal(true)}
        >
          <Phone className="h-4 w-4 mr-2" />
          Registrarse con SMS
        </Button>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-400">o con email</span>
          </div>
        </div>

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
            <p className="text-xs text-gray-500">Mínimo 8 caracteres, debe incluir mayúsculas, minúsculas y números</p>
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

          <Button
            type="submit"
            className="w-full h-12 rounded-lg text-sm uppercase tracking-widest font-medium"
            style={{ backgroundColor: "#1a1a4b", color: "#ffffff" }}
            disabled={loading}
          >
            {loading ? "Creando cuenta..." : "Crear Cuenta"}
          </Button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-4">
          ¿Ya tienes cuenta?{" "}
          <Link
            href={selectedPlan ? `/auth/login?plan=${selectedPlan}` : "/auth/login"}
            className="underline font-medium hover:text-slate-700"
            style={{ color: "#1a1a4b" }}
          >
            Inicia sesión
          </Link>
        </p>
        </div>
        </div>
      </div>

      <SMSAuthModal
        isOpen={showSMSModal}
        onClose={() => setShowSMSModal(false)}
        onSuccess={(user) => {
          setShowSMSModal(false)
          const cartUrl = selectedPlan || selectedBag
            ? `/cart${selectedPlan ? `?plan=${selectedPlan}` : ""}${selectedBag ? `${selectedPlan ? "&" : "?"}bag=${selectedBag}` : ""}`
            : "/dashboard"
          router.push(cartUrl)
        }}
        mode="signup"
        plan={selectedPlan ?? undefined}
        bag={selectedBag ?? undefined}
      />
    </div>
  )
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <Suspense fallback={
        <div className="w-full max-w-4xl bg-white rounded-2xl p-10 shadow-2xl flex items-center justify-center">
          <p className="text-slate-600">Cargando...</p>
        </div>
      }>
        <SignupContent />
      </Suspense>
    </div>
  )
}

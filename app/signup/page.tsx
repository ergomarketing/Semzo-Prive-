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
import { useTranslations } from "next-intl"

function SignupContent() {
  const t = useTranslations("signup")
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

    // Capturar codigo de referido si viene en la URL (?ref=MARIA2024).
    // Se guarda en localStorage para procesarlo tras el signup, incluso
    // si el usuario tiene que confirmar el email primero. El backend
    // recibe el codigo via POST a /api/referrals/track, sin modificar
    // el flujo actual de auth/pago.
    const refCode = searchParams.get("ref")
    if (refCode && typeof window !== "undefined") {
      try {
        localStorage.setItem("semzo_pending_referral", refCode.trim().toUpperCase())
      } catch {
        // localStorage puede fallar en modo privado; lo ignoramos.
      }
    }
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
      setMessage({ type: "error", text: t("errPasswordsMismatch") })
      setLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setMessage({ type: "error", text: t("errPasswordShort") })
      setLoading(false)
      return
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    if (!passwordRegex.test(formData.password)) {
      setMessage({
        type: "error",
        text: t("errPasswordWeak"),
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
            text: t("errEmailExists"),
          })
        } else {
          setMessage({ type: "error", text: result.message || t("errCreate") })
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

        // Registrar uso del codigo de referido si hay uno pendiente.
        // Solo cuando NO requiere confirmacion: en ese caso el usuario ya
        // tiene sesion activa y /api/referrals/apply puede autenticarlo.
        // Si requiere confirmacion, lo procesamos en /auth/welcome despues
        // de que el usuario confirme su email (TODO Fase 2).
        try {
          const pendingRef = localStorage.getItem("semzo_pending_referral")
          if (pendingRef) {
            // Endpoint oficial: /api/referrals/apply. El antiguo
            // /api/referrals/track sigue funcionando como alias deprecated.
            const trackRes = await fetch("/api/referrals/apply", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ referralCode: pendingRef }),
            })
            // Limpiar el codigo guardado solo si se proceso correctamente
            // o el codigo era invalido (no merece reintento). Si fue error
            // de red (no ok y sin body) lo dejamos para reintentar.
            if (trackRes.ok || trackRes.status === 400 || trackRes.status === 409) {
              localStorage.removeItem("semzo_pending_referral")
            }
          }
        } catch {
          // non-blocking — el referido se puede registrar manualmente despues
        }
      }

      if (needsConfirmation) {
        setMessage({
          type: "success",
          text: t("successConfirm"),
        })
      } else {
        setMessage({
          type: "success",
          text: t("successRedirect"),
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
      setMessage({ type: "error", text: t("errConnection") })
    } finally {
      setLoading(false)
    }
  }

  // Mostrar loading mientras verifica auth
  if (authLoading) {
    return (
      <div className="w-full max-w-4xl bg-white rounded-2xl p-10 shadow-2xl flex items-center justify-center">
        <p className="text-slate-600">{t("loading")}</p>
      </div>
    )
  }

  // Si hay usuario, el useEffect lo redirigirá
  if (user) {
    return (
      <div className="w-full max-w-4xl bg-white rounded-2xl p-10 shadow-2xl flex items-center justify-center">
        <p className="text-slate-600">{t("alreadyLogged")}</p>
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
            alt={t("imageAlt")}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute bottom-8 left-8 right-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4">
              <p className="text-sm font-medium" style={{ color: "#1a1a4b" }}>{t("badgeTitle")}</p>
              <p className="text-xs text-slate-600 mt-1">{t("badgeSubtitle")}</p>
            </div>
          </div>
        </div>

        {/* Formulario lado derecho */}
        <div className="p-8 md:p-10 overflow-y-auto max-h-[90vh]">
          <div className="text-center mb-6">
            <h2 className="font-serif text-3xl font-light mb-2" style={{ color: "#1a1a4b" }}>
              {t("title")}
            </h2>
            <p className="text-sm text-slate-600">
              {selectedPlan ? (
                <>{t("planSelected")} <span className="font-semibold capitalize">{selectedPlan}</span></>
              ) : (
                t("subtitle")
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
          {t("signupSms")}
        </Button>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-400">{t("orEmail")}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">{t("firstName")}</Label>
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
              <Label htmlFor="lastName">{t("lastName")}</Label>
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
            <Label htmlFor="email">{t("email")}</Label>
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
            <Label htmlFor="phone">{t("phone")}</Label>
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
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
            <p className="text-xs text-gray-500">{t("passwordHint")}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
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
                      <p className="text-sm font-medium text-indigo-dark mb-1">{t("checkInboxTitle")}</p>
                      <p className="text-xs text-indigo-dark">{t("checkInboxDesc")}</p>
                    </div>
                  )}
                  {message.type === "success" && !requiresConfirmation && (
                    <div className="mt-2 text-sm text-indigo-dark">{t("redirectingLogin")}</div>
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
            {loading ? t("submitting") : t("submit")}
          </Button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-4">
          {t("hasAccount")}{" "}
          <Link
            href={selectedPlan ? `/auth/login?plan=${selectedPlan}` : "/auth/login"}
            className="underline font-medium hover:text-slate-700"
            style={{ color: "#1a1a4b" }}
          >
            {t("login")}
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

function SignupFallback() {
  const t = useTranslations("signup")
  return (
    <div className="w-full max-w-4xl bg-white rounded-2xl p-10 shadow-2xl flex items-center justify-center">
      <p className="text-slate-600">{t("loading")}</p>
    </div>
  )
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <Suspense fallback={<SignupFallback />}>
        <SignupContent />
      </Suspense>
    </div>
  )
}

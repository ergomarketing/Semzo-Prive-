"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../hooks/useAuth"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Crown, Check, Loader2, Info, AlertTriangle } from "lucide-react"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

// SWR key global para toda la app
export const DASHBOARD_KEY = "/api/user/dashboard"

export default function MembresiaPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [savingEmail, setSavingEmail] = useState(false)
  const [emailInput, setEmailInput] = useState("")
  const [isPhoneEmail, setIsPhoneEmail] = useState(false) // Declare isPhoneEmail variable

  // SINGLE SOURCE OF TRUTH - NO guardias aquí, layout.tsx maneja redirects
  const { data, error, isLoading, mutate } = useSWR(user?.id ? DASHBOARD_KEY : null, fetcher)

  // Inicializar emailInput desde profile.email
  useEffect(() => {
    if (data?.profile?.email) {
      setEmailInput(data.profile.email)
    }
    setIsPhoneEmail(data?.profile?.phone_email || false)
  }, [data?.profile?.email, data?.profile?.phone_email])

  const handleSaveEmail = async () => {
    if (!emailInput) return

    setSavingEmail(true)
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        alert(errorData.error || "Error al actualizar email")
        return
      }

      // Refetch automático
      await mutate()
      alert("Email actualizado correctamente")
    } catch (error) {
      console.error("[v0] Error saving email:", error)
      alert("Error al actualizar email")
    } finally {
      setSavingEmail(false)
    }
  }

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-slate-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white pt-32">
        <div className="container mx-auto px-4 max-w-4xl">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Error al cargar tu membresía. Por favor recarga la página.</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const { profile, membership, passes, flags, gift_cards, reservations } = data

  const isActive = membership.status === "active"
  const isPetite = membership.type === "petite"

  const membershipInfo: Record<string, { name: string; price: string; period: string }> = {
    petite: { name: "Petite", price: "19,99", period: "semana" },
    essentiel: { name: "L'Essentiel", price: "59", period: "mes" },
    signature: { name: "Signature", price: "129", period: "mes" },
    prive: { name: "Privé", price: "189", period: "mes" },
    free: { name: "Free", price: "0", period: "mes" },
  }

  const currentMembership = membershipInfo[membership.type] || membershipInfo.free

  const petiteFeatures = [
    "1 bolso por semana",
    "Renovación flexible",
    "Ampliable hasta 3 meses",
    "Envío gratuito",
    "Seguro incluido",
    "Pases de Bolso disponibles para colecciones premium",
  ]

  const priveFeatures = [
    "Acceso completo al catálogo exclusivo",
    "Reservas prioritarias",
    "Lista de espera ilimitada",
    "Envío gratuito",
    "Soporte prioritario 24/7",
    "Acceso anticipado a nuevas colecciones",
    "Eventos exclusivos para miembros",
  ]

  const freeFeatures = [
    "Acceso básico al catálogo",
    "Ver bolsos disponibles",
    "Lista de espera limitada",
    "Soporte por email",
  ]

  const getFeatures = () => {
    if (isPetite) return petiteFeatures
    if (isActive) return priveFeatures
    return freeFeatures
  }

  return (
    <div className="min-h-screen bg-white pt-32">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-serif text-indigo-dark mb-8 text-center">MI MEMBRESÍA</h1>

        {/* Email Requirement Alert */}
        {flags.needs_email && (
          <Alert variant="default" className="mb-6 border-amber-500 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Email requerido:</strong> Necesitamos tu email real para confirmar reservas y notificaciones.
            </AlertDescription>
          </Alert>
        )}

        {/* Profile Section */}
        <Card className="mb-6 border border-indigo-dark/10 shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-serif text-lg text-indigo-dark mb-4">Información Personal</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-indigo-dark/70 text-sm">Nombre</Label>
                  <p className="text-indigo-dark font-medium">{profile.first_name}</p>
                </div>
                <div>
                  <Label className="text-indigo-dark/70 text-sm">Apellido</Label>
                  <p className="text-indigo-dark font-medium">{profile.last_name}</p>
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="text-indigo-dark/70 text-sm">
                  Email
                </Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="email"
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    disabled={!flags.needs_email}
                    className="flex-1"
                    placeholder="tu@email.com"
                  />
                  {flags.needs_email && (
                    <Button onClick={handleSaveEmail} disabled={savingEmail || !emailInput}>
                      {savingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
                    </Button>
                  )}
                </div>
                {flags.needs_email && (
                  <p className="text-sm text-amber-600 mt-1">Debes completar tu email para poder reservar</p>
                )}
              </div>

              <div>
                <Label className="text-indigo-dark/70 text-sm">Teléfono</Label>
                <p className="text-indigo-dark font-medium">{profile.phone}</p>
                <p className="text-xs text-indigo-dark/60 mt-1">El teléfono no se puede cambiar (registrado con SMS)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Membership Section */}
        <Card className="mb-6 border border-indigo-dark/10 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-6 mb-6">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {isActive && <Crown className="w-6 h-6 text-indigo-dark" />}
                    <h2 className="font-serif text-2xl text-indigo-dark">{currentMembership.name}</h2>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs rounded-full ${
                      isActive
                        ? "bg-rose-nude border border-rose-pastel/30 text-indigo-dark"
                        : "bg-indigo-dark/5 text-indigo-dark/60"
                    }`}
                  >
                    {isActive ? "Activa" : "Inactiva"}
                  </span>
                </div>
                <p className="font-serif text-3xl text-indigo-dark mb-6">
                  €{currentMembership.price}
                  <span className="text-lg text-indigo-dark/60">/{currentMembership.period}</span>
                </p>

                <ul className="space-y-3 mb-6">
                  {getFeatures().map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-indigo-dark mt-0.5 flex-shrink-0" />
                      <span className="text-indigo-dark/70">{feature}</span>
                    </li>
                  ))}
                </ul>

                {isActive && membership.ends_at && (
                  <div className="bg-rose-nude border border-rose-pastel/30 p-4 rounded-lg mb-4">
                    <p className="text-sm text-indigo-dark">
                      <strong>Miembro desde:</strong>{" "}
                      {new Date(membership.started_at).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    {isPetite && (
                      <>
                        <p className="text-sm text-indigo-dark mt-2">
                          <strong>Válida hasta:</strong>{" "}
                          {new Date(membership.ends_at).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-sm text-indigo-dark mt-2">
                          <strong>Pases usados:</strong> {membership.petite_passes_used} de{" "}
                          {membership.petite_passes_max}
                        </p>
                      </>
                    )}
                  </div>
                )}

                {isPetite && isActive && (
                  <div className="bg-rose-nude border border-rose-pastel/30 p-4 rounded-lg mb-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-indigo-dark flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-indigo-dark mb-2">Pases de Bolso Disponibles</h4>
                        <p className="text-sm text-indigo-dark/70 mb-3">
                          Con tu membresía Petite, puedes acceder a bolsos de colecciones premium comprando pases
                          individuales:
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-white p-2 rounded-lg text-center border border-indigo-dark/10">
                            <p className="text-xs text-indigo-dark/60 mb-1">L'Essentiel</p>
                            <p className="font-medium text-indigo-dark text-lg">52€</p>
                            <p className="text-xs text-indigo-dark/60 mt-1">por semana</p>
                          </div>
                          <div className="bg-white p-2 rounded-lg text-center border border-indigo-dark/10">
                            <p className="text-xs text-indigo-dark/60 mb-1">Signature</p>
                            <p className="font-medium text-indigo-dark text-lg">99€</p>
                            <p className="text-xs text-indigo-dark/60 mt-1">por semana</p>
                          </div>
                          <div className="bg-white p-2 rounded-lg text-center border border-indigo-dark/10">
                            <p className="text-xs text-indigo-dark/60 mb-1">Privé</p>
                            <p className="font-medium text-indigo-dark text-lg">137€</p>
                            <p className="text-xs text-indigo-dark/60 mt-1">por semana</p>
                          </div>
                        </div>
                        <p className="text-sm text-indigo-dark/70 mt-3 mb-3">
                          <strong>Pases actuales:</strong> {passes.available} disponible{passes.available !== 1 ? "s" : ""}
                        </p>
                        <Button
                          onClick={() => router.push("/catalog")}
                          className="w-full bg-indigo-dark hover:bg-indigo-dark/90 text-white"
                        >
                          Comprar Pase y Explorar Catálogo
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {!isActive && (
                  <Button
                    onClick={() => router.push("/membership/upgrade")}
                    className="w-full bg-indigo-dark hover:bg-indigo-dark/90 text-white"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Activar Membresía
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gift Cards Section */}
        {gift_cards.total_balance > 0 && (
          <Card className="mb-6 border border-indigo-dark/10 shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-serif text-lg text-indigo-dark mb-4">Saldo Gift Cards</h3>
              <div className="bg-rose-nude border border-rose-pastel/30 p-4 rounded-lg">
                <p className="text-2xl font-medium text-indigo-dark">{gift_cards.total_balance.toFixed(2)}€</p>
                <p className="text-sm text-indigo-dark/70 mt-1">Saldo total disponible</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Historial de Pagos */}
        <Card className="border border-indigo-dark/10 shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-serif text-lg text-indigo-dark mb-4">Historial de Pagos</h3>
            {reservations.history === 0 ? (
              <p className="text-sm text-indigo-dark/60 bg-rose-nude border border-rose-pastel/30 p-4 rounded-lg">
                No hay pagos registrados
              </p>
            ) : (
              <p className="text-sm text-indigo-dark/60">Ver historial completo en tu perfil</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

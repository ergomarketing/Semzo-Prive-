"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../hooks/useAuth"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Crown, Check, Loader2, Info, AlertTriangle, PauseCircle, XCircle, PlayCircle } from "lucide-react"
import useSWR from "swr"
import { toast } from "sonner"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

// SWR key global para toda la app
export const DASHBOARD_KEY = "/api/user/dashboard"

export default function MembresiaPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [savingEmail, setSavingEmail] = useState(false)
  const [emailInput, setEmailInput] = useState("")
  const [isPhoneEmail, setIsPhoneEmail] = useState(false)
  const [actionLoading, setActionLoading] = useState<"pause" | "resume" | "cancel" | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

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

  const handleMembershipAction = async (action: "pause" | "resume" | "cancel") => {
    setActionLoading(action)
    try {
      const res = await fetch(`/api/memberships/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: membership?.stripe_subscription_id ?? null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await mutate()
      if (action === "pause") toast.success("Membresía pausada correctamente")
      if (action === "resume") toast.success("Membresía reanudada correctamente")
      if (action === "cancel") toast.success(`Membresía cancelada. Acceso hasta: ${data.cancelDate}`)
      setShowCancelConfirm(false)
    } catch (err: any) {
      toast.error(err.message || "Error al realizar la acción")
    } finally {
      setActionLoading(null)
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

  const uiStatus: string = membership?.ui_status || "inactive"
  const isActive = uiStatus === "active"
  const isCancelledActive = uiStatus === "cancelled_active"
  const isPetite = membership.type === "petite"
  const isQuarterly = membership.billing_cycle === "quarterly"
  // Tiene acceso efectivo (puede usar la app aunque esté cancelando)
  const hasAccess = membership?.has_effective_access === true

  const membershipInfo: Record<string, { name: string; price: string; period: string }> = {
    petite: { name: "Petite", price: "19,99", period: "mes" },
    essentiel: { name: "L'Essentiel", price: isQuarterly ? "142" : "59", period: isQuarterly ? "trimestre" : "mes" },
    signature: { name: "Signature", price: isQuarterly ? "357" : "149", period: isQuarterly ? "trimestre" : "mes" },
    prive: { name: "Privé", price: isQuarterly ? "669" : "279", period: isQuarterly ? "trimestre" : "mes" },
    free: { name: "Free", price: "0", period: "mes" },
  }

  const currentMembership = membershipInfo[membership.type] || membershipInfo.free

  // Etiquetas de duración para mostrar al usuario
  const cycleDurationDays = isPetite ? 30 : isQuarterly ? 90 : 30
  const bagDurationDays = isPetite ? 7 : 30
  const maxBagsPerCycle = isPetite ? 4 : isQuarterly ? 3 : 1

  const formatLongDate = (d: string | null | undefined) => {
    if (!d) return "—"
    return new Date(d).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
  }

  const petiteFeatures = [
    "Hasta 4 bolsos al mes",
    "7 días por bolso (alquiler semanal con pase)",
    "El conteo empieza al recibir el bolso",
    "Envío y devolución gratuitos",
    "Seguro incluido",
    "Pago mensual recurrente",
  ]

  const essentielFeatures = [
    `1 bolso por mes (30 días por bolso)${isQuarterly ? " · 3 bolsos en total" : ""}`,
    "El conteo de 30 días empieza al recibir el bolso",
    "Acceso a la colección L'Essentiel",
    "Envío y devolución gratuitos",
    "Seguro incluido",
  ]

  const signatureFeatures = [
    `1 bolso por mes (30 días por bolso)${isQuarterly ? " · 3 bolsos en total" : ""}`,
    "El conteo de 30 días empieza al recibir el bolso",
    "Acceso a Signature + L'Essentiel",
    "Reservas prioritarias",
    "Envío y devolución gratuitos",
    "Seguro incluido",
  ]

  const priveFeatures = [
    `1 bolso por mes (30 días por bolso)${isQuarterly ? " · 3 bolsos en total" : ""}`,
    "El conteo de 30 días empieza al recibir el bolso",
    "Acceso completo al catálogo (Privé + Signature + L'Essentiel)",
    "Reservas prioritarias",
    "Lista de espera ilimitada",
    "Envío y devolución gratuitos",
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
    if (membership.type === "prive") return priveFeatures
    if (membership.type === "signature") return signatureFeatures
    if (membership.type === "essentiel" || membership.type === "lessentiel") return essentielFeatures
    return freeFeatures
  }

  return (
    <div className="min-h-screen bg-white pt-32">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-serif text-indigo-dark mb-8 text-center">MI MEMBRESÍA</h1>

        {/*
         * Avisos del dashboard — TODOS alineados a paleta Semzo:
         *   fondo  rose-nude   (#fff0f3)
         *   borde  rose-pastel (#f4c4cc)
         *   texto  indigo-dark (#1a1a4b)
         * Antes usaban amber/yellow default de shadcn que rompían la identidad.
         */}
        {flags.needs_email && (
          <Alert variant="default" className="mb-6 border-rose-pastel bg-rose-nude">
            <AlertTriangle className="h-4 w-4 text-indigo-dark" />
            <AlertDescription className="text-indigo-dark">
              <strong>Email requerido:</strong> Necesitamos tu email real para confirmar reservas y notificaciones.
            </AlertDescription>
          </Alert>
        )}

        {/* Banner: cancelada con acceso vigente */}
        {isCancelledActive && (membership.end_date || membership.ends_at) && (
          <Alert className="mb-6 bg-rose-nude border-rose-pastel">
            <AlertTriangle className="h-4 w-4 text-indigo-dark" />
            <AlertDescription className="text-indigo-dark">
              <strong>Tu membresía está cancelada.</strong> Conservas acceso completo hasta el{" "}
              <strong>{formatLongDate(membership.end_date || membership.ends_at)}</strong>. Después
              dejarás de tener acceso. Si cambias de opinión, puedes reactivarla en cualquier momento.
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
                  <p className="text-sm text-indigo-dark/80 mt-1">Debes completar tu email para poder reservar</p>
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
                  {/*
                   * Badge de estado — unificado a paleta Semzo.
                   * Diferenciamos visualmente cada estado usando opacidad
                   * y bordes en lugar de cambiar de familia cromática:
                   *  active           → rose-nude + borde rose-pastel
                   *  cancelled_active → rose-nude + borde rose-pastel/60 (mas sutil)
                   *  paused           → indigo-dark/5 (gris neutro de marca)
                   *  past_due         → rose-pastel/40 (rose mas intenso, aviso)
                   *  otros            → indigo-dark/5
                   */}
                  <span
                    className={`px-3 py-1 text-xs rounded-full ${
                      isActive
                        ? "bg-rose-nude border border-rose-pastel/30 text-indigo-dark"
                        : isCancelledActive
                          ? "bg-rose-nude border border-rose-pastel/60 text-indigo-dark"
                          : uiStatus === "paused"
                            ? "bg-indigo-dark/5 border border-indigo-dark/15 text-indigo-dark"
                            : uiStatus === "past_due"
                              ? "bg-rose-pastel/40 border border-rose-pastel text-indigo-dark"
                              : "bg-indigo-dark/5 text-indigo-dark/60"
                    }`}
                  >
                    {isActive
                      ? isQuarterly
                        ? "Activa · Trimestral"
                        : isPetite
                          ? "Activa · Petite"
                          : "Activa · Mensual"
                      : isCancelledActive
                        ? "Cancelada (acceso vigente)"
                        : uiStatus === "paused"
                          ? "Pausada"
                          : uiStatus === "past_due"
                            ? "Pago pendiente"
                            : uiStatus === "expired"
                              ? "Expirada"
                              : "Inactiva"}
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

                {/* Bloque "Periodo de Membresía" — visible para todos los planes
                    con acceso (active o cancelled_active). Aclara la diferencia
                    entre tiempo de membresía y tiempo de reserva del bolso. */}
                {hasAccess && (
                  <div className="bg-rose-nude border border-rose-pastel/30 p-4 rounded-lg mb-4">
                    <h4 className="font-medium text-indigo-dark mb-3 flex items-center gap-2">
                      <Crown className="w-4 h-4" />
                      Periodo de Membresía
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-indigo-dark/60">Tipo</p>
                        <p className="text-indigo-dark font-medium">
                          {isPetite
                            ? "Petite (mensual)"
                            : isQuarterly
                              ? "Trimestral (90 días)"
                              : "Mensual (30 días)"}
                        </p>
                      </div>
                      <div>
                        <p className="text-indigo-dark/60">Estado</p>
                        <p className="text-indigo-dark font-medium">
                          {isCancelledActive ? "Cancelada · acceso vigente" : "Activa"}
                        </p>
                      </div>
                      <div>
                        <p className="text-indigo-dark/60">Inicio del ciclo</p>
                        <p className="text-indigo-dark font-medium">
                          {formatLongDate(membership.start_date || membership.started_at)}
                        </p>
                      </div>
                      <div>
                        <p className="text-indigo-dark/60">
                          {isCancelledActive
                            ? "Fin de acceso"
                            : isQuarterly
                              ? "Fin del trimestre"
                              : "Próxima renovación"}
                        </p>
                        <p className="text-indigo-dark font-medium">
                          {formatLongDate(membership.end_date || membership.ends_at)}
                        </p>
                      </div>
                    </div>

                    {/* Aclaración importante: tiempo membresía vs tiempo reserva */}
                    <div className="mt-4 pt-4 border-t border-rose-pastel/40">
                      <p className="text-xs text-indigo-dark/70 leading-relaxed">
                        <strong className="text-indigo-dark">¿Cómo funciona?</strong> Tu membresía dura{" "}
                        <strong>{cycleDurationDays} días</strong> y te permite reservar{" "}
                        <strong>
                          {maxBagsPerCycle === 1
                            ? "1 bolso"
                            : `hasta ${maxBagsPerCycle} bolsos`}
                        </strong>
                        {isPetite ? " al mes" : isQuarterly ? " durante el trimestre (1 al mes)" : " este mes"}.
                        Cada reserva tiene una duración de{" "}
                        <strong>{bagDurationDays} días</strong> que empiezan a contar{" "}
                        <strong>desde el día en que recibes el bolso</strong>, no desde que haces la reserva.
                      </p>
                    </div>
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

                {/* Controles de suscripción */}
                {isActive && (
                  <div className="mt-4 space-y-2">
                    <Button
                      variant="outline"
                      onClick={() => handleMembershipAction("pause")}
                      disabled={!!actionLoading}
                      className="w-full border-indigo-dark/20 text-indigo-dark hover:bg-rose-nude"
                    >
                      {actionLoading === "pause" ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <PauseCircle className="h-4 w-4 mr-2" />
                      )}
                      Pausar membresía
                    </Button>

                    {!showCancelConfirm ? (
                      <Button
                        variant="outline"
                        onClick={() => setShowCancelConfirm(true)}
                        disabled={!!actionLoading}
                        className="w-full border-indigo-dark/20 text-indigo-dark hover:bg-rose-nude"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancelar membresía
                      </Button>
                    ) : (
                      <div className="border border-indigo-dark/20 rounded-lg p-4 bg-rose-nude/30 space-y-3">
                        <p className="text-sm text-indigo-dark font-medium">
                          ¿Segura que quieres cancelar? Mantendrás el acceso hasta el final del período actual.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleMembershipAction("cancel")}
                            disabled={!!actionLoading}
                            className="flex-1 bg-indigo-dark hover:bg-indigo-dark/90 text-white text-sm"
                          >
                            {actionLoading === "cancel" ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : null}
                            Sí, cancelar
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowCancelConfirm(false)}
                            disabled={!!actionLoading}
                            className="flex-1 text-sm"
                          >
                            Mantener
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Reanudar si está pausada */}
                {membership.status === "paused" && (
                  <div className="mt-4">
                  <div className="bg-rose-nude border border-rose-pastel rounded-lg p-3 mb-3">
                    <p className="text-sm text-indigo-dark">Tu membresía está pausada. No se realizarán cobros hasta que la reanudes.</p>
                  </div>
                    <Button
                      onClick={() => handleMembershipAction("resume")}
                      disabled={!!actionLoading}
                      className="w-full bg-indigo-dark hover:bg-indigo-dark/90 text-white"
                    >
                      {actionLoading === "resume" ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <PlayCircle className="h-4 w-4 mr-2" />
                      )}
                      Reanudar membresía
                    </Button>
                  </div>
                )}

                {!isActive && membership.status !== "paused" && (
                  <Button
                    onClick={() => router.push("/#membresias")}
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

"use client"

import { AccountUpgradeModal } from "@/components/account-upgrade-modal"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordSettings } from "@/components/password-settings"
import { createClient } from "@/lib/supabase"
import { AlertCircle, CheckCircle, Edit, Loader2, Mail, Pencil, Phone, Save } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useAuth } from "../../hooks/useAuth"
import { supabase } from "@/lib/supabase" // Import supabase

interface UserProfile {
  first_name: string
  last_name: string
  full_name: string
  email: string
  phone: string
}

export default function PerfilPage() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  
  const [profile, setProfile] = useState<UserProfile>({
    first_name: "",
    last_name: "",
    full_name: "",
    email: "",
    phone: "",
  })
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [needsUpgrade, setNeedsUpgrade] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return

      try {
        console.log("[Profile] User data:", {
          id: user.id,
          email: user.email,
          phone: user.phone,
          metadata: user.user_metadata,
        })

        const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

        if (error) {
          console.error("[Profile] Error fetching profile:", error)
        }

        if (data) {
          setProfile({
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            full_name: data.full_name || "",
            email: data.email || user.email || "",
            phone: data.phone || user.phone || "",
          })
        } else {
          // Si no existe perfil, usar datos del auth
          setProfile({
            first_name: user.user_metadata?.first_name || "",
            last_name: user.user_metadata?.last_name || "",
            full_name: user.user_metadata?.full_name || "",
            email: user.email || "",
            phone: user.phone || "",
          })
        }
      } catch (error) {
        console.error("[Profile] Error:", error)
        setErrorMessage("Error al cargar el perfil")
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  // Detectar si el usuario necesita agregar email
  const needsEmail = () => {
    if (!user) return false

    // Check both auth user email AND profile email
    const authEmail = user.email || ""
    const profileEmailValue = profile.email || ""

    // Si no tiene email en ningún lado
    if ((!authEmail || authEmail.trim() === "") && (!profileEmailValue || profileEmailValue.trim() === "")) {
      console.log("[Profile] User has no email (SMS login)")
      return true
    }

    // Si tiene email temporal en auth o profile
    const authIsTemp = isTemporaryEmail(authEmail)
    const profileIsTemp = isTemporaryEmail(profileEmailValue)
    console.log("[Profile] Email check:", { authEmail, profileEmailValue, authIsTemp, profileIsTemp })

    return authIsTemp || profileIsTemp
  }

  const isTemporaryEmail = (email: string) => {
    if (!email) return false
    return (
      email.includes("@phone.semzoprive.com") ||
      email.includes("@temp.semzoprive.com") ||
      email.includes("@sms.semzoprive.com")
    )
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSave = async () => {
    if (!user) return

    if (!profile.first_name || !profile.last_name) {
      setErrorMessage("Nombre y apellido son obligatorios")
      return
    }

    // Si el usuario necesita upgrade (registrado por SMS), mostrar modal
    const userCurrentEmail = user.email || ""
    const isAddingEmail = !userCurrentEmail || userCurrentEmail.trim() === ""
    const isChangingFromTempEmail =
      !isAddingEmail && isTemporaryEmail(userCurrentEmail) && !isTemporaryEmail(profile.email || "")

    if (isAddingEmail || isChangingFromTempEmail) {
      console.log("[Profile] User needs account upgrade - showing modal")
      setShowUpgradeModal(true)
      return
    }

    // Usuario ya tiene email/password configurado - solo actualizar perfil
    setSaving(true)
    try {
      const full_name = `${profile.first_name} ${profile.last_name}`.trim()

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          full_name: full_name,
          phone: profile.phone,
          updated_at: new Date().toISOString(),
        })
        .select()

      if (profileError) {
        throw new Error(`Error al guardar el perfil: ${profileError.message}`)
      }

      setIsEditing(false)
      setSuccessMessage("Perfil actualizado correctamente")
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (error) {
      console.error("[Profile] Error saving profile:", error)
      setErrorMessage(error instanceof Error ? error.message : "Error al guardar los cambios")
    } finally {
      setSaving(false)
    }
  }

  const handleUpgradeSuccess = () => {
    setShowUpgradeModal(false)
    setSuccessMessage("Cuenta actualizada correctamente. Ya puedes iniciar sesión con email y contraseña.")
    setTimeout(() => {
      window.location.reload()
    }, 2000)
  }

  const saveProfile = async () => {
    if (!profile.email || profile.email.trim() === "") {
      setErrorMessage("El email es obligatorio")
      return
    }

    if (!validateEmail(profile.email)) {
      setErrorMessage("El formato del email no es válido")
      return
    }

    setSaving(true)
    try {
      const userCurrentEmail = user.email || ""
      const isAddingEmail = !userCurrentEmail || userCurrentEmail.trim() === ""
      const isChangingFromTempEmail =
        !isAddingEmail && isTemporaryEmail(userCurrentEmail) && !isTemporaryEmail(profile.email)
      const full_name = `${profile.first_name} ${profile.last_name}`.trim()

      console.log("[Profile] Save operation:", {
        userCurrentEmail,
        newEmail: profile.email,
        isAddingEmail,
        isChangingFromTempEmail,
      })

      // 1. Actualizar email en Supabase Auth si está agregando o cambiando de temporal
      if (isAddingEmail || isChangingFromTempEmail) {
        console.log("[Profile] Updating email in Supabase Auth")

        const { error: authError } = await supabase.auth.updateUser({
          email: profile.email,
          data: {
            first_name: profile.first_name,
            last_name: profile.last_name,
            full_name: full_name,
            phone: profile.phone,
          },
        })

        if (authError) {
          console.error("[Profile] Error updating auth email:", authError)

          // Manejar errores específicos
          if (authError.message.includes("already registered") || authError.message.includes("already exists")) {
            throw new Error("Este email ya está registrado en otra cuenta")
          }

          throw new Error(`Error al actualizar el email: ${authError.message}`)
        }

        console.log("[Profile] Auth email updated successfully")
      }

      // 2. Actualizar o crear perfil en la tabla profiles
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          full_name: full_name,
          email: profile.email,
          phone: profile.phone,
          updated_at: new Date().toISOString(),
        })
        .select()

      if (profileError) {
        console.error("[Profile] Error updating profile:", profileError)
        throw new Error(`Error al guardar el perfil: ${profileError.message}`)
      }

      console.log("[Profile] Profile updated successfully")

      setIsEditing(false)

      if (isAddingEmail || isChangingFromTempEmail) {
        setSuccessMessage(
          "¡Email actualizado! IMPORTANTE: Ahora debes establecer una contraseña abajo para poder iniciar sesión con email.",
        )
        
        // Scroll hacia el componente de contraseña
        setTimeout(() => {
          const passwordSection = document.querySelector('[data-password-section]')
          if (passwordSection) {
            passwordSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 500)
      } else {
        setSuccessMessage("Perfil actualizado correctamente")
      }

      // Limpiar mensaje después de 10 segundos
      setTimeout(() => setSuccessMessage(null), 10000)
    } catch (error) {
      console.error("[Profile] Error saving profile:", error)
      setErrorMessage(error instanceof Error ? error.message : "Error al guardar los cambios")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-slate-600" />
      </div>
    )
  }

  const canEditEmail = needsEmail()

  return (
    <>
      {showUpgradeModal && (
        <AccountUpgradeModal
          currentPhone={profile.phone}
          onSuccess={handleUpgradeSuccess}
          onCancel={() => setShowUpgradeModal(false)}
        />
      )}

      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-serif text-slate-900 mb-2">Mi Perfil</h2>
          <p className="text-slate-600">Gestiona tu información personal</p>
        </div>

        {/* Mensajes de éxito/error */}
        {successMessage && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900">{successMessage}</AlertDescription>
          </Alert>
        )}

        {errorMessage && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-900">{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Alerta de email faltante o temporal */}
        {canEditEmail && !isEditing && (
          <Alert className="mb-6 border-rose-200 bg-rose-50">
            <Mail className="h-4 w-4 text-rose-700" />
            <AlertDescription className="text-rose-900">
              {!user?.email || user.email.trim() === "" ? (
                <>
                  <strong>Email no configurado:</strong> Registraste tu cuenta con teléfono. Por favor, agrega tu email
                  para recibir notificaciones, confirmaciones de reserva y poder recuperar tu cuenta.
                </>
              ) : (
                <>
                  <strong>Email temporal detectado:</strong> Tienes un email temporal. Por favor, actualízalo a tu email
                  real para recibir notificaciones y confirmaciones.
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Información de método de registro */}
        {user?.phone && (!user?.email || user.email.trim() === "") && !isEditing && (
          <Alert className="mb-6 border-slate-200 bg-slate-50">
            <Phone className="h-4 w-4 text-slate-700" />
            <AlertDescription className="text-slate-900">
              <strong>Registrado con teléfono:</strong> {user.phone}
              <br />
              <span className="text-sm">Agrega tu email para mejorar la seguridad de tu cuenta</span>
            </AlertDescription>
          </Alert>
        )}

        {/* Gestión de Contraseña */}
        <div className="mb-6" data-password-section>
          <PasswordSettings hasPassword={!!user?.user_metadata?.has_password} />
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <h2 className="font-serif">Información Personal</h2>
              <p>Tu información de contacto y datos personales</p>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} size="sm" variant="outline">
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                Editar
              </Button>
            )}
          </CardHeader>
          <div className="p-6">
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">
                      Nombre <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="first_name"
                      value={profile.first_name}
                      onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                      placeholder="María"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">
                      Apellido <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="last_name"
                      value={profile.last_name}
                      onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                      placeholder="García"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    disabled={!canEditEmail}
                    className={!canEditEmail ? "bg-slate-50" : ""}
                    placeholder="tu@email.com"
                  />
                  {canEditEmail && (
                    <p className="text-xs text-rose-700 mt-1 flex items-center gap-1">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12" y2="12"></line><line x1="8" y1="12" x2="12" y2="12"></line><line x1="16" y1="12" x2="12" y2="12"></line></svg>
                      {!user?.email || user.email.trim() === "" ? (
                        <strong>Agrega tu email para recibir notificaciones y confirmaciones</strong>
                      ) : (
                        <strong>Actualiza tu email temporal a uno real</strong>
                      )}
                    </p>
                  )}
                  {!canEditEmail && (
                    <p className="text-xs text-slate-500 mt-1">El email no se puede cambiar una vez establecido</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+34 600 000 000"
                    disabled={!!user?.phone}
                    className={user?.phone ? "bg-slate-50" : ""}
                  />
                  {user?.phone && (
                    <p className="text-xs text-slate-500 mt-1">El teléfono no se puede cambiar (registrado con SMS)</p>
                  )}
                </div>
                <div className="flex space-x-2 pt-2">
                  <Button onClick={saveProfile} disabled={saving} className="bg-slate-900 hover:bg-slate-800 font-serif">
                    {saving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path></svg>}
                    {saving ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditing(false)
                      setErrorMessage(null)
                    }}
                    variant="outline"
                    disabled={saving}
                  >
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-600">Nombre</Label>
                    <p className="text-lg font-medium text-slate-900">{profile.first_name || "No especificado"}</p>
                  </div>
                  <div>
                    <Label className="text-slate-600">Apellido</Label>
                    <p className="text-lg font-medium text-slate-900">{profile.last_name || "No especificado"}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-slate-600">Email</Label>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-medium text-slate-900">
                      {profile.email || (
                        <span className="text-slate-400 italic">No configurado - Haz clic en Editar para agregar</span>
                      )}
                    </p>
                    {profile.email && canEditEmail && (
                      <span className="text-xs bg-rose-100 text-rose-800 px-2 py-1 rounded font-medium">
                        {!profile.email || profile.email.trim() === "" || !user?.email || user.email.trim() === ""
                          ? "Sin email"
                          : "Temporal"}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-slate-600">Teléfono</Label>
                  <p className="text-lg font-medium text-slate-900">{profile.phone || "No especificado"}</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  )
}

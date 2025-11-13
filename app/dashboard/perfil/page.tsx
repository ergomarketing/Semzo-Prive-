"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../../hooks/useAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Edit, Save, X, CheckCircle, AlertCircle } from "lucide-react"
import { supabase } from "../../lib/supabaseClient"

interface UserProfile {
  first_name: string
  last_name: string
  full_name: string
  email: string
  phone: string
}

export default function PerfilPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile>({
    first_name: "",
    last_name: "",
    full_name: "",
    email: "",
    phone: "",
  })
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

        if (error) throw error

        if (data) {
          setProfile({
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            full_name: data.full_name || "",
            email: data.email || user.email || "",
            phone: data.phone || "",
          })
        } else {
          // Si no existe perfil, crear uno con datos del auth
          setProfile({
            first_name: user.user_metadata?.first_name || "",
            last_name: user.user_metadata?.last_name || "",
            full_name: user.user_metadata?.full_name || "",
            email: user.email || "",
            phone: user.user_metadata?.phone || "",
          })
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
        setErrorMessage("Error al cargar el perfil")
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  const isTemporaryEmail = (email: string) => {
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

    // Limpiar mensajes anteriores
    setSuccessMessage(null)
    setErrorMessage(null)

    // Validaciones
    if (!profile.first_name || !profile.last_name) {
      setErrorMessage("El nombre y apellido son obligatorios")
      return
    }

    if (!profile.email) {
      setErrorMessage("El email es obligatorio")
      return
    }

    if (!validateEmail(profile.email)) {
      setErrorMessage("El formato del email no es válido")
      return
    }

    setSaving(true)
    try {
      const isChangingFromTempEmail = isTemporaryEmail(user.email || "") && !isTemporaryEmail(profile.email)
      const full_name = `${profile.first_name} ${profile.last_name}`.trim()

      // 1. Actualizar email en Supabase Auth si está cambiando de email temporal a real
      if (isChangingFromTempEmail) {
        console.log("[Profile] Updating email in Supabase Auth from temporary to real")
        
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
      
      if (isChangingFromTempEmail) {
        setSuccessMessage(
          "Perfil actualizado. Se ha enviado un email de confirmación a tu nueva dirección. Por favor, verifica tu bandeja de entrada."
        )
      } else {
        setSuccessMessage("Perfil actualizado correctamente")
      }

      // Limpiar mensaje después de 5 segundos
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (error) {
      console.error("Error saving profile:", error)
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

  const canEditEmail = isTemporaryEmail(profile.email)

  return (
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

      {/* Alerta de email temporal */}
      {canEditEmail && !isEditing && (
        <Alert className="mb-6 border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900">
            <strong>Email temporal detectado:</strong> Tienes un email temporal. Por favor, actualízalo a tu email
            real para recibir notificaciones y confirmaciones.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-serif">Información Personal</CardTitle>
            <CardDescription>Tu información de contacto y datos personales</CardDescription>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} size="sm" variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
        </CardHeader>
        <CardContent>
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
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ <strong>Actualiza tu email temporal a uno real</strong> para recibir notificaciones
                  </p>
                )}
                {!canEditEmail && (
                  <p className="text-xs text-slate-500 mt-1">
                    El email no se puede cambiar una vez establecido
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+34 600 000 000"
                />
              </div>
              <div className="flex space-x-2 pt-2">
                <Button onClick={handleSave} disabled={saving} className="bg-slate-900 hover:bg-slate-800 font-serif">
                  {saving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
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
                  <X className="h-4 w-4 mr-2" />
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
                  <p className="text-lg font-medium text-slate-900">{profile.email}</p>
                  {canEditEmail && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">Temporal</span>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-slate-600">Teléfono</Label>
                <p className="text-lg font-medium text-slate-900">{profile.phone || "No especificado"}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

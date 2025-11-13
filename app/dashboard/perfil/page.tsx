"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../../hooks/useAuth"
import { useSupabase } from "../../hooks/useSupabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, Edit, Save, X, CheckCircle, Info } from "lucide-react"

interface UserProfile {
  first_name: string
  last_name: string
  email: string
  phone: string
}

export default function PerfilPage() {
  const { user } = useAuth()
  const supabase = useSupabase()
  const [profile, setProfile] = useState<UserProfile>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  })
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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
            email: data.email || user.email || "",
            phone: data.phone || "",
          })
        } else {
          setProfile({
            first_name: user.user_metadata?.first_name || "",
            last_name: user.user_metadata?.last_name || "",
            email: user.email || "",
            phone: user.user_metadata?.phone || "",
          })
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user, supabase])

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    try {
      const emailChanged = profile.email !== user.email && isEmailTemporary(user.email || "")
      if (emailChanged) {
        const { error: authError } = await supabase.auth.updateUser({
          email: profile.email,
        })
        if (authError) {
          console.error("Error updating auth email:", authError)
          alert("Error al actualizar el email. Verifica que sea válido y no esté en uso.")
          setSaving(false)
          return
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email,
          phone: profile.phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) {
        console.error("Error saving profile:", error)
        throw error
      }

      if (emailChanged) {
        alert(
          "Perfil guardado. Hemos enviado un email de confirmación a tu nueva dirección. Por favor, verifica tu bandeja de entrada.",
        )
      }

      setIsEditing(false)
    } catch (error) {
      console.error("Error saving profile:", error)
      alert("Error al guardar el perfil. Por favor, intenta de nuevo.")
    } finally {
      setSaving(false)
    }
  }

  const isEmailTemporary = (email: string) => {
    return (
      !email ||
      email.includes("@phone.semzoprive.com") ||
      email.includes("@temp.semzoprive.com") ||
      email === "tu@email.com"
    )
  }

  const isEmailVerified = (email: string) => {
    return email && !isEmailTemporary(email)
  }

  const isPhoneVerified = (phone: string) => {
    return phone && phone.trim().length > 5 && !phone.includes("temp")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-slate-600" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-serif text-slate-900 mb-2">Mi Perfil</h2>
        <p className="text-slate-600">Gestiona tu información personal</p>
      </div>

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
                  disabled={!isEmailTemporary(profile.email)}
                  className={!isEmailTemporary(profile.email) ? "bg-slate-50" : ""}
                  placeholder="tu@email.com"
                />
                {isEmailTemporary(profile.email) && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Actualiza tu email temporal a uno real para recibir notificaciones
                  </p>
                )}
                {!isEmailTemporary(profile.email) && (
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
                />
              </div>
              <div className="flex space-x-2 pt-2">
                <Button onClick={handleSave} disabled={saving} className="bg-slate-900 hover:bg-slate-800 font-serif">
                  {saving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Guardar Cambios
                </Button>
                <Button onClick={() => setIsEditing(false)} variant="outline">
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-slate-600 text-sm">Nombre</Label>
                  <p className="text-lg font-medium text-slate-900 mt-1">{profile.first_name || "No especificado"}</p>
                </div>
                <div>
                  <Label className="text-slate-600 text-sm">Apellido</Label>
                  <p className="text-lg font-medium text-slate-900 mt-1">{profile.last_name || "No especificado"}</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Label className="text-slate-600 text-sm">Email</Label>
                  {isEmailVerified(profile.email) && (
                    <Badge className="bg-green-50 text-green-700 border-green-200 text-xs px-2 py-0.5">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      VERIFICADO
                    </Badge>
                  )}
                  {!isEmailVerified(profile.email) && (
                    <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs px-2 py-0.5">Temporal</Badge>
                  )}
                </div>
                <p className="text-base font-medium text-slate-900 break-all">{profile.email}</p>
                {!isEmailVerified(profile.email) && (
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Por favor, actualiza tu email temporal a uno real para recibir notificaciones
                  </p>
                )}
              </div>

              <div className="border-t border-slate-100 pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Label className="text-slate-600 text-sm">Teléfono</Label>
                  {isPhoneVerified(profile.phone) && (
                    <Badge className="bg-green-50 text-green-700 border-green-200 text-xs px-2 py-0.5">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      VERIFICADO
                    </Badge>
                  )}
                </div>
                <p className="text-base font-medium text-slate-900">{profile.phone || "No especificado"}</p>
                {!isPhoneVerified(profile.phone) && (
                  <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Agrega tu número de teléfono para recibir notificaciones importantes
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

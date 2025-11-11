"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../../hooks/useAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Edit, Save, X } from "lucide-react"
import { supabase } from "../../lib/supabaseClient"

interface UserProfile {
  first_name: string
  last_name: string
  email: string
  phone: string
}

export default function PerfilPage() {
  const { user } = useAuth()
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
  }, [user])

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email,
          phone: profile.phone,
          updated_at: new Date().toISOString(),
        })
        .select()

      if (error) throw error

      setIsEditing(false)
    } catch (error) {
      console.error("Error saving profile:", error)
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
                  <Label htmlFor="first_name">Nombre</Label>
                  <Input
                    id="first_name"
                    value={profile.first_name}
                    onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                    placeholder="María"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Apellido</Label>
                  <Input
                    id="last_name"
                    value={profile.last_name}
                    onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                    placeholder="García"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  disabled={
                    !profile.email.includes("@phone.semzoprive.com") && !profile.email.includes("@temp.semzoprive.com")
                  }
                  className={
                    !profile.email.includes("@phone.semzoprive.com") && !profile.email.includes("@temp.semzoprive.com")
                      ? "bg-slate-50"
                      : ""
                  }
                  placeholder="tu@email.com"
                />
                {(profile.email.includes("@phone.semzoprive.com") ||
                  profile.email.includes("@temp.semzoprive.com")) && (
                  <p className="text-xs text-amber-600 mt-1">Actualiza tu email temporal a uno real</p>
                )}
                {!profile.email.includes("@phone.semzoprive.com") &&
                  !profile.email.includes("@temp.semzoprive.com") && (
                    <p className="text-xs text-slate-500 mt-1">El email no se puede cambiar</p>
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
                <p className="text-lg font-medium text-slate-900">{profile.email}</p>
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
